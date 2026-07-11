import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { 
  Users, CheckCircle, Clock, AlertTriangle, 
  UserPlus, ExternalLink, ShieldCheck, HelpCircle, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: number;
  status: string;
  address: string;
  assignedTo?: string;
  estimatedResolutionDays?: number;
  createdAt: any;
}

const CREWS = [
  { id: 'kmc_waste', name: 'KMC Solid Waste Department', contact: '+91 33 2286-1000 (Ext 124)', activeJobs: 3 },
  { id: 'kmc_water', name: 'KMC Water Supply & Sewers', contact: '+91 33 2286-1000 (Ext 311)', activeJobs: 5 },
  { id: 'cesc_power', name: 'CESC Electrical Infrastructure Division', contact: '+91 33 2225-6040', activeJobs: 2 },
  { id: 'pwd_roads', name: 'West Bengal PWD Road Department', contact: '+91 33 2248-2615', activeJobs: 8 },
  { id: 'civil_con_a', name: 'Apex Civic Infrastructure Ltd.', contact: '+91 98300 12345', activeJobs: 1 },
];

const AdminAssignmentsPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribe = onSnapshot(issuesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      // Only show issues that are not resolved
      const activeIssues = list.filter(i => i.status !== 'resolved');
      setIssues(activeIssues);
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAssignCrew = async (issueId: string, crewName: string) => {
    setAssigning(true);
    try {
      const docRef = doc(db, 'issues', issueId);
      await updateDoc(docRef, {
        assignedTo: crewName,
        status: 'in_progress', // Auto-move to in progress when assigned
        updatedAt: serverTimestamp()
      });

      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(prev => prev ? { ...prev, assignedTo: crewName, status: 'in_progress' } : null);
      }

      toast.success(`Complaint assigned to ${crewName}`);
    } catch (err) {
      console.error('Failed to assign crew:', err);
      toast.error('Failed to update assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'reported': return { color: '#EF4444', label: 'Reported' };
      case 'verified': return { color: '#3B82F6', label: 'Verified' };
      case 'in_progress': return { color: '#F59E0B', label: 'In Progress' };
      default: return { color: 'var(--text-3)', label: status };
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      
      {/* Issues Requiring Assignments */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            RESOURCE PLANNING
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>
            Municipal Dispatch & Assignments
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
            Delegate active public issues to specialized municipal divisions and contractors.
          </p>
        </div>

        {/* List of active issues */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-3)' }}>
              Loading dispatch queue...
            </div>
          ) : issues.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-3)' }}>
              No active issues in dispatcher queue.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {issues.map(issue => {
                const isAssigned = !!issue.assignedTo;
                const statusStyle = getStatusStyle(issue.status);

                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: selectedIssue?.id === issue.id ? 'var(--primary-subtle)' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ marginRight: 14 }}>
                      <Users size={16} color={isAssigned ? '#10B981' : 'var(--text-3)'} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {issue.address}
                      </span>
                    </div>

                    {/* Assignment Status */}
                    <div style={{ width: 220, paddingRight: 10 }}>
                      {issue.assignedTo ? (
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                          {issue.assignedTo}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                          Unassigned (Needs Dispatch)
                        </span>
                      )}
                    </div>

                    {/* Workflow status */}
                    <div style={{ width: 100, textAlign: 'right', fontSize: '11px', fontWeight: 600, color: statusStyle.color }}>
                      {statusStyle.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Panel */}
      {selectedIssue && (
        <div style={{
          width: '380px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={14} color="var(--primary)" /> Issue Dispatcher
            </span>
            <button 
              onClick={() => setSelectedIssue(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Issue Details summary */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Target Issue</span>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4, marginBottom: 4 }}>{selectedIssue.title}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{selectedIssue.address}</span>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                <strong>Severity:</strong> Level {selectedIssue.severity}/5
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                <strong>Current Status:</strong> {selectedIssue.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* List of Crews for delegation */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block' }}>
              Select Municipal Division to Deploy
            </span>

            {CREWS.map(crew => {
              const isCurrentlyAssigned = selectedIssue.assignedTo === crew.name;

              return (
                <div
                  key={crew.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: 14,
                    background: isCurrentlyAssigned ? 'var(--primary-subtle)' : 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', paddingRight: 40 }}>
                      {crew.name}
                    </span>
                    {isCurrentlyAssigned && (
                      <span style={{ fontSize: '9px', background: '#10B981', color: '#FFF', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        ASSIGNED
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                    Contact: {crew.contact}
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                      Active Queue: <strong>{crew.activeJobs} jobs</strong>
                    </span>
                    {!isCurrentlyAssigned && (
                      <button
                        onClick={() => handleAssignCrew(selectedIssue.id, crew.name)}
                        disabled={assigning}
                        style={{
                          background: 'var(--primary)',
                          color: 'var(--bg)',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Deploy Crew
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentsPage;
