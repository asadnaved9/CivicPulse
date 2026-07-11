import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { Building2, Plus, Users, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  code: string;
  municipality: string;
  headOfficer: string;
  issueCategories: string[];
  staffCount: number;
  status: 'active' | 'inactive';
}

const SEED_DEPARTMENTS: Omit<Department, 'id'>[] = [
  { name: 'Roads & Infrastructure', code: 'ROAD', municipality: 'Kolkata Municipality', headOfficer: 'Rajesh Kumar', issueCategories: ['pothole', 'road_damage'], staffCount: 48, status: 'active' },
  { name: 'Water & Sewerage', code: 'WATER', municipality: 'Kolkata Municipality', headOfficer: 'Priya Sharma', issueCategories: ['water_leak', 'flooding'], staffCount: 36, status: 'active' },
  { name: 'Solid Waste Management', code: 'SWM', municipality: 'Mumbai Municipal Corporation', headOfficer: 'Anil Mehta', issueCategories: ['garbage', 'waste_dump'], staffCount: 92, status: 'active' },
  { name: 'Street Lighting', code: 'ELEC', municipality: 'Bangalore Urban', headOfficer: 'Sneha Rao', issueCategories: ['streetlight', 'electrical'], staffCount: 22, status: 'active' },
  { name: 'Parks & Recreation', code: 'PARK', municipality: 'Chennai Corporation', headOfficer: 'T. Venkatesh', issueCategories: ['park_damage', 'encroachment'], staffCount: 15, status: 'inactive' },
  { name: 'Drainage & Flood Control', code: 'DRAIN', municipality: 'Hyderabad GHMC', headOfficer: 'Farida Begum', issueCategories: ['drain_blocked', 'flooding'], staffCount: 41, status: 'active' },
];

const AddDeptModal: React.FC<{ onClose: () => void; onAdded: () => void }> = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ name: '', code: '', municipality: '', headOfficer: '', staffCount: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) { toast.error('Firebase not configured'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'departments'), {
        ...form,
        staffCount: parseInt(form.staffCount) || 0,
        issueCategories: [],
        status: 'active',
        createdAt: serverTimestamp(),
      });
      toast.success('Department added');
      onAdded();
      onClose();
    } catch { toast.error('Failed to add department'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 28, width: 420, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Add Department</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { key: 'name', label: 'Department Name', placeholder: 'Roads & Infrastructure' },
            { key: 'code', label: 'Dept Code', placeholder: 'ROAD' },
            { key: 'municipality', label: 'Municipality', placeholder: 'Kolkata Municipality' },
            { key: 'headOfficer', label: 'Head Officer', placeholder: 'Full Name' },
            { key: 'staffCount', label: 'Staff Count', placeholder: '25' },
          ].map(f => (
            <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{f.label}</label>
              <input required className="form-input" placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Department'}</button>
        </form>
      </div>
    </div>
  );
};

const DepartmentsPage: React.FC = () => {
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setDepts(SEED_DEPARTMENTS.map((d, i) => ({ ...d, id: `seed_${i}` })));
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'departments'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Department));
      setDepts(items.length ? items : SEED_DEPARTMENTS.map((d, i) => ({ ...d, id: `seed_${i}` })));
    } catch {
      setDepts(SEED_DEPARTMENTS.map((d, i) => ({ ...d, id: `seed_${i}` })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (d: Department) => {
    if (d.id.startsWith('seed_')) { toast('Demo data — connect Firebase to manage departments'); return; }
    try {
      await updateDoc(doc(db, 'departments', d.id), { status: d.status === 'active' ? 'inactive' : 'active' });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const filtered = depts.filter(d =>
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.municipality || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.code || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCnt = depts.filter(d => d.status === 'active').length;
  const totalStaff = depts.reduce((s, d) => s + (d.staffCount || 0), 0);

  return (
    <div style={{ maxWidth: 1100 }}>
      {showAdd && <AddDeptModal onClose={() => setShowAdd(false)} onAdded={load} />}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>GOVERNANCE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Departments</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Municipal service departments and their operational scope</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add Department
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Depts', value: depts.length, icon: <Building2 size={16} /> },
          { label: 'Active', value: activeCnt, icon: <CheckCircle size={16} /> },
          { label: 'Inactive', value: depts.length - activeCnt, icon: <AlertTriangle size={16} /> },
          { label: 'Total Staff', value: totalStaff, icon: <Users size={16} /> },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              <span style={{ color: 'var(--primary)' }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      <input className="form-input" style={{ width: 240, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}
        placeholder="Search departments…" value={search} onChange={e => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Department</th>
              <th>Municipality</th>
              <th>Head Officer</th>
              <th>Issue Categories</th>
              <th>Staff</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8}><div className="shimmer" style={{ height: 18, borderRadius: 4 }} /></td></tr>
              ))
              : filtered.map(d => (
                <tr key={d.id}>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>{d.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{d.municipality}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{d.headOfficer}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(d.issueCategories || []).slice(0, 2).map(cat => (
                        <span key={cat} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid var(--border)' }}>{cat}</span>
                      ))}
                      {(d.issueCategories || []).length > 2 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{d.issueCategories.length - 2}</span>}
                      {(d.issueCategories || []).length === 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{d.staffCount}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 10px', borderRadius: 12,
                      background: d.status === 'active' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                      color: d.status === 'active' ? 'var(--success)' : 'var(--danger)',
                      border: `1px solid ${d.status === 'active' ? 'var(--success)' : 'var(--danger)'}`,
                    }}>{d.status.toUpperCase()}</span>
                  </td>
                  <td>
                    <button onClick={() => toggleStatus(d)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>
                      {d.status === 'active' ? 'Suspend' : 'Restore'}
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No departments found.</div>
        )}
      </div>

      {/* By Municipality breakdown */}
      {!loading && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>BY MUNICIPALITY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {Array.from(new Set(depts.map(d => d.municipality))).map(mun => {
              const cnt = depts.filter(d => d.municipality === mun).length;
              return (
                <div key={mun} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, marginBottom: 4 }}>{mun}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{cnt} <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--text-3)' }}>depts</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
