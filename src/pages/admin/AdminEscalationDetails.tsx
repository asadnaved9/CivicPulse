import React from 'react';
import { Camera, Check, Shield, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface EscalationDetailsProps {
  onClose: () => void;
}

export const AdminEscalationDetails: React.FC<EscalationDetailsProps> = ({ onClose }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg)', width: '100%', maxWidth: 1000, maxHeight: '90vh', borderRadius: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--surface)', padding: '4px 8px', borderRadius: 6, color: 'var(--text-2)' }}>CP-1045</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: 6 }}>BLOCKED</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Severe Road Damage & Fallen Tree</h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32 }}>
          
          {/* Left Column: Workflow & Dependencies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Dependency Tree (Deep multi-layer) */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="var(--primary)" /> Dependency Escalation Tree
              </h3>
              <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Layer 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, width: 220 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Original Task</div>
                      <div style={{ fontWeight: 600 }}>Road Department</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: Rahul Kumar</div>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>BLOCKED BY ➔</span>
                  </div>
                  {/* Layer 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 40 }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid #22c55e', borderRadius: 8, width: 220 }}>
                      <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 4 }}>Dependency 1</div>
                      <div style={{ fontWeight: 600 }}>Forest Department</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: Aman Singh</div>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>BLOCKED BY ➔</span>
                  </div>
                  {/* Layer 3 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 80 }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid #eab308', borderRadius: 8, width: 220 }}>
                      <div style={{ fontSize: 12, color: '#eab308', marginBottom: 4 }}>Dependency 2</div>
                      <div style={{ fontWeight: 600 }}>Electricity Department</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: Rohit Sharma</div>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 12 }}>BLOCKED BY ➔</span>
                  </div>
                  {/* Layer 4 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 120 }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #ef4444', borderRadius: 8, width: 220 }}>
                      <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>Dependency 3</div>
                      <div style={{ fontWeight: 600 }}>Traffic Police</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Worker: Pending Assignment</div>
                    </div>
                  </div>
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
                  { text: 'Traffic Police required for road closure', time: '12:15 PM', done: false, alert: true },
                  { text: 'Waiting for Traffic Police Assignment', time: '--:--', done: false },
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
                      <div style={{ fontWeight: step.done ? 600 : 400, color: step.alert ? '#ef4444' : 'var(--text-1)' }}>{step.text}</div>
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
                <img src="https://images.unsplash.com/photo-1598285514605-643f820c7416?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="Fallen Tree" />
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, color: '#fff', fontSize: 10, display: 'flex', gap: 4 }}>
                  <Camera size={12} /> 11:30 AM
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)' }}>Objects Detected</span>
                  <span style={{ fontWeight: 600 }}>Tree, Live Wires</span>
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
                <button style={{ width: '100%', padding: '10px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
                  Approve AI Assignment
                </button>
              </div>
            </div>

            {/* Current Status Block */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
               <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Coordination Status</h3>
               <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                 <strong>Road Repair</strong> is blocked by <strong>Forest Dept</strong>.<br/><br/>
                 <strong>Forest Dept</strong> is blocked by <strong>Electricity Dept</strong> (live wires).<br/><br/>
                 <strong>Electricity Dept</strong> is blocked pending <strong>Traffic Police</strong> road closure.
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
