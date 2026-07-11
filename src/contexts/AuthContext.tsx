import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserRole } from '../types/roles';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  points: number;
  badges: string[];
  issuesReported: number;
  issuesResolved: number;
  joinedAt: any;
  // RBAC fields
  role?: UserRole;
  status?: 'active' | 'suspended' | 'inactive';
  municipalityId?: string;
  createdBy?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);

  const userRef = React.useRef<User | null>(null);
  const profileRef = React.useRef<UserProfile | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Tab-isolated demo helper for hackathons (reads ?mock_role=admin or ?mock_role=super_admin)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mockParam = params.get('mock_role');
      if (mockParam) {
        if (mockParam === 'clear' || mockParam === 'citizen') {
          sessionStorage.removeItem('civicpulse_session_role');
          setSessionRole(null);
          toast.success("Tab role reset to standard auth");
        } else if (mockParam === 'admin' || mockParam === 'super_admin') {
          sessionStorage.setItem('civicpulse_session_role', mockParam);
          setSessionRole(mockParam);
          toast.success(`Demo mode: Tab locked to ${mockParam.toUpperCase()}`);
        }
        // Clean URL query params for a professional look
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      } else {
        const saved = sessionStorage.getItem('civicpulse_session_role');
        if (saved === 'admin' || saved === 'super_admin') {
          setSessionRole(saved as UserRole);
        }
      }
    } catch (e) {
      console.error("Failed to initialize tab-isolated demo mode:", e);
    }
  }, []);

  const fetchProfile = async (uid: string, currentUser: User): Promise<void> => {
    if (!isFirebaseConfigured) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        
        // Self-healing: if this is a seed email but doesn't have the correct admin role yet, update it
        let targetRole = data.role;
        const updates: Partial<UserProfile> = {};

        if (currentUser.email === 'admin@civicpulse.gov.in' && 
            (data.role !== 'admin' || data.municipalityId !== 'Kolkata Municipality' || data.displayName !== 'Ward Admin')) {
          targetRole = 'admin';
          updates.role = 'admin';
          updates.municipalityId = 'Kolkata Municipality';
          updates.displayName = 'Ward Admin';
        } else if (currentUser.email === 'superadmin@civicpulse.gov.in' && data.role !== 'super_admin') {
          targetRole = 'super_admin';
          updates.role = 'super_admin';
          updates.displayName = 'CTO & Platform Admin';
        }

        if (Object.keys(updates).length > 0) {
          console.log(`[AuthContext] Upgrading existing seed user ${currentUser.email} to ${targetRole}`);
          try {
            await updateDoc(userRef, updates);
            data.role = targetRole;
            if (updates.municipalityId) data.municipalityId = updates.municipalityId;
            if (updates.displayName) data.displayName = updates.displayName;
          } catch (updateErr) {
            console.error('[AuthContext] Failed to auto-elevate seed user role in Firestore:', updateErr);
          }
        }

        setProfile(data);
        setRole(data.role ?? 'citizen');
      } else {
        // Check if this is one of our special seed emails
        let userRole: UserRole = 'citizen';
        let displayName = currentUser.displayName || (currentUser.isAnonymous ? 'Anonymous Citizen' : 'Citizen');
        let municipalityId: string | undefined = undefined;

        if (currentUser.email === 'admin@civicpulse.gov.in') {
          userRole = 'admin';
          displayName = 'Ward Admin';
          municipalityId = 'Kolkata Municipality';
        } else if (currentUser.email === 'superadmin@civicpulse.gov.in') {
          userRole = 'super_admin';
          displayName = 'CTO & Platform Admin';
        }

        // Create user document if it doesn't exist
        const newProfile: UserProfile = {
          uid: uid,
          displayName: displayName,
          email: currentUser.email || undefined,
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
          points: userRole === 'super_admin' ? 5000 : userRole === 'admin' ? 1200 : 0,
          badges: userRole === 'super_admin' ? ["Founder", "Architect"] : userRole === 'admin' ? ["Staff", "Warden"] : [],
          issuesReported: 0,
          issuesResolved: 0,
          joinedAt: serverTimestamp(),
          role: userRole,
          status: 'active',
          municipalityId: municipalityId
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
        setRole(userRole);
      }
    } catch (err) {
      console.error('Error fetching/creating user profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Skip redundant loading/fetching if user profile is already resolved by login functions
      if (currentUser && userRef.current && currentUser.uid === userRef.current.uid && profileRef.current) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setUser(currentUser);
      try {
        if (currentUser) {
          await fetchProfile(currentUser.uid, currentUser);
        } else {
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error("[AuthContext] Auth state change listener error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase is not configured yet.");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      if (userCredential.user) {
        await fetchProfile(userCredential.user.uid, userCredential.user);
        setUser(userCredential.user);
      }
      setLoading(false);
      toast.success("Signed in successfully with Google");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      toast.error(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const loginAnonymously = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Firebase is not configured yet.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      if (userCredential.user) {
        await fetchProfile(userCredential.user.uid, userCredential.user);
        setUser(userCredential.user);
      }
      setLoading(false);
      toast.success("Signed in anonymously");
    } catch (err: any) {
      console.error("Anonymous Login Error:", err);
      setLoading(false);
      
      if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('auth/admin-restricted-operation')) {
        const projectId = auth.app.options.projectId || 'your-project-id';
        const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
        
        toast((t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
            <span style={{ fontWeight: 600, color: '#E11D48', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⚠️ Anonymous Sign-In Disabled
            </span>
            <span style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
              Anonymous authentication is disabled in your Firebase project. To enable it, visit your Firebase console and turn on the "Anonymous" provider under Sign-in methods.
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <a 
                href={consoleUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  background: 'var(--primary)', 
                  color: '#FFF', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
                onClick={() => toast.dismiss(t.id)}
              >
                Enable in Firebase Console
              </a>
              <button 
                onClick={() => toast.dismiss(t.id)}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text-1)', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  cursor: 'pointer' 
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        ), {
          duration: 15000,
          style: {
            background: 'var(--surface-1)',
            border: '1.5px solid var(--border)',
            color: 'var(--text-1)',
            minWidth: '320px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
          }
        });
      } else {
        toast.error(err.message || "Failed to sign in anonymously");
      }
    }
  };

  const loginWithEmailPassword = async (email: string, password: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured yet.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await fetchProfile(userCredential.user.uid, userCredential.user);
        setUser(userCredential.user);
      }
      setLoading(false);
    } catch (err: any) {
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') &&
        ['admin@civicpulse.gov.in', 'superadmin@civicpulse.gov.in'].includes(email)
      ) {
        try {
          toast.loading('Initializing dummy workspace...', { id: 'seed-toast' });
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (userCredential.user) {
            await fetchProfile(userCredential.user.uid, userCredential.user);
            setUser(userCredential.user);
          }
          setLoading(false);
          toast.success('Dummy workspace created and seeded!', { id: 'seed-toast' });
          return;
        } catch (createErr: any) {
          console.error('Failed to auto-create seed user:', createErr);
          toast.error('Seeding failed: ' + (createErr.message || 'Unknown error'), { id: 'seed-toast' });
          setLoading(false);
        }
      } else {
        console.error('Email/Password Sign-In Error:', err);
        toast.error(err.message || 'Failed to sign in');
        setLoading(false);
      }
    }
  };

  const logout = async (): Promise<void> => {
    if (!isFirebaseConfigured) return;
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      toast.success("Signed out successfully");
    } catch (err: any) {
      console.error("Logout Error:", err);
      toast.error("Failed to sign out");
    }
  };

  // Calculate effective states checking if tab-isolated demo overrides are active
  const effectiveRole = sessionRole || role;
  const effectiveLoading = sessionRole ? false : loading;
  
  const effectiveProfile = sessionRole 
    ? {
        uid: 'mock_demo_uid',
        displayName: sessionRole === 'super_admin' ? 'CTO & Platform Admin (Demo)' : 'Ward Admin (Demo)',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${sessionRole}`,
        points: sessionRole === 'super_admin' ? 5000 : 1200,
        badges: sessionRole === 'super_admin' ? ["Founder", "Architect"] : ["Staff", "Warden"],
        issuesReported: 12,
        issuesResolved: 8,
        joinedAt: new Date(),
        role: sessionRole,
        status: 'active' as const,
        municipalityId: sessionRole === 'admin' ? 'Kolkata Municipality' : undefined
      }
    : profile;

  const effectiveUser = sessionRole 
    ? ({
        uid: 'mock_demo_uid',
        email: sessionRole === 'super_admin' ? 'superadmin@civicpulse.gov.in' : 'admin@civicpulse.gov.in',
        displayName: sessionRole === 'super_admin' ? 'CTO & Platform Admin' : 'Ward Admin'
      } as any)
    : user;

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      profile: effectiveProfile,
      role: effectiveRole,
      loading: effectiveLoading,
      loginWithGoogle,
      loginAnonymously,
      loginWithEmailPassword,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
