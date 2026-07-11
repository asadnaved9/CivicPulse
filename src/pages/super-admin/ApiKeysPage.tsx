import React, { useState } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ApiKey {
  id: string;
  name: string;
  service: string;
  environment: 'production' | 'staging' | 'development';
  prefix: string;
  suffix: string;
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked' | 'expired';
  scopes: string[];
}

const SEED_KEYS: ApiKey[] = [
  {
    id: 'k1', name: 'Gemini AI — Production', service: 'Google Gemini AI',
    environment: 'production', prefix: 'AIzaSy', suffix: '...xK9p',
    createdAt: '2026-01-15', lastUsed: '2 minutes ago',
    status: 'active', scopes: ['generativeai.generate', 'generativeai.embed'],
  },
  {
    id: 'k2', name: 'Firebase Admin SDK', service: 'Google Firebase',
    environment: 'production', prefix: 'fb_sdk', suffix: '...m4Zr',
    createdAt: '2026-01-10', lastUsed: '5 minutes ago',
    status: 'active', scopes: ['firestore.read', 'firestore.write', 'auth.admin', 'storage.write'],
  },
  {
    id: 'k3', name: 'Twilio SMS Gateway', service: 'Twilio',
    environment: 'staging', prefix: 'AC4bf2', suffix: '...89qL',
    createdAt: '2026-03-20', lastUsed: '2 days ago',
    status: 'active', scopes: ['sms.send'],
  },
  {
    id: 'k4', name: 'SendGrid Email', service: 'Twilio SendGrid',
    environment: 'production', prefix: 'SG.kL9', suffix: '...77Xm',
    createdAt: '2026-02-01', lastUsed: '1 week ago',
    status: 'revoked', scopes: ['email.send', 'email.template'],
  },
  {
    id: 'k5', name: 'Google Maps Embed', service: 'Google Maps Platform',
    environment: 'production', prefix: 'AIzaSy', suffix: '...Rm2k',
    createdAt: '2026-01-10', lastUsed: '10 minutes ago',
    status: 'active', scopes: ['maps.embed', 'maps.geocode'],
  },
  {
    id: 'k6', name: 'Gemini AI — Staging', service: 'Google Gemini AI',
    environment: 'staging', prefix: 'AIzaSy', suffix: '...Jh7t',
    createdAt: '2026-04-12', lastUsed: 'Never',
    status: 'active', scopes: ['generativeai.generate'],
  },
];

const envColor = (e: string) =>
  e === 'production' ? '#EF4444' : e === 'staging' ? '#F59E0B' : '#10B981';

const statusColor = (s: string) =>
  s === 'active' ? '#10B981' : s === 'revoked' ? '#EF4444' : '#F59E0B';

const AddKeyModal: React.FC<{ onClose: () => void; onAdded: (key: ApiKey) => void }> = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ name: '', service: '', environment: 'production' as ApiKey['environment'] });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newKey: ApiKey = {
      id: `k_${Date.now()}`,
      name: form.name,
      service: form.service,
      environment: form.environment,
      prefix: 'new_key',
      suffix: '...****',
      createdAt: new Date().toLocaleDateString(),
      lastUsed: 'Never',
      status: 'active',
      scopes: [],
    };
    onAdded(newKey);
    toast.success(`API key "${form.name}" created`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, width: 400, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Create API Key</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><Plus size={16} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Key Name</label>
            <input required className="form-input" placeholder="e.g. Gemini AI — Production" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Service</label>
            <input required className="form-input" placeholder="e.g. Google Gemini AI" value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Environment</label>
            <select className="form-select" value={form.environment} onChange={e => setForm(p => ({ ...p, environment: e.target.value as ApiKey['environment'] }))}>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--warning-subtle)', border: '1px solid #F59E0B', borderRadius: 6, fontSize: 12, color: 'var(--text-2)' }}>
            ⚠️ The actual API key value is managed in the respective service console. This record tracks usage and access for auditing purposes.
          </div>
          <button type="submit" className="btn btn-primary">Create Key Record</button>
        </form>
      </div>
    </div>
  );
};

const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>(SEED_KEYS);
  const [showAdd, setShowAdd] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyKey = (id: string) => {
    navigator.clipboard.writeText(`••••• (Key ID: ${id}) — Actual key managed in service console`).catch(() => {});
    toast.success('Key reference copied');
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
    toast.success('API key revoked');
  };

  const filtered = keys.filter(k => {
    const matchEnv = envFilter === 'all' || k.environment === envFilter;
    const matchStatus = statusFilter === 'all' || k.status === statusFilter;
    return matchEnv && matchStatus;
  });

  const activeCnt = keys.filter(k => k.status === 'active').length;
  const revokedCnt = keys.filter(k => k.status === 'revoked').length;

  return (
    <div style={{ maxWidth: 1100 }}>
      {showAdd && <AddKeyModal onClose={() => setShowAdd(false)} onAdded={key => setKeys(prev => [...prev, key])} />}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>SYSTEM</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>API Keys</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Manage API keys for external service integrations (Gemini, Firebase, Twilio, etc.)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Create Key
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Keys', value: keys.length },
          { label: 'Active', value: activeCnt, color: '#10B981' },
          { label: 'Revoked', value: revokedCnt, color: '#EF4444' },
          { label: 'Services', value: new Set(keys.map(k => k.service)).size },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: (k as any).color || 'var(--text-1)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'production', 'staging', 'development'] as const).map(e => (
          <button key={e} onClick={() => setEnvFilter(e)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: envFilter === e ? (e === 'all' ? 'var(--primary)' : envColor(e) + '22') : 'transparent',
            color: envFilter === e ? (e === 'all' ? '#fff' : envColor(e)) : 'var(--text-2)',
            border: envFilter === e ? `1px solid ${e === 'all' ? 'var(--primary)' : envColor(e)}` : '1px solid var(--border)',
          }}>{e === 'all' ? 'All Env' : e}</button>
        ))}
        {(['all', 'active', 'revoked'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: statusFilter === s ? 'var(--primary)' : 'transparent',
            color: statusFilter === s ? '#fff' : 'var(--text-2)',
            border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{s === 'all' ? 'All Status' : s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {filtered.map((k, idx) => {
          const visible = visibleKeys.has(k.id);
          return (
            <div key={k.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: idx === 0 ? '10px 10px 0 0' : idx === filtered.length - 1 ? '0 0 10px 10px' : '0',
              marginTop: idx === 0 ? 0 : -1,
              padding: '16px 20px',
              opacity: k.status === 'revoked' ? 0.7 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <Key size={14} color="var(--text-3)" />
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{k.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: envColor(k.environment) + '18', color: envColor(k.environment), border: `1px solid ${envColor(k.environment)}`, fontFamily: 'var(--font-mono)' }}>
                      {k.environment}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: statusColor(k.status) + '18', color: statusColor(k.status), border: `1px solid ${statusColor(k.status)}`, fontFamily: 'var(--font-mono)' }}>
                      {k.status}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.05em' }}>
                    {visible ? `${k.prefix}••••••••••••${k.suffix}` : `${k.prefix}•••••••••••••••••${k.suffix}`}
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      Service: <strong style={{ color: 'var(--text-2)' }}>{k.service}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      Created: <strong style={{ color: 'var(--text-2)' }}>{k.createdAt}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      Last used: <strong style={{ color: 'var(--text-2)' }}>{k.lastUsed}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {k.scopes.map(s => (
                      <span key={s} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleVisibility(k.id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    title={visible ? 'Hide' : 'Show'}
                  >
                    {visible ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => copyKey(k.id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  >
                    <Copy size={13} /> Copy
                  </button>
                  {k.status === 'active' && (
                    <button
                      onClick={() => revokeKey(k.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    >
                      <Trash2 size={13} /> Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No keys match your filters.</div>
      )}

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
        🔒 <strong style={{ color: 'var(--text-1)' }}>Security:</strong> Never commit API keys to version control. Rotate keys immediately if exposure is suspected. Production keys are restricted to server-side Firebase Admin SDK usage only.
      </div>
    </div>
  );
};

export default ApiKeysPage;
