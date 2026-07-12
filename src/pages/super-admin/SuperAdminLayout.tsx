import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageCode } from '../../i18n';
import {
  LayoutDashboard, Globe, Building2, Map, Layers,
  Shield, Users, UserCog, BarChart2, Bot, Terminal,
  ClipboardList, Settings, Key, Plug, LogOut,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';

interface NavSection {
  heading: string;
  items: { labelKey: string; path: string; icon: React.ReactNode }[];
}

const navSections: NavSection[] = [
  {
    heading: 'OVERVIEW',
    items: [
      { labelKey: 'superadmin.nav.dashboard', path: '/super-admin/dashboard', icon: <LayoutDashboard size={15} /> },
    ],
  },
  {
    heading: 'GOVERNANCE',
    items: [
      { labelKey: 'superadmin.nav.municipalities', path: '/super-admin/municipalities', icon: <Globe size={15} /> },
      { labelKey: 'superadmin.nav.departments',    path: '/super-admin/departments',    icon: <Building2 size={15} /> },
      { labelKey: 'superadmin.nav.nationalMap',    path: '/super-admin/map',            icon: <Map size={15} /> },
    ],
  },
  {
    heading: 'USER MANAGEMENT',
    items: [
      { labelKey: 'superadmin.nav.admins',    path: '/super-admin/admins',    icon: <Shield size={15} /> },
      { labelKey: 'superadmin.nav.users',     path: '/super-admin/users',     icon: <Users size={15} /> },
      { labelKey: 'superadmin.nav.roles',     path: '/super-admin/roles',     icon: <UserCog size={15} /> },
    ],
  },
  {
    heading: 'INTELLIGENCE',
    items: [
      { labelKey: 'superadmin.nav.analytics',    path: '/super-admin/analytics',    icon: <BarChart2 size={15} /> },
      { labelKey: 'superadmin.nav.aiMonitoring', path: '/super-admin/ai',          icon: <Bot size={15} /> },
      { labelKey: 'superadmin.nav.systemLogs',   path: '/super-admin/logs',         icon: <Terminal size={15} /> },
      { labelKey: 'superadmin.nav.auditReports',  path: '/super-admin/audit',       icon: <ClipboardList size={15} /> },
    ],
  },
  {
    heading: 'SYSTEM',
    items: [
      { labelKey: 'superadmin.nav.config',       path: '/super-admin/config',       icon: <Layers size={15} /> },
      { labelKey: 'superadmin.nav.settings',     path: '/super-admin/settings',     icon: <Settings size={15} /> },
      { labelKey: 'superadmin.nav.integrations',  path: '/super-admin/integrations', icon: <Plug size={15} /> },
    ],
  },
];

const SuperAdminLayout: React.FC = () => {
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
        width: collapsed ? 56 : 230,
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
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--warning)" />
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  {t('superadmin.portal')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: 1 }}>
                  {t('superadmin.platformControl')}
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

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {navSections.map(section => (
            <div key={section.heading} style={{ marginBottom: 4 }}>
              {!collapsed && (
                <div style={{
                  padding: '10px 16px 4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  letterSpacing: '0.08em',
                  color: 'var(--text-3)',
                }}>
                  {section.heading}
                </div>
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? t(item.labelKey) : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '9px 0' : '8px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    color: isActive ? 'var(--primary)' : 'var(--text-2)',
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  })}
                >
                  {item.icon}
                  {!collapsed && t(item.labelKey)}
                </NavLink>
              ))}
            </div>
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

        {/* Footer */}
        <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.displayName ?? 'Super Admin'}
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? t('superadmin.signOut') : undefined}
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
            {!collapsed && t('superadmin.signOut')}
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

export default SuperAdminLayout;
