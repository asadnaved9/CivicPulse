import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  userRole: 'citizen' | 'mp';
  setUserRole: (role: 'citizen' | 'mp') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<'citizen' | 'mp'>(() => {
    const saved = localStorage.getItem('civicpulse_user_role');
    return (saved === 'mp' || saved === 'citizen') ? saved : 'citizen';
  });

  const setUserRole = (role: 'citizen' | 'mp') => {
    setUserRoleState(role);
    localStorage.setItem('civicpulse_user_role', role);
    toast.success(`Switched view to ${role === 'mp' ? 'MP' : 'Citizen'} persona`);
  };

  const fetchProfile = async (uid: string, currentUser: User) => {
    if (!isFirebaseConfigured) return;
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setProfile(userSnap.data() as UserProfile);
      } else {
        // Create user document if it doesn't exist
        const newProfile: UserProfile = {
          uid: uid,
          displayName: currentUser.displayName || (currentUser.isAnonymous ? 'Anonymous Citizen' : 'Citizen'),
          photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}`,
          points: 0,
          badges: [],
          issuesReported: 0,
          issuesResolved: 0,
          joinedAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
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
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
      await signInWithPopup(auth, provider);
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
      await signInAnonymously(auth);
      toast.success("Signed in anonymously");
    } catch (err: any) {
      console.error("Anonymous Login Error:", err);
      setLoading(false);
      
      if (err.code === 'auth/admin-restricted-operation' || err.message?.includes('admin-restricted-operation')) {
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

  const logout = async () => {
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

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginWithGoogle,
      loginAnonymously,
      logout,
      refreshProfile,
      userRole,
      setUserRole
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
