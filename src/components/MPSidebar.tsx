import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  User,
  Activity,
  MapPin,
  HelpCircle,
  Users,
  Sparkles,
  Bot,
  LogOut
} from 'lucide-react';
import { useMPSession } from '../contexts/MPSessionContext';

export const MPSidebar: React.FC = () => {
  const { exitMPMode } = useMPSession();
  const navigate = useNavigate();
  const [hoveredIdx, setHoveredIdx] = useState<string | null>(null);

  const handleExit = () => {
    exitMPMode();
    navigate('/');
  };

  const topNavItems = [
    { id: 'dashboard', to: '/mp/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'recommendations', to: '/mp/recommendations', label: 'Decision Cockpit', icon: Activity },
    { id: 'development', to: '/mp/development', label: 'Development Intel', icon: Users },
    { id: 'map', to: '/mp/map', label: 'Ward Map', icon: MapPin }
  ];

  const bottomNavItems = [
    { id: 'settings', to: '/mp/settings', label: 'System Settings', icon: Settings },
    { id: 'exit', action: handleExit, label: 'Sign Out / Exit', icon: LogOut }
  ];

  return (
    <aside 
      style={{
        width: '68px',
        minWidth: '68px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#18181B', // Dark zinc theme
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        zIndex: 1000,
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
        borderTopRightRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
      }}
    >
      {/* Brand Icon */}
      <div style={{ position: 'relative' }}>
        <div 
          onMouseEnter={() => setHoveredIdx('brand')}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ 
            width: '42px', 
            height: '42px', 
            backgroundColor: '#ffffff', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,255,255,0.15)'
          }}
          onClick={() => navigate('/mp/dashboard')}
        >
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#18181B', letterSpacing: '-0.05em' }}>C</span>
        </div>
        {hoveredIdx === 'brand' && (
          <div style={tooltipStyle}>
            CivicPulse Ward Portal
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center' }}>
          {topNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <NavLink
                  to={item.to}
                  onMouseEnter={() => setHoveredIdx(item.id)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                    color: isActive ? '#ffffff' : '#A1A1AA',
                    transition: 'all 0.15s ease'
                  })}
                >
                  {({ isActive }) => (
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  )}
                </NavLink>
                {hoveredIdx === item.id && (
                  <div style={tooltipStyle}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Assistant Logo Button (Right after Location / Ward Map Icon) */}
          <div style={{ position: 'relative', marginTop: '4px' }}>
            <button
              onMouseEnter={() => setHoveredIdx('ai-assistant')}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => navigate('/mp/recommendations')}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s ease, boxShadow 0.2s ease'
              }}
            >
              <Sparkles size={20} className="animate-pulse" />
            </button>
            {hoveredIdx === 'ai-assistant' && (
              <div style={tooltipStyle}>
                AI Copilot & Assistant
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', alignItems: 'center', marginTop: 'auto' }}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          if (item.to) {
            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <NavLink
                  to={item.to}
                  onMouseEnter={() => setHoveredIdx(item.id)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.16)' : 'transparent',
                    color: isActive ? '#ffffff' : '#A1A1AA',
                    transition: 'all 0.15s ease'
                  })}
                >
                  {({ isActive }) => (
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  )}
                </NavLink>
                {hoveredIdx === item.id && (
                  <div style={tooltipStyle}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          }
          return (
            <div key={item.id} style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setHoveredIdx(item.id)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={item.action}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'transparent',
                  color: '#A1A1AA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={20} strokeWidth={1.75} />
              </button>
              {hoveredIdx === item.id && (
                <div style={{ ...tooltipStyle, color: '#EF4444' }}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Profile Circle at bottom */}
        <div style={{ position: 'relative', marginTop: '4px' }}>
          <div 
            onMouseEnter={() => setHoveredIdx('profile')}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ 
              width: '38px', 
              height: '38px', 
              backgroundColor: '#ffffff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#18181B' }}>MP</span>
          </div>
          {hoveredIdx === 'profile' && (
            <div style={tooltipStyle}>
              MP Ward Administrator
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  left: '56px',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: '#09090B',
  color: '#FAFAFA',
  fontSize: '12px',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: '8px',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  zIndex: 9999,
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
};
