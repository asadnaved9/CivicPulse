import React, { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, Globe, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlatformKPI {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  sublabel: string;
}

const SuperAdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState<PlatformKPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchKpis = async (): Promise<void> => {
      try {
        const [totalUsers, totalIssues] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'issues')),
        ]);

        setKpis([
          {
            label: 'Total Users',
            value: totalUsers.data().count,
            icon: <Users size={18} />,
            sublabel: 'Registered on platform',
          },
          {
            label: 'Total Issues',
            value: totalIssues.data().count,
            icon: <FileText size={18} />,
            sublabel: 'Across all municipalities',
          },
          {
            label: 'Municipalities',
            value: '—',
            icon: <Globe size={18} />,
            sublabel: 'Configure in Governance',
          },
          {
            label: 'Platform Status',
            value: 'LIVE',
            icon: <Zap size={18} />,
            sublabel: 'All systems operational',
          },
        ]);
      } catch (err) {
        console.error('Failed to load platform KPIs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.08em',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          SUPER ADMIN / PLATFORM CONTROL
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          fontWeight: 600,
          color: 'var(--text-1)',
          marginBottom: 4,
        }}>
          Platform Overview
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Signed in as {profile?.displayName ?? 'Super Admin'} — full system access
        </p>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 100, borderRadius: 8 }} />
            ))
          : kpis.map(kpi => (
              <div key={kpi.label} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {kpi.label}
                  </span>
                  <span style={{ color: 'var(--primary)' }}>{kpi.icon}</span>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                  {kpi.value}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{kpi.sublabel}</span>
              </div>
            ))
        }
      </div>

      {/* Quick Access grid */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>
          MANAGEMENT SHORTCUTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'Manage Admins',    path: '/super-admin/admins',         desc: 'Onboard or suspend municipality admins' },
            { label: 'All Users',        path: '/super-admin/users',          desc: 'View and manage the citizen user base' },
            { label: 'Municipalities',   path: '/super-admin/municipalities', desc: 'Configure geographic hierarchy' },
            { label: 'System Logs',      path: '/super-admin/logs',           desc: 'Real-time and historical logs' },
            { label: 'AI Monitoring',    path: '/super-admin/ai',             desc: 'Gemini pipeline performance metrics' },
            { label: 'Audit Reports',    path: '/super-admin/audit',          desc: 'Full audit trail of admin actions' },
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</span>
                <ArrowRight size={13} color="var(--text-3)" />
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>{item.desc}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SuperAdminDashboardPage;
