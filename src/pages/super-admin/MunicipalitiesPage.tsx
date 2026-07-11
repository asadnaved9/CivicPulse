import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, query, where, getCountFromServer,
  addDoc, serverTimestamp, doc, updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { Globe, Plus, Users, FileText, CheckCircle, AlertTriangle, X, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Municipality {
  id: string;
  name: string;
  state: string;
  region: string;
  population: number;
  adminEmail?: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  issueCount?: number;
}

const SEED_MUNICIPALITIES: Omit<Municipality, 'id' | 'issueCount'>[] = [
  { name: 'Kolkata Municipality', state: 'West Bengal', region: 'East', population: 4631392, adminEmail: 'admin@civicpulse.gov.in', status: 'active' },
  { name: 'Mumbai Municipal Corporation', state: 'Maharashtra', region: 'West', population: 12478447, adminEmail: '', status: 'active' },
  { name: 'Bangalore Urban', state: 'Karnataka', region: 'South', population: 8443675, adminEmail: '', status: 'active' },
  { name: 'Chennai Corporation', state: 'Tamil Nadu', region: 'South', population: 7088000, adminEmail: '', status: 'active' },
  { name: 'Hyderabad GHMC', state: 'Telangana', region: 'South', population: 6809970, adminEmail: '', status: 'active' },
  { name: 'Ahmedabad Municipal', state: 'Gujarat', region: 'West', population: 5633927, adminEmail: '', status: 'inactive' },
];

const AddMunicipalityModal: React.FC<{
  onClose: () => void;
  onAdded: () => void;
}> = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ name: '', state: '', region: '', population: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) { toast.error('Firebase not configured'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'municipalities'), {
        ...form,
        population: parseInt(form.population) || 0,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      toast.success('Municipality added');
      onAdded();
      onClose();
    } catch (err) {
      toast.error('Failed to add municipality');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, width: 420, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Add Municipality</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name', label: 'Name', placeholder: 'e.g. Delhi Municipal Corp' },
            { key: 'state', label: 'State', placeholder: 'e.g. Delhi' },
            { key: 'region', label: 'Region', placeholder: 'North / South / East / West' },
            { key: 'population', label: 'Population', placeholder: '1000000' },
          ].map(f => (
            <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{f.label}</label>
              <input
                required
                className="form-input"
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 6 }}>
            {saving ? 'Saving…' : 'Add Municipality'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MunicipalitiesPage: React.FC = () => {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const load = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      // Use seed data as display-only
      setMunicipalities(SEED_MUNICIPALITIES.map((m, i) => ({ ...m, id: `seed_${i}`, issueCount: Math.floor(Math.random() * 80) + 5 })));
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'municipalities'));
      let items: Municipality[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Municipality));
      if (items.length === 0) items = SEED_MUNICIPALITIES.map((m, i) => ({ ...m, id: `seed_${i}`, issueCount: Math.floor(Math.random() * 80) + 5 }));

      // Enrich with issue counts
      const enriched = await Promise.all(items.map(async m => {
        try {
          const cnt = await getCountFromServer(query(collection(db, 'issues'), where('municipalityId', '==', m.name)));
          return { ...m, issueCount: cnt.data().count };
        } catch {
          return { ...m, issueCount: 0 };
        }
      }));
      setMunicipalities(enriched);
    } catch {
      setMunicipalities(SEED_MUNICIPALITIES.map((m, i) => ({ ...m, id: `seed_${i}`, issueCount: Math.floor(Math.random() * 80) + 5 })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (m: Municipality) => {
    if (m.id.startsWith('seed_')) { toast('This is demo data — connect Firebase to manage municipalities'); return; }
    try {
      await updateDoc(doc(db, 'municipalities', m.id), { status: m.status === 'active' ? 'inactive' : 'active' });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = municipalities.filter(m => {
    const matchSearch = (m.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (m.state || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const activeCnt = municipalities.filter(m => m.status === 'active').length;
  const totalPop = municipalities.reduce((s, m) => s + (m.population || 0), 0);
  const totalIssues = municipalities.reduce((s, m) => s + (m.issueCount || 0), 0);

  return (
    <div style={{ maxWidth: 1100 }}>
      {showAdd && <AddMunicipalityModal onClose={() => setShowAdd(false)} onAdded={load} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>GOVERNANCE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Municipalities</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Manage all registered municipal zones across the platform</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Municipality
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total', value: municipalities.length, icon: <Globe size={16} />, sub: 'Registered zones' },
          { label: 'Active', value: activeCnt, icon: <CheckCircle size={16} />, sub: 'Operational' },
          { label: 'Total Population', value: `${(totalPop / 1_000_000).toFixed(1)}M`, icon: <Users size={16} />, sub: 'Citizens covered' },
          { label: 'Total Issues', value: totalIssues, icon: <FileText size={16} />, sub: 'Cross-platform' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              <span style={{ color: 'var(--primary)' }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{loading ? '—' : k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ width: 220, padding: '8px 12px', fontSize: 13 }}
          placeholder="Search by name or state…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(['all', 'active', 'inactive'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: filter === s ? 'var(--primary)' : 'transparent',
              color: filter === s ? '#fff' : 'var(--text-2)',
              border: filter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
            }}
          >{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Municipality</th>
              <th>State / Region</th>
              <th>Population</th>
              <th>Issues</th>
              <th>Admin</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="shimmer" style={{ height: 18, borderRadius: 4 }} /></td></tr>
              ))
              : filtered.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={14} color="var(--text-3)" />
                      <span style={{ fontWeight: 500 }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{m.state} · <span style={{ color: 'var(--text-3)' }}>{m.region}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.population?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{m.issueCount ?? 0}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.adminEmail || <span style={{ color: 'var(--border-hover)', opacity: 0.5 }}>—</span>}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: 12,
                      background: m.status === 'active' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                      color: m.status === 'active' ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${m.status === 'active' ? 'var(--success)' : 'var(--danger)'}`,
                    }}>{m.status.toUpperCase()}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleStatus(m)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 12px', fontSize: 12 }}
                    >{m.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No municipalities match your filter.</div>
        )}
      </div>

      {/* Regional summary */}
      {!loading && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>REGIONAL BREAKDOWN</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {['North', 'South', 'East', 'West'].map(region => {
              const cnt = municipalities.filter(m => m.region === region).length;
              return (
                <div key={region} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>{region}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{cnt}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>municipalities</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalitiesPage;
