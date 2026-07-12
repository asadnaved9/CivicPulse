import React from 'react';
import { Camera, Check, Shield, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface EscalationDetailsProps {
  issue: any;
  onClose: () => void;
}

export const AdminEscalationDetails: React.FC<EscalationDetailsProps> = ({ issue, onClose }) => {
  const dependencies = issue.dependencies || [];

  const getDeptWorker = (dept: string) => {
    switch (dept) {
      case 'Forest Department': return 'Aman Singh';
      case 'CESC Electrical Infrastructure Division': return 'Rohit Sharma';
      case 'Traffic Police': return 'Vikash Yadav';
      default: return 'Pending Assignment';
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg)', width: '100%', maxWidth: 1000, maxHeight: '90vh', borderRadius: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 6, color: 'var(--text-2)' }}>
                {issue.id || 'CP-1045'}
              </span>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                background: issue.status === 'blocked' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                color: issue.status === 'blocked' ? '#ef4444' : '#22c55e', 
                padding: '4px 8px', 
                borderRadius: 6 
              }}>
                {issue.status.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>{issue.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
          
          {/* Left Column: Workflow & Dependencies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Dependency Tree */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="var(--primary)" /> Dependency Escalation Tree
              </h3>
              <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Layer 1: Original Task */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      padding: '12px 16px', 
                      background: 'var(--bg)', 
                      border: issue.status === 'blocked' ? '1px solid #ef4444' : '1px solid var(--border)', 
                      borderRadius: 8, 
                      width: 220 
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Original Task</div>
                      <div style={{ fontWeight: 600 }}>{issue.assignedTo || 'Road Department'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: Rahul Kumar</div>
                    </div>
                    {dependencies.length > 0 && (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>
                        {issue.status === 'blocked' ? 'BLOCKED BY ➔' : 'UNBLOCKED ➔'}
                      </span>
                    )}
                  </div>

                  {/* Layers 2+: Dynamic Dependencies */}
                  {dependencies.map((dep: any, index: number) => {
                    const isResolved = dep.status === 'resolved';
                    const hasNext = index < dependencies.length - 1;
                    const paddingLeft = (index + 1) * 40;

                    return (
                      <div key={dep.dept} style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft }}>
                        <div style={{ 
                          padding: '12px 16px', 
                          background: isResolved ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                          border: isResolved ? '1px solid #22c55e' : '1px solid #ef4444', 
                          borderRadius: 8, 
                          width: 220 
                        }}>
                          <div style={{ fontSize: 12, color: isResolved ? '#22c55e' : '#ef4444', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                            <span>Dependency {index + 1}</span>
                            <span style={{ fontWeight: 700 }}>{isResolved ? 'RESOLVED' : 'PENDING'}</span>
                          </div>
                          <div style={{ fontWeight: 600 }}>{dep.dept}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: {getDeptWorker(dep.dept)}</div>
                          {dep.resolutionNote && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
                              Note: "{dep.resolutionNote}"
                            </div>
                          )}
                        </div>
                        {hasNext && (
                          <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>
                            {isResolved ? 'RESOLVED ➔' : 'BLOCKED BY ➔'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Workflow Timeline */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Workflow Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 11, top: 20, bottom: 20, width: 2, background: 'var(--border)' }}></div>
                
                {[
                  { text: 'Citizen Reported Issue', time: '09:12 AM', done: true },
                  { text: 'Road Team Assigned (Rahul Kumar)', time: '09:45 AM', done: true },
                  { text: 'Worker Arrived at Location', time: '10:30 AM', done: true },
                  { text: 'Fallen tree detected. Blocked.', time: '10:45 AM', done: true, alert: true },
                  { text: 'Forest Department Assigned', time: '11:00 AM', done: true },
                  { text: 'Power lines entangled. Blocked.', time: '11:30 AM', done: true, alert: true },
                  { text: 'Electricity Department Assigned', time: '11:45 AM', done: true },
                  ...dependencies.map((dep: any) => ({
                    text: `${dep.dept} resolution status updated`,
                    time: dep.resolvedAt?.seconds ? new Date(dep.resolvedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
                    done: dep.status === 'resolved',
                    alert: dep.status !== 'resolved'
                  }))
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: step.done ? (step.alert ? '#ef4444' : 'var(--primary)') : 'var(--surface)', 
                      border: step.done ? 'none' : '2px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                      marginTop: 2
                    }}>
                      {step.done && (step.alert ? <AlertTriangle size={12} /> : <Check size={12} />)}
                    </div>
                    <div>
                      <div style={{ fontWeight: step.done ? 600 : 400, color: step.alert && !step.done ? '#ef4444' : 'var(--text-1)' }}>{step.text}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{step.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: AI Analysis & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* AI Analysis Panel */}
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ✨ AI Analysis (Photo Evidence)
              </h3>
              
              <div style={{ background: '#000', height: 160, borderRadius: 8, marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
                <img src={issue.imageUrl || "https://images.unsplash.com/photo-1598285514605-643f820c7416?q=80&w=600&auto=format&fit=crop"} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="Fallen Tree" />
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: 10, display: 'flex', gap: 4 }}>
                  <Camera size={12} /> 11:30 AM
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Objects Detected</span>
                  <span style={{ fontWeight: 600 }}>{issue.id === 'CP-1045' || issue.title.includes('Tree') ? 'Tree, Live Wires' : 'Standard Road Defect'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Confidence</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>98%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Suggested Dept</span>
                  <span style={{ fontWeight: 600 }}>Traffic Police</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Estimated Delay</span>
                  <span style={{ fontWeight: 600 }}>4 Hours</span>
                </div>
              </div>

              <div style={{ marginTop: 24, padding: 16, background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Recommended Action</span>
                <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>Assign Traffic Police to secure area before power lines are cut.</p>
                <button 
                  onClick={onClose}
                  style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                >
                  Approve AI Assignment
                </button>
              </div>
            </div>

            {/* Current Status Block */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
               <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Coordination Status</h3>
               <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                 {dependencies.map((dep: any, i: number) => (
                   <div key={dep.dept} style={{ marginBottom: 8 }}>
                     <strong>{dep.dept}</strong>: {dep.status === 'resolved' ? '✅ Resolved' : '❌ Pending'}
                   </div>
                 ))}
                 {dependencies.length === 0 && (
                   <span>No active multi-department coordination required.</span>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
