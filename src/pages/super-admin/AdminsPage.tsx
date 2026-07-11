import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { Shield, Plus, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  municipalityId: string;
  status: 'active' | 'suspended' | 'inactive';
  role: string;
  joinedAt?: any;
  issuesResolved?: number;
  points?: number;
}

const MUNICIPALITIES = [
  'Kolkata Municipality', 'Mumbai Municipal Corporation', 'Bangalore Urban',
  'Chennai Corporation', 'Hyderabad GHMC', 'Ahmedabad Municipal',
];

const AddAdminModal: React.FC<{ onClose: () => void; onAdded: () => void }> = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ displayName: '', email: '', municipalityId: MUNICIPALITIES[0], password: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) { toast.error('Firebase not configured'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'users'), {
        displayName: form.displayName,
        email: form.email,
        municipalityId: form.municipalityId,
        role: 'admin',
        status: 'active',
        points: 0,
        badges: ['Staff'],
        issuesReported: 0,
        issuesResolved: 0,
        joinedAt: serverTimestamp(),
        createdBy: 'super_admin',
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${form.email}`,
      });
      toast.success(`Admin ${form.displayName} provisioned`);
      onAdded();
      onClose();
    } catch { toast.error('Failed to create admin'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, width: 440, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Provision Admin</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input required className="form-input" placeholder="Rahul Sharma"
              value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input required type="email" className="form-input" placeholder="admin@municipality.gov.in"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Municipality</label>
            <select className="form-select" value={form.municipalityId} onChange={e => setForm(p => ({ ...p, municipalityId: e.target.value }))}>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
            ℹ️ The admin's login credentials are set via Firebase Authentication Console. This form creates the user profile record.
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Provisioning…' : 'Provision Admin'}</button>
        </form>
      </div>
    </div>
  );
};

const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setAdmins([
        { id: 'a1', displayName: 'Ward Admin', email: 'admin@civicpulse.gov.in', municipalityId: 'Kolkata Municipality', status: 'active', role: 'admin', issuesResolved: 34, points: 1200 },
        { id: 'a2', displayName: 'Priya Menon', email: 'priya.menon@mumbai.gov.in', municipalityId: 'Mumbai Municipal Corporation', status: 'active', role: 'admin', issuesResolved: 67, points: 2400 },
        { id: 'a3', displayName: 'Suresh Naidu', email: 'suresh@bangalore.gov.in', municipalityId: 'Bangalore Urban', status: 'active', role: 'admin', issuesResolved: 51, points: 1800 },
        { id: 'a4', displayName: 'Kavita Rajan', email: 'kavita@chennai.gov.in', municipalityId: 'Chennai Corporation', status: 'suspended', role: 'admin', issuesResolved: 12, points: 400 },
        { id: 'a5', displayName: 'Mohammed Ali', email: 'ali@hyderabad.gov.in', municipalityId: 'Hyderabad GHMC', status: 'active', role: 'admin', issuesResolved: 89, points: 3100 },
      ]);
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser));
      setAdmins(items.length ? items : [
        { id: 'a1', displayName: 'Ward Admin', email: 'admin@civicpulse.gov.in', municipalityId: 'Kolkata Municipality', status: 'active', role: 'admin', issuesResolved: 34, points: 1200 },
      ]);
    } catch {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (admin: AdminUser) => {
    if (admin.id.startsWith('a')) { toast('Demo data — connect Firebase to manage admins'); return; }
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', admin.id), { status: newStatus });
      toast.success(`Admin ${newStatus}`);
      load();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = admins.filter(a =>
    a.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.municipalityId?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCnt = admins.filter(a => a.status === 'active').length;
  const suspendedCnt = admins.filter(a => a.status === 'suspended').length;
  const totalResolved = admins.reduce((s, a) => s + (a.issuesResolved || 0), 0);

  const statusIcon = (s: string) =>
    s === 'active' ? <CheckCircle size={13} color="#10B981" /> :
    s === 'suspended' ? <XCircle size={13} color="#EF4444" /> :
    <AlertTriangle size={13} color="#F59E0B" />;

  return (
    <div style={{ maxWidth: 1100 }}>
      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onAdded={load} />}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>USER MANAGEMENT</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Admins</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Municipality admins with their access status and performance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Provision Admin
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Admins', value: admins.length, icon: <Shield size={16} />, color: 'var(--primary)' },
          { label: 'Active', value: activeCnt, icon: <CheckCircle size={16} />, color: '#10B981' },
          { label: 'Suspended', value: suspendedCnt, icon: <XCircle size={16} />, color: '#EF4444' },
          { label: 'Issues Resolved', value: totalResolved, icon: <CheckCircle size={16} />, color: '#10B981' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      <input className="form-input" style={{ width: 240, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}
        placeholder="Search admins…" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Email</th>
              <th>Municipality</th>
              <th>Issues Resolved</th>
              <th>Points</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="shimmer" style={{ height: 18, borderRadius: 4 }} /></td></tr>
              ))
              : filtered.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${admin.email}`}
                        alt={admin.displayName}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)' }}
                      />
                      <span style={{ fontWeight: 500 }}>{admin.displayName}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{admin.email}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{admin.municipalityId}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{admin.issuesResolved ?? 0}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{admin.points ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {statusIcon(admin.status)}
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{admin.status}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleStatus(admin)}
                        className={admin.status === 'active' ? 'btn btn-danger' : 'btn btn-secondary'}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >{admin.status === 'active' ? 'Suspend' : 'Restore'}</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No admins found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminsPage;
