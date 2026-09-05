import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { 
  Award, ThumbsUp, Calendar, AlertTriangle, Lightbulb, 
  Droplet, Trash2, HelpCircle, User, LogOut, ArrowRight, MapPin,
  Globe, Shield, Settings, Check, LogIn
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    user, 
    profile, 
    logout, 
    userRole, 
    setUserRole, 
    loginWithGoogle, 
    loginAnonymously 
  } = useAuth();
  
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [userIssues, setUserIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync user's reported issues in real-time if logged in
  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'issues'),
      where('reportedBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side by date desc
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setUserIssues(list);
      setLoading(false);
    }, (error) => {
      console.error("Failed to sync user reported issues:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pothole': return <AlertTriangle size={14} />;
      case 'streetlight': return <Lightbulb size={14} />;
      case 'water': return <Droplet size={14} />;
      case 'waste': return <Trash2 size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'verified': return 'badge-primary';
      default: return 'badge-neutral';
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Settings className="text-primary" size={28} />
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
            {t('profileTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-3)', margin: '4px 0 0 0' }}>
            Customize your language, interface role, and view municipal activity.
          </p>
        </div>
      </div>

      {/* 1. App Settings Preferences Panel (Always Functional & Visible) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Globe size={18} className="text-primary" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
            {t('changeLanguage')}
          </h2>
        </div>

        {/* Language Selection Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { code: 'en', label: 'English', native: 'English' },
            { code: 'bn', label: 'Bengali', native: 'বাংলা' },
            { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
            { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
          ].map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as Language)}
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  flex: '1 1 180px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '13px'
                }}
              >
                <span>{lang.native} ({lang.label})</span>
                {isSelected && <Check size={14} />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginTop: '10px' }}>
          <Shield size={18} className="text-primary" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
            System Interface Role
          </h2>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-3)', margin: 0 }}>
          You are currently in the Citizen Public View. Access to the MP Decision Cockpit, Knapsack Budget Planner, and Proposal Management is secured via the authorized MP Portal.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/mp/login')}
            className="btn btn-secondary"
            style={{ padding: '10px 20px', flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Shield size={16} style={{ color: '#3b82f6' }} />
            <span>Open MP & Administration Portal (/mp/login) →</span>
          </button>
        </div>
      </div>

      {/* 2. User Identity Panel Card */}
      {user ? (
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', background: 'var(--surface)' }}>
          <img 
            src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.displayName || user.uid}`} 
            alt={profile?.displayName || 'Citizen'}
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              border: '2px solid var(--primary)',
              background: 'var(--surface-2)' 
            }}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>
                  {profile?.displayName || 'Citizen Advocate'}
                </h2>
                <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  CREDENTIALS: {user.uid}
                </span>
              </div>

              <button 
                onClick={logout} 
                className="btn btn-secondary text-xs"
                style={{ padding: '6px 12px' }}
              >
                <LogOut size={13} />
                {t('signOut')}
              </button>
            </div>

            {/* Official Verification Details */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                  {t('citizenStatus')}
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {t('verifiedResident')}
                </strong>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--border)', alignSelf: 'center' }} />

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                  {t('submissions')}
                </span>
                <strong style={{ fontSize: '13px', color: 'var(--text-1)', fontWeight: 600 }}>
                  {profile?.points ?? 0} {t('points')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <User size={48} className="text-muted" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{t('joinCivicPulse')}</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)', maxWidth: '440px', margin: 0 }}>
            {t('signInDesc')}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '380px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => loginWithGoogle()}
            >
              <LogIn size={16} />
              {t('signInGoogle')}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '12px' }}
              onClick={() => loginAnonymously()}
            >
              {t('continueAnon')}
            </button>
          </div>
        </div>
      )}

      {/* 3. Resident Constituency Context */}
      {user && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface)' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
              {t('registeredConstituency')}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              {t('constituencyDesc')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '4px' }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>{t('primarySector')}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{t('sectorVal')}</strong>
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>{t('assignedRep')}</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>{t('mpOffice')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. My Submissions List */}
      {user && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{t('myCivicReports')}</h2>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Synchronizing profile events...</span>
            </div>
          ) : userIssues.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userIssues.map((issue) => {
                const date = issue.createdAt?.seconds 
                  ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString()
                  : "Recently";

                return (
                  <div 
                    key={issue.id}
                    onClick={() => navigate(`/issue/${issue.id}`)}
                    className="card hover-card"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'row', 
                      gap: '20px', 
                      padding: '16px', 
                      alignItems: 'center', 
                      cursor: 'pointer' 
                    }}
                  >
                    {issue.imageUrl ? (
                      <img 
                        src={issue.imageUrl} 
                        alt={issue.title} 
                        style={{ width: '64px', height: '64px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div 
                        style={{ 
                          width: '64px', 
                          height: '64px', 
                          borderRadius: '4px', 
                          background: 'var(--surface-2)', 
                          border: '1px solid var(--border)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--text-3)',
                          flexShrink: 0
                        }}
                      >
                        {issue.category === 'pothole' && <AlertTriangle size={24} className="text-red-500" />}
                        {issue.category === 'streetlight' && <Lightbulb size={24} style={{ color: 'var(--text-1)' }} />}
                        {issue.category === 'water' && <Droplet size={24} className="text-blue-500" />}
                        {issue.category === 'waste' && <Trash2 size={24} className="text-green-500" />}
                        {issue.category === 'other' && <HelpCircle size={24} className="text-gray-400" />}
                        {!['pothole', 'streetlight', 'water', 'waste', 'other'].includes(issue.category) && <HelpCircle size={24} className="text-gray-400" />}
                      </div>
                    )}

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${getStatusBadgeClass(issue.status)}`}>
                          {issue.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                          Logged {date}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
                        {issue.title}
                      </h3>

                      <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        📍 {issue.address}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
                      <ThumbsUp size={13} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{(issue.upvotes || []).length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              style={{ 
                border: '1px dashed var(--border)', 
                borderRadius: '8px', 
                padding: '40px 24px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                {t('noReports')}
              </span>
              <button 
                onClick={() => navigate('/report')}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {t('reportFirst')}
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
