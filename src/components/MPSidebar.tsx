import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Sparkles, 
  Settings, 
  LogOut, 
  Shield, 
  ChevronRight,
  User,
  ChevronDown
} from 'lucide-react';
import { useMPSession } from '../contexts/MPSessionContext';
import { useLanguage, Language } from '../contexts/LanguageContext';

export const MPSidebar: React.FC = () => {
  const { exitMPMode } = useMPSession();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleExit = () => {
    exitMPMode();
    navigate('/');
  };

  // Keep exact side bar texts as they were in previous MPSidebar
  const navItems = [
    { to: '/mp/dashboard', label: 'Executive Brief', icon: LayoutDashboard },
    { to: '/mp/development', label: 'Development Intel', icon: TrendingUp },
    { to: '/mp/recommendations', label: 'Decision Cockpit', icon: Sparkles },
    { to: '/mp/settings', label: 'System Settings', icon: Settings }
  ];

  return (
    <aside 
      style={{
        width: '240px',
        minWidth: '240px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #eef2f6',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        zIndex: 100,
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div>
        {/* Top Header matching reference image:
            ADMIN PORTAL
            [Shield Icon] Bangalore Central  <
        */}
        <div style={{ marginBottom: '24px', padding: '0 8px' }}>
          <div 
            style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              marginBottom: '6px'
            }}
          >
            ADMIN PORTAL
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} strokeWidth={2} style={{ color: '#0f172a' }} />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', letterSpacing: '-0.01em' }}>
                Bangalore Central
              </span>
            </div>
            <div style={{ color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px' }}>&lt;</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? '#f8fafc' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  transition: 'all 0.15s ease'
                })}
              >
                <Icon size={17} strokeWidth={1.8} style={{ color: '#0f172a' }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom area matching reference image:
          - Language dropdown (e.g. English v)
          - Ward Admin icon / label
          - Sign Out
      */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
        {/* Language selector select box */}
        <div style={{ position: 'relative' }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#334155',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="es">Español</option>
          </select>
          <ChevronDown 
            size={14} 
            style={{ 
              position: 'absolute', 
              right: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none', 
              color: '#94a3b8' 
            }} 
          />
        </div>

        {/* Admin profile indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
          <User size={15} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
            MP / Ward Admin
          </span>
        </div>

        {/* Sign Out / Exit */}
        <button
          onClick={handleExit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
