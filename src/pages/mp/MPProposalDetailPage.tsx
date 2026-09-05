import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { Proposal, ProposalStatus } from '../../types/proposal';
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, 
  Building2, MapPin, DollarSign, Tag,
  ShieldCheck, PlayCircle, XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const STATUS_STEPS: { key: ProposalStatus; label: string; desc: string }[] = [
  { key: 'draft', label: 'Drafted', desc: 'Initial proposal created from citizen demand cluster' },
  { key: 'submitted', label: 'Submitted', desc: 'Officially submitted to the District Planning Board' },
  { key: 'approved', label: 'Approved', desc: 'Legislative and technical sanctions granted' },
  { key: 'funded', label: 'Funded', desc: 'Budget sanctioned from central/state scheme allocation' },
  { key: 'in_execution', label: 'In Execution', desc: 'Contractor mobilized and civil construction in progress' },
  { key: 'verified', label: 'Verified', desc: 'Municipal quality audit and citizen inspection cleared' },
  { key: 'completed', label: 'Completed', desc: 'Facility commissioned and handed over for public use' },
];

export default function MPProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [transitionNote, setTransitionNote] = useState('');

  // Real-time Firestore sync
  useEffect(() => {
    if (!id || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'proposals', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProposal({ id: docSnap.id, ...docSnap.data() } as Proposal);
      } else {
        toast.error("Proposal record not found.");
        navigate('/mp/recommendations');
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to sync proposal:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Advance to next status
  const handleAdvanceStatus = async (nextStatus: ProposalStatus) => {
    if (!id) return;
    setUpdatingStatus(true);
    try {
      const res = await fetchWithAuth(`/api/lifecycle/proposals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: transitionNote || `Status advanced to ${nextStatus.replace('_', ' ').toUpperCase()}`,
          changedBy: 'Member of Parliament Office'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Proposal transitioned to ${nextStatus.toUpperCase()}!`);
        setTransitionNote('');
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (err: any) {
      console.error("Failed to transition status:", err);
      toast.error("Network error during status advance.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-3)' }}>
        Loading proposal lifecycle record...
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-2)' }}>
        Proposal not found.
      </div>
    );
  }

  // Parse structured proposal text
  let parsedContent: any = null;
  try {
    parsedContent = JSON.parse(proposal.proposalText);
  } catch {
    parsedContent = { executiveSummary: proposal.proposalText };
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === proposal.status);
  const nextStep = currentStatusIndex >= 0 && currentStatusIndex < STATUS_STEPS.length - 1
    ? STATUS_STEPS[currentStatusIndex + 1]
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Header & Breadcrumbs */}
      <div>
        <button 
          onClick={() => navigate('/mp/recommendations')} 
          className="btn btn-secondary text-xs"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', marginBottom: '16px' }}
        >
          <ArrowLeft size={14} /> Back to Decision Cockpit
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                {proposal.category || 'General Infrastructure'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Doc Ref: {proposal.id}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
              {proposal.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Estimated Project Outlay</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-1)' }}>
                ₹{proposal.estimatedCost ? (proposal.estimatedCost / 100000).toFixed(1) : '50.0'} Lakhs
              </div>
            </div>
            <span 
              className={`badge ${proposal.status === 'completed' ? 'badge-success' : proposal.status === 'rejected' ? 'badge-danger' : 'badge-primary'}`}
              style={{ fontSize: '12px', padding: '6px 12px', textTransform: 'uppercase', fontWeight: 700 }}
            >
              {proposal.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '12px' }}>
            Legislative & Execution Phase Pipeline
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;
              const isRejected = proposal.status === 'rejected';

              let borderColor = 'var(--border)';
              let bg = 'var(--surface-2)';
              let textColor = 'var(--text-3)';

              if (isCurrent && !isRejected) {
                borderColor = '#3b82f6';
                bg = 'rgba(59, 130, 246, 0.1)';
                textColor = '#3b82f6';
              } else if (isPast && !isRejected) {
                borderColor = 'var(--success)';
                textColor = 'var(--text-1)';
              }

              return (
                <div 
                  key={step.key}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isPast ? (
                      <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />
                    ) : isCurrent ? (
                      <Clock size={12} style={{ color: '#3b82f6' }} />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }} />
                    )}
                    <span style={{ fontSize: '11px', fontWeight: 600, color: textColor }}>
                      {step.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--text-3)', lineHeight: '1.2' }}>
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Administrative State Control (MP Office Authorized) */}
        {nextStep && proposal.status !== 'completed' && proposal.status !== 'rejected' && (
          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Advance Project Lifecycle Step (MP Office Authorized)
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                Strict Forward-Only Governance Enforcement
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1, minWidth: '220px', fontSize: '12px', height: '36px' }}
                placeholder={`Sanction / transition audit note (e.g. Sanction ref #BBMP/2026/89)`}
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
              />
              <button 
                onClick={() => handleAdvanceStatus(nextStep.key)} 
                disabled={updatingStatus}
                className="btn btn-primary"
                style={{ padding: '0 16px', fontSize: '12px', height: '36px', gap: '6px', backgroundColor: '#3b82f6' }}
              >
                <PlayCircle size={14} /> Advance to {nextStep.label}
              </button>
              <button 
                onClick={() => handleAdvanceStatus('rejected')} 
                disabled={updatingStatus}
                className="btn btn-danger"
                style={{ padding: '0 16px', fontSize: '12px', height: '36px', gap: '6px' }}
              >
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two-column layout: Proposal Spec Sheet & Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Column 1: Formal Proposal Spec Document */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <FileText size={16} style={{ color: '#3b82f6' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Municipal DPR & Project Proposal Dossier
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
            {parsedContent.executiveSummary && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Executive Summary</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.executiveSummary}</p>
              </div>
            )}

            {parsedContent.problemStatement && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Problem Statement & Need</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.problemStatement}</p>
              </div>
            )}

            {parsedContent.evidence && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Evidence Base & Citizen Demand</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.evidence}</p>
              </div>
            )}

            {parsedContent.beneficiaries && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Target Beneficiaries</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.beneficiaries}</p>
              </div>
            )}

            {parsedContent.demographicData && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Ward Demographics</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.demographicData}</p>
              </div>
            )}

            {parsedContent.infrastructureGap && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Infrastructure Deficit Identification</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.infrastructureGap}</p>
              </div>
            )}

            {parsedContent.estimatedImpact && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Projected Socio-Economic Impact</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.estimatedImpact}</p>
              </div>
            )}

            {parsedContent.implementationTimeline && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Implementation Phases</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.implementationTimeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Audit History & Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Grounding & Alignment Metadata
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)' }}>
                <span>Priority Engine Score:</span>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>{proposal.priorityScore || 75}/100</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)' }}>
                <span>Matched LDP Item:</span>
                <span style={{ color: 'var(--text-1)', maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {proposal.matchingPlanItem || 'None Identified'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)' }}>
                <span>Aligned Scheme:</span>
                <span style={{ color: 'var(--text-1)' }}>{proposal.matchedScheme || 'AMRUT 2.0 / PM-ABHIM'}</span>
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Official Audit Trail
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {proposal.history && proposal.history.length > 0 ? (
                proposal.history.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12px', borderLeft: '2px solid #3b82f6', paddingLeft: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                        {item.status.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                        {item.changedBy || 'MP Office'} • {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Recent'}
                      </div>
                      {item.note && (
                        <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: '2px', fontStyle: 'italic' }}>
                          "{item.note}"
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  Initial proposal created in Draft status.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
