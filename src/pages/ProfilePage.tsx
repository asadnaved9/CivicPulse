import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { 
  Award, ThumbsUp, Calendar, AlertTriangle, Lightbulb, 
  Droplet, Trash2, HelpCircle, User, LogOut, ArrowRight, MapPin, Globe
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageCode } from '../i18n';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [userIssues, setUserIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Sync user's reported issues in real-time
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

  if (!user) return null;

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
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* 1. Header Profile Panel Card */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
        <img 
          src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.displayName}`} 
          alt={profile?.displayName}
          style={{ 
            width: '96px', 
            height: '96px', 
            borderRadius: '50%', 
            border: '2px solid var(--primary)',
            background: 'var(--surface-2)' 
          }}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)' }}>
                {profile?.displayName || t('profile.citizenAdvocate')}
              </h1>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {t('profile.credentials')} {profile?.uid || user.uid}
              </span>
            </div>

            <button 
              onClick={logout} 
              className="btn btn-secondary text-xs"
              style={{ padding: '6px 12px' }}
            >
              <LogOut size={13} />
              {t('profile.logout')}
            </button>
          </div>

          {/* Points Strip */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                {t('profile.accumulatedScore')}
              </span>
              <strong style={{ fontSize: '20px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                {profile?.points || 0} {t('profile.points')}
              </strong>
            </div>

            <div style={{ width: '1px', height: '32px', background: 'var(--border)' }} />

            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                {t('profile.reportsSubmitted')}
              </span>
              <strong style={{ fontSize: '20px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                {userIssues.length} {t('profile.reports')}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unlocked Badges Row */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} style={{ color: 'var(--primary)' }} />
            {t('profile.unlockedBadges')}
          </h3>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {(profile?.badges || []).length > 0 ? (
            (profile?.badges || []).map((badge: string) => (
              <div 
                key={badge}
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px', 
                  padding: '8px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                <span style={{ fontSize: '16px' }}>🏆</span>
                <span>{badge}</span>
              </div>
            ))
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              {t('profile.noBadges')}
            </span>
          )}
        </div>
      </div>

      {/* Language Preferences Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} style={{ color: 'var(--primary)' }} />
            {t('profile.language')}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', marginLeft: '24px' }}>
            {t('profile.language.desc')}
          </p>
        </div>
        <div style={{ marginLeft: '24px' }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="en">{t('profile.language.en')}</option>
            <option value="hi">{t('profile.language.hi')}</option>
            <option value="bn">{t('profile.language.bn')}</option>
          </select>
        </div>
      </div>

      {/* 3. My Submissions List */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>{t('profile.myReports')}</h2>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>{t('profile.syncing')}</span>
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
                      {issue.category === 'streetlight' && <Lightbulb size={24} className="text-yellow-500" />}
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
                        {t('profile.logged')} {date}
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
              {t('profile.noReports')}
            </span>
            <button 
              onClick={() => navigate('/report')}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {t('profile.reportFirstIssue')}
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
