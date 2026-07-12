import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageCode } from '../../i18n';
import {
  LayoutDashboard, FileText, Users, Map, BarChart2,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Building2, Shield, ClipboardCheck
} from 'lucide-react';

interface NavItem {
  translationKey: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { translationKey: 'admin.nav.dashboard',   path: '/admin/dashboard',   icon: <LayoutDashboard size={16} /> },
  { translationKey: 'admin.nav.complaints',  path: '/admin/complaints',  icon: <FileText size={16} /> },
  { translationKey: 'admin.nav.departments', path: '/admin/departments', icon: <Building2 size={16} /> },
  { translationKey: 'admin.nav.dependencies',path: '/admin/dependencies',icon: <Shield size={16} /> },
  { translationKey: 'admin.nav.workers',     path: '/admin/workers',     icon: <Users size={16} /> },
  { translationKey: 'admin.nav.assignments', path: '/admin/assignments', icon: <Users size={16} /> },
  { translationKey: 'admin.nav.inspectorPanel', path: '/admin/inspector', icon: <ClipboardCheck size={16} /> },
  { translationKey: 'admin.nav.map',         path: '/admin/map',         icon: <Map size={16} /> },
  { translationKey: 'admin.nav.analytics',   path: '/admin/analytics',   icon: <BarChart2 size={16} /> },
  { translationKey: 'admin.nav.notifications', path: '/admin/notifications', icon: <Bell size={16} /> },
  { translationKey: 'admin.nav.settings',    path: '/admin/settings',    icon: <Settings size={16} /> },
];

const AdminLayout: React.FC = () => {
  const { profile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 56 : 220,
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
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} color="var(--primary)" />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  {t('admin.portal')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: 1 }}>
                  {profile?.municipalityId ?? 'Municipality'}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0', overflow: 'hidden' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? t(item.translationKey) : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--primary)' : 'var(--text-2)',
                background: isActive ? 'var(--primary-subtle)' : 'transparent',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              {item.icon}
              {!collapsed && t(item.translationKey)}
            </NavLink>
          ))}
        </nav>

        {/* Language selector in sidebar */}
        {!collapsed && (
          <div style={{ padding: '0 16px 12px 16px' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
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
            </select>
          </div>
        )}

        {/* Footer: user info + logout */}
        <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Building2 size={14} color="var(--text-3)" />
              <span style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.displayName ?? 'Admin'}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? t('admin.signOut') : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              fontSize: '12px',
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
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
