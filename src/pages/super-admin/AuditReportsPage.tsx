import React, { useState } from 'react';
import { ClipboardList, User, Shield, Settings, Trash2, UserCheck, Download, Filter } from 'lucide-react';

type AuditAction = 'ROLE_CHANGE' | 'USER_SUSPENDED' | 'USER_RESTORED' | 'ISSUE_STATUS_UPDATE' |
  'ADMIN_PROVISIONED' | 'MUNICIPALITY_ADDED' | 'CONFIG_CHANGED' | 'API_KEY_CREATED' | 'USER_DELETED' |
  'INTEGRATION_TOGGLED' | 'DEPARTMENT_ADDED' | 'ADMIN_LOGIN';

interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: 'admin' | 'super_admin';
  action: AuditAction;
  targetType: 'user' | 'issue' | 'municipality' | 'system' | 'department' | 'api_key';
  targetId: string;
  description: string;
  metadata?: Record<string, string>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const SEED_AUDIT: AuditEntry[] = [
  {
    id: 'a1', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'ADMIN_PROVISIONED', targetType: 'user', targetId: 'priya_menon',
    description: 'Provisioned new municipality admin: Priya Menon → Mumbai Municipal Corporation',
    metadata: { email: 'priya.menon@mumbai.gov.in', municipality: 'Mumbai Municipal Corporation' },
    severity: 'high',
  },
  {
    id: 'a2', timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'CONFIG_CHANGED', targetType: 'system', targetId: 'platform_config',
    description: 'Updated platform configuration: AI auto-classification threshold changed from 0.8 to 0.85',
    metadata: { field: 'ai_confidence_threshold', old: '0.80', new: '0.85' },
    severity: 'medium',
  },
  {
    id: 'a3', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    actorId: 'admin_uid', actorName: 'Ward Admin', actorRole: 'admin',
    action: 'ISSUE_STATUS_UPDATE', targetType: 'issue', targetId: 'issue_034',
    description: 'Issue status updated: open → in_progress with estimated resolution of 3 days',
    metadata: { issueTitle: 'Road collapse near Park St', oldStatus: 'open', newStatus: 'in_progress', estDays: '3' },
    severity: 'low',
  },
  {
    id: 'a4', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'USER_SUSPENDED', targetType: 'user', targetId: 'vikram_singh',
    description: 'User Vikram Singh suspended for policy violation: multiple false issue reports',
    metadata: { email: 'vsingh@hotmail.com', reason: 'Policy violation - false reports' },
    severity: 'critical',
  },
  {
    id: 'a5', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'MUNICIPALITY_ADDED', targetType: 'municipality', targetId: 'mun_001',
    description: 'New municipality registered: Pune Metropolitan Authority (West region, Maharashtra)',
    metadata: { state: 'Maharashtra', region: 'West', population: '3124458' },
    severity: 'medium',
  },
  {
    id: 'a6', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'API_KEY_CREATED', targetType: 'api_key', targetId: 'key_gemini_prod',
    description: 'New API key created for Gemini AI integration (production environment)',
    metadata: { service: 'Gemini AI', environment: 'production' },
    severity: 'high',
  },
  {
    id: 'a7', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    actorId: 'admin_uid', actorName: 'Ward Admin', actorRole: 'admin',
    action: 'ISSUE_STATUS_UPDATE', targetType: 'issue', targetId: 'issue_021',
    description: 'Issue resolved with proof-of-work upload: Streetlight repaired',
    metadata: { issueTitle: 'Broken streetlight MG Road', oldStatus: 'in_progress', newStatus: 'resolved' },
    severity: 'low',
  },
  {
    id: 'a8', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'ROLE_CHANGE', targetType: 'user', targetId: 'suresh_naidu',
    description: 'User role elevated from citizen to admin: Suresh Naidu → Bangalore Urban',
    metadata: { oldRole: 'citizen', newRole: 'admin', municipality: 'Bangalore Urban' },
    severity: 'critical',
  },
  {
    id: 'a9', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'INTEGRATION_TOGGLED', targetType: 'system', targetId: 'integration_sms',
    description: 'SMS gateway integration enabled: Twilio → government SMS provider',
    metadata: { integration: 'SMS Gateway', provider: 'Twilio', status: 'enabled' },
    severity: 'medium',
  },
  {
    id: 'a10', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'DEPARTMENT_ADDED', targetType: 'department', targetId: 'dept_drain_hyd',
    description: 'New department added: Drainage & Flood Control → Hyderabad GHMC',
    metadata: { municipality: 'Hyderabad GHMC', headOfficer: 'Farida Begum', staffCount: '41' },
    severity: 'low',
  },
  {
    id: 'a11', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'ADMIN_LOGIN', targetType: 'system', targetId: 'session_super',
    description: 'Super admin login: superadmin@civicpulse.gov.in — IP: 103.21.58.xx',
    metadata: { email: 'superadmin@civicpulse.gov.in', ip: '103.21.58.xx', browser: 'Chrome 125' },
    severity: 'medium',
  },
  {
    id: 'a12', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    actorId: 'super_uid', actorName: 'CTO & Platform Admin', actorRole: 'super_admin',
    action: 'USER_RESTORED', targetType: 'user', targetId: 'kavita_rajan',
    description: 'Suspended user restored: Kavita Rajan — post-review appeal approved',
    metadata: { email: 'kavita@chennai.gov.in', reason: 'Appeal approved after review' },
    severity: 'high',
  },
];

const actionIcon = (action: AuditAction) => {
  const s = 13;
  switch (action) {
    case 'ROLE_CHANGE': return <Shield size={s} />;
    case 'USER_SUSPENDED': case 'USER_DELETED': return <Trash2 size={s} color="#EF4444" />;
    case 'USER_RESTORED': return <UserCheck size={s} color="#10B981" />;
    case 'ADMIN_PROVISIONED': return <User size={s} color="var(--primary)" />;
    case 'CONFIG_CHANGED': case 'INTEGRATION_TOGGLED': return <Settings size={s} />;
    default: return <ClipboardList size={s} />;
  }
};

const severityConfig = {
  low: { color: '#10B981', bg: 'var(--success-subtle)', border: '#10B981' },
  medium: { color: '#F59E0B', bg: 'var(--warning-subtle)', border: '#F59E0B' },
  high: { color: 'var(--primary)', bg: 'var(--primary-subtle)', border: 'var(--primary)' },
  critical: { color: '#EF4444', bg: 'var(--danger-subtle)', border: '#EF4444' },
};

const AuditReportsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [actorFilter, setActorFilter] = useState<'all' | 'admin' | 'super_admin'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = SEED_AUDIT.filter(e => {
    const matchSev = severityFilter === 'all' || e.severity === severityFilter;
    const matchActor = actorFilter === 'all' || e.actorRole === actorFilter;
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.actorName.toLowerCase().includes(search.toLowerCase());
    return matchSev && matchActor && matchSearch;
  });

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const criticalCnt = SEED_AUDIT.filter(e => e.severity === 'critical').length;
  const highCnt = SEED_AUDIT.filter(e => e.severity === 'high').length;
  const superAdminActions = SEED_AUDIT.filter(e => e.actorRole === 'super_admin').length;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>INTELLIGENCE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Audit Reports</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Immutable log of all admin and super admin actions across the platform</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Events', value: SEED_AUDIT.length },
          { label: 'Critical', value: criticalCnt, color: '#EF4444' },
          { label: 'High', value: highCnt, color: 'var(--primary)' },
          { label: 'Super Admin Actions', value: superAdminActions, color: '#F59E0B' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (k as any).color || 'var(--text-1)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} color="var(--text-3)" />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => {
          const cfg = s === 'all' ? null : severityConfig[s];
          return (
            <button key={s} onClick={() => setSeverityFilter(s)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
              background: severityFilter === s ? (cfg?.bg || 'var(--primary-subtle)') : 'transparent',
              color: severityFilter === s ? (cfg?.color || 'var(--primary)') : 'var(--text-2)',
              border: severityFilter === s ? `1px solid ${cfg?.border || 'var(--primary)'}` : '1px solid var(--border)',
            }}>{s.toUpperCase()}</button>
          );
        })}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {(['all', 'admin', 'super_admin'] as const).map(r => (
          <button key={r} onClick={() => setActorFilter(r)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            background: actorFilter === r ? 'var(--primary)' : 'transparent',
            color: actorFilter === r ? '#fff' : 'var(--text-2)',
            border: actorFilter === r ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{r === 'all' ? 'All Actors' : r.replace('_', ' ')}</button>
        ))}
        <input className="form-input" style={{ width: 220, padding: '6px 10px', fontSize: 12 }}
          placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Audit log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.map((entry, idx) => {
          const sev = severityConfig[entry.severity];
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: idx === 0 ? '10px 10px 0 0' : idx === filtered.length - 1 ? '0 0 10px 10px' : '0',
                marginTop: idx === 0 ? 0 : -1,
                background: 'var(--surface)',
                cursor: entry.metadata ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
                {/* Severity indicator */}
                <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: sev.color, flexShrink: 0 }} />

                <div style={{ flexShrink: 0, marginTop: 2, color: sev.color }}>{actionIcon(entry.action)}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{entry.description}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{formatTs(entry.timestamp)}</span>
                    <span style={{ fontSize: 11, color: entry.actorRole === 'super_admin' ? '#F59E0B' : 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {entry.actorName}
                    </span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 6,
                    background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
                    textTransform: 'uppercase',
                  }}>{entry.severity}</span>
                </div>
              </div>

              {/* Expanded metadata */}
              {isExpanded && entry.metadata && (
                <div style={{ margin: '0 16px 14px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Event Metadata</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                    {Object.entries(entry.metadata).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>TIMESTAMP</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No audit events match your filters.</div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>
        Showing {filtered.length} of {SEED_AUDIT.length} audit events · Click entries to expand metadata · Audit log is read-only
      </div>
    </div>
  );
};

export default AuditReportsPage;
