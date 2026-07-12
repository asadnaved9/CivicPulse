import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, PlusCircle, LogIn, LogOut, User, MapPin, Menu, X, Check, Eye, Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { useLanguage } from '../contexts/LanguageContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, profile, loginWithGoogle, loginAnonymously, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const handleOpenAuthModal = () => setShowAuthModal(true);
    window.addEventListener('open-auth-modal', handleOpenAuthModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuthModal);
  }, []);

  // Sync real-time unread notifications
  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setNotifications(list);
    }, (err) => {
      console.error("Failed to load notifications:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notif: any) => {
    setShowNotifDropdown(false);
    try {
      const docRef = doc(db, 'notifications', notif.id);
      await updateDoc(docRef, { read: true });
      navigate(`/issue/${notif.issueId}`);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setShowNotifDropdown(false);
    try {
      const promises = notifications.map(notif => {
        const docRef = doc(db, 'notifications', notif.id);
        return updateDoc(docRef, { read: true });
      });
      await Promise.all(promises);
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="navbar" id="app-navbar" style={{ position: 'relative' }}>
        <div className="navbar-left">
          <Link to="/" className="navbar-brand" onClick={handleLinkClick}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} className="navbar-brand-dot" />
              CivicPulse
            </span>
          </Link>
        </div>

        {/* Desktop Links (Hidden on Mobile) */}
        <div className="navbar-center hide-on-mobile">
          <Link to="/map" className={`navbar-link ${isActive('/map') ? 'active' : ''}`}>
            {t('nav.map')}
          </Link>
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            {t('nav.dashboard')}
          </Link>
          <Link to="/insights" className={`navbar-link ${isActive('/insights') ? 'active' : ''}`}>
            {t('nav.insights')}
          </Link>
          <Link to="/community" className={`navbar-link ${isActive('/community') ? 'active' : ''}`}>
            {t('nav.community')}
          </Link>
        </div>

        <div className="navbar-right">
          {/* Theme Toggle Button (Always Visible) */}
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={16} style={{ color: '#F59E0B' }} /> : <Moon size={16} style={{ color: 'var(--text-2)' }} />}
          </button>

          {/* Notification Bell (Always Visible) */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%', border: 'none', position: 'relative' }}
                title="Notifications"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell size={16} style={{ color: 'var(--text-2)' }} />
                {notifications.length > 0 && (
                  <span 
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--danger)',
                      display: 'block'
                    }}
                  />
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifDropdown && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: '-12px',
                    width: '290px',
                    maxWidth: 'calc(100vw - 24px)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '400px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>
                      {t('nav.alerts')} ({notifications.length})
                    </span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                      >
                        {t('nav.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            transition: 'background 0.2s',
                            textAlign: 'left'
                          }}
                          className="hover-card"
                        >
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-1)', lineHeight: '1.3', wordBreak: 'break-word' }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={10} /> {t('nav.clickToView')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                        {t('nav.noUnread')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              {/* Desktop Only Buttons */}
              <Link to="/report" className="btn btn-primary hide-on-mobile" style={{ padding: '8px 14px' }}>
                <PlusCircle size={15} />
                {t('nav.reportIssue')}
              </Link>

              <Link 
                to="/profile" 
                className="btn btn-secondary hide-on-mobile" 
                style={{ 
                  padding: '4px 8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: 'var(--surface-2)',
                  borderColor: 'var(--border)'
                }}
              >
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`} 
                  alt="Avatar" 
                  style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-1)' }}>
                  {profile?.points ?? 0} pts
                </span>
              </Link>

              <button 
                onClick={logout} 
                className="btn btn-danger hide-on-mobile" 
                style={{ padding: '8px', borderRadius: '50%' }}
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="btn btn-primary hide-on-mobile"
              style={{ padding: '8px 14px' }}
            >
              <LogIn size={15} />
              {t('nav.signIn')}
            </button>
          )}

          {/* Mobile Hamburger Menu Icon (Visible only on Mobile) */}
          <button
            className="btn btn-secondary show-on-mobile-inline"
            style={{ padding: '8px', border: 'none', marginLeft: '4px' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="show-on-mobile"
          style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 24px',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <Link 
            to="/map" 
            className={`navbar-link ${isActive('/map') ? 'active' : ''}`}
            style={{ height: '40px', borderBottom: 'none' }}
            onClick={handleLinkClick}
          >
            {t('nav.map')}
          </Link>
          <Link 
            to="/dashboard" 
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
            style={{ height: '40px', borderBottom: 'none' }}
            onClick={handleLinkClick}
          >
            {t('nav.dashboard')}
          </Link>
          <Link 
            to="/insights" 
            className={`navbar-link ${isActive('/insights') ? 'active' : ''}`}
            style={{ height: '40px', borderBottom: 'none' }}
            onClick={handleLinkClick}
          >
            {t('nav.insights')}
          </Link>
          <Link 
            to="/community" 
            className={`navbar-link ${isActive('/community') ? 'active' : ''}`}
            style={{ height: '40px', borderBottom: 'none' }}
            onClick={handleLinkClick}
          >
            {t('nav.community')}
          </Link>

          {user ? (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <Link 
                to="/report" 
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '10px' }}
                onClick={handleLinkClick}
              >
                <PlusCircle size={15} />
                {t('nav.reportIssue')}
              </Link>
              <Link 
                to="/profile" 
                className="btn btn-secondary"
                style={{ justifyContent: 'center', padding: '10px' }}
                onClick={handleLinkClick}
              >
                <User size={15} />
                {t('nav.myProfile')} ({profile?.points ?? 0} {t('profile.points')})
              </Link>
              <button 
                onClick={() => {
                  logout();
                  handleLinkClick();
                }} 
                className="btn btn-danger"
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <LogOut size={15} />
                {t('profile.logout')}
              </button>
            </>
          ) : (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
              <button 
                onClick={() => {
                  setShowAuthModal(true);
                  handleLinkClick();
                }} 
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <LogIn size={15} />
                {t('nav.signIn')}
              </button>
            </>
          )}
        </div>
      )}

      {/* Auth Modal overlay if clicked */}
      {showAuthModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '360px', 
              width: '100%', 
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0 }}>{t('nav.joinTitle')}</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {t('nav.joinDesc')}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={async () => {
                setShowAuthModal(false);
                await loginWithGoogle();
              }}
            >
              {t('nav.signInGoogle')}
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={async () => {
                setShowAuthModal(false);
                await loginAnonymously();
              }}
            >
              {t('nav.continueAnon')}
            </button>
            <button 
              className="btn text-muted" 
              style={{ background: 'transparent', alignSelf: 'center', fontSize: '12px', padding: '4px' }}
              onClick={() => setShowAuthModal(false)}
            >
              {t('nav.cancel')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
