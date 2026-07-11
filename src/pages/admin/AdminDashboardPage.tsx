import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TranslationKey } from '../../i18n';
import { FileText, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface KPI {
  labelKey: TranslationKey;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribe = onSnapshot(issuesRef, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data()).filter(d => d.status !== 'duplicate');
      const openCount = docs.filter(d => d.status === 'reported' || d.status === 'verified').length;
      const inProgressCount = docs.filter(d => d.status === 'in_progress').length;
      const resolvedCount = docs.filter(d => d.status === 'resolved').length;

      setKpis([
        {
          labelKey: 'admin.dashboard.openIssues',
          value: openCount,
          icon: <AlertTriangle size={18} />,
          color: 'var(--danger)',
        },
        {
          labelKey: 'admin.dashboard.inProgress',
          value: inProgressCount,
          icon: <Clock size={18} />,
          color: 'var(--warning)',
        },
        {
          labelKey: 'admin.dashboard.resolved',
          value: resolvedCount,
          icon: <CheckCircle size={18} />,
          color: 'var(--success)',
        },
        {
          labelKey: 'admin.dashboard.totalLogged',
          value: docs.length,
          icon: <FileText size={18} />,
          color: 'var(--text-2)',
        },
      ]);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load admin KPIs in real-time:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ maxWidth: 1000 }}>
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
          {t('admin.portal')}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          fontWeight: 600,
          color: 'var(--text-1)',
          marginBottom: 4,
        }}>
          {t('admin.dashboard.title').replace('{name}', profile?.displayName ?? 'Admin')}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          {t('admin.dashboard.subtitle')}
          {profile?.municipalityId ? ` — ${profile.municipalityId}` : ''}
        </p>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 36 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 90, borderRadius: 8 }} />
            ))
          : kpis.map(kpi => (
              <div key={kpi.labelKey} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justify_content: 'space-between', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {t(kpi.labelKey)}
                  </span>
                  <span style={{ color: kpi.color }}>{kpi.icon}</span>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                  {kpi.value}
                </span>
              </div>
            ))
        }
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>
          {t('admin.dashboard.recentActivity')}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { labelKey: 'admin.nav.complaints', path: '/admin/complaints' },
            { labelKey: 'admin.nav.assignments', path: '/admin/assignments' },
            { labelKey: 'admin.nav.map', path: '/admin/map' },
            { labelKey: 'admin.nav.analytics', path: '/admin/analytics' },
          ].map(action => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-1)',
                textDecoration: 'none',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {t(action.labelKey as TranslationKey)}
              <ArrowRight size={12} color="var(--text-3)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
