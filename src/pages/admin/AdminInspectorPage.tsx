import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { 
  ClipboardCheck, Clock, AlertTriangle, 
  CheckCircle, MapPin, X, FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface Issue {
  id: string;
  title: string;
  description?: string;
  category: string;
  severity: number;
  status: string;
  address: string;
  assignedTo?: string;
  createdAt: any;
  dependencies?: {
    dept: string;
    status: 'pending' | 'resolved';
    resolutionNote?: string;
    resolvedAt?: any;
  }[];
}

const DEPARTMENTS = [
  'KMC Solid Waste Department',
  'KMC Water Supply & Sewers',
  'CESC Electrical Infrastructure Division',
  'West Bengal PWD Road Department',
  'Apex Civic Infrastructure Ltd.',
  'Forest Department',
  'Traffic Police'
];

const AdminInspectorPage: React.FC = () => {
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribe = onSnapshot(issuesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      // Only show issues that are not resolved, duplicate, or rejected
      const unresolved = list.filter(i => 
        i.status !== 'resolved' && 
        i.status !== 'duplicate' && 
        i.status !== 'rejected'
      );
      setIssues(unresolved);
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResolveIssue = async () => {
    if (!selectedIssue) return;
    setSubmitting(true);
    try {
      const docRef = doc(db, 'issues', selectedIssue.id);
      
      const isDep = selectedIssue.dependencies?.some(
        d => d.dept === selectedDept && d.status === 'pending'
      );

      if (isDep) {
        // Resolve only this specific dependency
        const updatedDeps = selectedIssue.dependencies?.map(d => {
          if (d.dept === selectedDept) {
            return {
              ...d,
              status: 'resolved' as const,
              resolutionNote: resolutionNote.trim(),
              resolvedAt: new Date()
            };
          }
          return d;
        }) || [];

        // Check if all dependencies are now resolved
        const allResolved = updatedDeps.every(d => d.status === 'resolved');
        const updates: any = {
          dependencies: updatedDeps,
          updatedAt: serverTimestamp()
        };

        if (allResolved) {
          updates.status = 'in_progress'; // Automatically unblock
        }

        await updateDoc(docRef, updates);
        toast.success(`Dependency resolved for ${selectedDept}`);
      } else {
        // Resolve the entire issue
        await updateDoc(docRef, {
          status: 'resolved',
          resolvedAt: serverTimestamp(),
          resolvedBy: selectedDept,
          resolutionNote: resolutionNote.trim(),
          updatedAt: serverTimestamp()
        });
        toast.success('Issue marked as resolved successfully.');
      }

      setSelectedIssue(null);
      setResolutionNote('');
    } catch (err) {
      console.error('Failed to resolve issue:', err);
      toast.error('Failed to update issue status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter issues based on selected department and assignment status
  const filteredIssues = issues.filter(i => {
    if (selectedDept === 'All') {
      return !!i.assignedTo || (i.dependencies && i.dependencies.length > 0);
    }
    const isAssigned = i.assignedTo === selectedDept;
    const isPendingDep = i.dependencies?.some(
      d => d.dept === selectedDept && d.status === 'pending'
    );
    return isAssigned || isPendingDep;
  });

  const getSeverityColor = (sev: number) => {
    if (sev >= 4) return '#EF4444'; // Red
    if (sev === 3) return '#F59E0B'; // Orange
    return '#3B82F6'; // Blue
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            INSPECTOR PORTAL
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-1)', marginTop: 4 }}>
            Inspector Resolution Worklist
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: 4 }}>
            Review tasks assigned to your division and log formal resolutions.
          </p>
        </div>

        {/* Department Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label htmlFor="dept-select" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
            Select Department:
          </label>
          <select
            id="dept-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-1)',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              minWidth: 260
            }}
          >
            <option value="All">All Assigned Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Table/List */}
      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
            Loading assignments queue...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
            <ClipboardCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 500 }}>No unresolved tasks assigned to this department.</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Details</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>Severity</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>Created At</th>
                  <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '14px', marginBottom: 4 }}>
                        {issue.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-3)', fontSize: '12px' }}>
                        <MapPin size={12} />
                        <span>{issue.address}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500 }}>
                      {issue.assignedTo}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: getSeverityColor(issue.severity),
                        background: `${getSeverityColor(issue.severity)}15`,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${getSeverityColor(issue.severity)}30`
                      }}>
                        Lv {issue.severity}/5
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        color: issue.status === 'in_progress' ? '#F59E0B' : '#EF4444',
                        background: issue.status === 'in_progress' ? '#F59E0B15' : '#EF444415',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {issue.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', color: 'var(--text-3)', fontSize: '12px' }}>
                      {issue.createdAt?.seconds ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        {issue.dependencies?.some(d => d.dept === selectedDept && d.status === 'pending')
                          ? 'Resolve Dependency'
                          : 'Resolve Issue'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedIssue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            <button 
              onClick={() => { setSelectedIssue(null); setResolutionNote(''); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={20} color="var(--primary)" /> Confirm Issue Resolution
            </h3>

            <div style={{ background: 'var(--surface-2)', padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Issue</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>{selectedIssue.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: 4 }}>{selectedIssue.description || 'No description provided.'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} />
                <span>{selectedIssue.address}</span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="res-note" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>
                Resolution Note (Optional)
              </label>
              <textarea
                id="res-note"
                rows={4}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe the steps taken to resolve this issue (e.g. cleared waste block, patched pothole)..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-1)',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => { setSelectedIssue(null); setResolutionNote(''); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-2)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveIssue}
                disabled={submitting}
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Updating...' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInspectorPage;
