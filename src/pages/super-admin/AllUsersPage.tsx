import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { Users, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CivicUser {
  id: string;
  displayName: string;
  email?: string;
  role: string;
  status: 'active' | 'suspended' | 'inactive';
  points: number;
  issuesReported: number;
  issuesResolved: number;
  badges: string[];
  joinedAt?: any;
  municipalityId?: string;
}

const SEED_USERS: CivicUser[] = [
  { id: 'u1', displayName: 'Ananya Bose', email: 'ananya@gmail.com', role: 'citizen', status: 'active', points: 520, issuesReported: 8, issuesResolved: 3, badges: ['Early Reporter'], municipalityId: 'Kolkata Municipality' },
  { id: 'u2', displayName: 'Rohan Desai', email: 'rohan@gmail.com', role: 'citizen', status: 'active', points: 1340, issuesReported: 22, issuesResolved: 15, badges: ['Community Guardian', 'Verified Citizen'] },
  { id: 'u3', displayName: 'Sneha Pillai', role: 'citizen', status: 'active', points: 280, issuesReported: 4, issuesResolved: 1, badges: [] },
  { id: 'u4', displayName: 'Vikram Singh', email: 'vsingh@hotmail.com', role: 'citizen', status: 'suspended', points: 60, issuesReported: 2, issuesResolved: 0, badges: [], municipalityId: 'Bangalore Urban' },
  { id: 'u5', displayName: 'Meera Nair', email: 'meera@gmail.com', role: 'citizen', status: 'active', points: 890, issuesReported: 14, issuesResolved: 7, badges: ['Infrastructure Watcher'] },
  { id: 'u6', displayName: 'Arjun Patel', email: 'arjun@company.in', role: 'citizen', status: 'active', points: 2100, issuesReported: 31, issuesResolved: 19, badges: ['Community Guardian', 'Top Reporter'] },
  { id: 'u7', displayName: 'Divya Kumar', role: 'citizen', status: 'active', points: 150, issuesReported: 2, issuesResolved: 0, badges: [] },
  { id: 'u8', displayName: 'Rahul Jha', email: 'rahul.jha@gmail.com', role: 'citizen', status: 'active', points: 670, issuesReported: 11, issuesResolved: 5, badges: ['Verified Citizen'] },
  { id: 'u9', displayName: 'Anonymous Citizen', role: 'citizen', status: 'active', points: 0, issuesReported: 1, issuesResolved: 0, badges: [] },
  { id: 'u10', displayName: 'Kavya Reddy', email: 'kavya.r@outlook.com', role: 'citizen', status: 'inactive', points: 45, issuesReported: 1, issuesResolved: 0, badges: [] },
];

const AllUsersPage: React.FC = () => {
  const [users, setUsers] = useState<CivicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'citizen' | 'admin' | 'super_admin'>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const load = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setUsers(SEED_USERS);
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(collection(db, 'users'));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CivicUser));
      setUsers(items.length ? items : SEED_USERS);
    } catch { setUsers(SEED_USERS); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleSuspend = async (u: CivicUser) => {
    if (u.id.startsWith('u')) { toast('Demo data — connect Firebase to manage users'); return; }
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', u.id), { status: newStatus });
      toast.success(`User ${newStatus}`);
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const activeCnt = users.filter(u => u.status === 'active').length;
  const suspendedCnt = users.filter(u => u.status === 'suspended').length;
  const totalPoints = users.reduce((s, u) => s + (u.points || 0), 0);
  const totalIssues = users.reduce((s, u) => s + (u.issuesReported || 0), 0);

  const roleColor = (r: string) => r === 'super_admin' ? '#F59E0B' : r === 'admin' ? 'var(--primary)' : 'var(--text-3)';

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>USER MANAGEMENT</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>All Users</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Full citizen and administrator registry with engagement metrics</p>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: users.length, icon: <Users size={16} /> },
          { label: 'Active', value: activeCnt, icon: <CheckCircle size={16} /> },
          { label: 'Suspended', value: suspendedCnt, icon: <XCircle size={16} /> },
          { label: 'Total Points', value: totalPoints.toLocaleString(), icon: <AlertTriangle size={16} /> },
          { label: 'Issues Reported', value: totalIssues, icon: <AlertTriangle size={16} /> },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k.label}</span>
              <span style={{ color: 'var(--primary)' }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="form-input" style={{ width: 220, padding: '8px 12px 8px 30px', fontSize: 13 }}
            placeholder="Search users…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        </div>
        {(['all', 'active', 'suspended', 'inactive'] as const).map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }} style={{
            padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: statusFilter === s ? 'var(--primary)' : 'transparent',
            color: statusFilter === s ? '#fff' : 'var(--text-2)',
            border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{s === 'all' ? 'All' : s}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {(['all', 'citizen', 'admin', 'super_admin'] as const).map(r => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(0); }} style={{
            padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: roleFilter === r ? 'var(--primary)' : 'transparent',
            color: roleFilter === r ? '#fff' : 'var(--text-2)',
            border: roleFilter === r ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{r === 'all' ? 'All Roles' : r.replace('_', ' ')}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Points</th>
              <th>Issues Reported</th>
              <th>Badges</th>
              <th>Municipality</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={8}><div className="shimmer" style={{ height: 18, borderRadius: 4 }} /></td></tr>
              ))
              : paginated.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`} alt=""
                        style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{u.displayName}</div>
                        {u.email && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: roleColor(u.role) }}>{u.role}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.points?.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{u.issuesReported}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(u.badges || []).slice(0, 2).map(b => (
                        <span key={b} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid var(--border)' }}>{b}</span>
                      ))}
                      {(u.badges || []).length === 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.municipalityId || '—'}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 10,
                      background: u.status === 'active' ? 'var(--success-subtle)' : u.status === 'suspended' ? 'var(--danger-subtle)' : 'var(--warning-subtle)',
                      color: u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--danger)' : 'var(--warning)',
                      border: `1px solid ${u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--danger)' : 'var(--warning)'}`,
                    }}>{u.status}</span>
                  </td>
                  <td>
                    {u.role === 'citizen' && (
                      <button onClick={() => toggleSuspend(u)} className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }}>
                        {u.status === 'suspended' ? 'Restore' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No users match your filters.</div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default AllUsersPage;
