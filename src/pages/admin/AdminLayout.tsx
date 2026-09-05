import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { useMPSession } from '../../contexts/MPSessionContext';
import {
  LayoutDashboard, FileText, Users, Map, BarChart2,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, Shield, ClipboardCheck, Wrench, Sparkles,
  TrendingUp, Layers, ArrowLeft
} from 'lucide-react';

interface NavItem {
  label: string;
  translationKey?: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Admin Cockpit', translationKey: 'admin.nav.dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Hazard Complaints', translationKey: 'admin.nav.complaints', path: '/admin/complaints', icon: <FileText size={16} /> },
  { label: 'Asset Inventory', translationKey: 'admin.nav.assets', path: '/admin/assets', icon: <Wrench size={16} /> },
  { label: 'Ward Radar Map', translationKey: 'admin.nav.map', path: '/admin/map', icon: <Map size={16} /> },
  { label: 'Decision Cockpit', translationKey: 'admin.nav.recommendations', path: '/admin/recommendations', icon: <Sparkles size={16} /> },
  { label: 'Capital Planning', translationKey: 'admin.nav.development', path: '/admin/development', icon: <TrendingUp size={16} /> },
  { label: 'Field Assignments', translationKey: 'admin.nav.assignments', path: '/admin/assignments', icon: <ClipboardCheck size={16} /> },
  { label: 'Inspector Panel', translationKey: 'admin.nav.inspectorPanel', path: '/admin/inspector', icon: <Shield size={16} /> },
  { label: 'Departments', translationKey: 'admin.nav.departments', path: '/admin/departments', icon: <Building2 size={16} /> },
  { label: 'Dependencies', translationKey: 'admin.nav.dependencies', path: '/admin/dependencies', icon: <Layers size={16} /> },
  { label: 'Field Workers', translationKey: 'admin.nav.workers', path: '/admin/workers', icon: <Users size={16} /> },
  { label: 'Analytics', translationKey: 'admin.nav.analytics', path: '/admin/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Notifications', translationKey: 'admin.nav.notifications', path: '/admin/notifications', icon: <Bell size={16} /> },
  { label: 'Settings', translationKey: 'admin.nav.settings', path: '/admin/settings', icon: <Settings size={16} /> },
];

const AdminLayout: React.FC = () => {
  const { profile, logout, setUserRole } = useAuth();
  const { exitMPMode } = useMPSession();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleExitAdmin = (): void => {
    exitMPMode();
    setUserRole('citizen');
    localStorage.removeItem('civicpulse_admin_session');
    navigate('/');
  };

  const handleLogout = async (): Promise<void> => {
    exitMPMode();
    setUserRole('citizen');
    localStorage.removeItem('civicpulse_admin_session');
    await logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 58 : 230,
        minHeight: '100vh',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        zIndex: 50
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? '16px 0' : '16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={18} color="var(--primary)" />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  CIVICPULSE ULB
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)', marginTop: 1 }}>
                  Ward Admin Portal
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(item => {
            const itemLabel = item.translationKey && t(item.translationKey) !== item.translationKey 
              ? t(item.translationKey) 
              : item.label;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? itemLabel : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '9px 0' : '8px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: isActive ? 'var(--primary)' : 'var(--text-2)',
                  background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                })}
              >
                {item.icon}
                {!collapsed && <span>{itemLabel}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Language selector in sidebar */}
        {!collapsed && (
          <div style={{ padding: '0 14px 10px 14px' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-2)',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        )}

        {/* Footer: Exit to Citizen View + Logout */}
        <div style={{ padding: collapsed ? '10px 0' : '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={handleExitAdmin}
            title={collapsed ? "Exit to Citizen View" : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              padding: '7px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-2)',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
          >
            <ArrowLeft size={14} />
            {!collapsed && "Citizen Portal"}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? t('admin.signOut') : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              padding: '7px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              fontSize: '11px',
              fontWeight: 500,
              borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <LogOut size={14} />
            {!collapsed && t('admin.signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
