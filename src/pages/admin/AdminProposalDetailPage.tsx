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

export default function AdminProposalDetailPage() {
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
        navigate('/admin/recommendations');
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
          changedBy: 'Municipal Administration Office'
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
          onClick={() => navigate('/admin/recommendations')} 
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
              className="badge"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              {proposal.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Lifecycle Stage Progress Bar */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '16px' }}>
          Statutory Capital Lifecycle State Machine
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '8px' }}>
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx <= currentStatusIndex;
            const isCurrent = idx === currentStatusIndex;

            return (
              <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '100px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--surface-2)',
                    color: isDone || isCurrent ? '#ffffff' : 'var(--text-3)',
                    border: '2px solid ' + (isCurrent ? 'var(--primary)' : isDone ? '#10b981' : 'var(--border)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '12px',
                    marginBottom: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDone && !isCurrent ? <CheckCircle2 size={16} /> : idx + 1}
                </div>
                <div style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-1)' : isDone ? 'var(--text-2)' : 'var(--text-3)' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', maxWidth: '110px', marginTop: '2px' }}>
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Details and Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Full Proposal Draft */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                DPR Project Summary & Specifications
              </h2>
            </div>

            {parsedContent.executiveSummary && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Executive Summary
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)', whiteSpace: 'pre-line' }}>
                  {parsedContent.executiveSummary}
                </div>
              </div>
            )}

            {parsedContent.justification && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Citizen Demand Justification
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>
                  {parsedContent.justification}
                </div>
              </div>
            )}

            {parsedContent.scopeOfWork && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Engineering Scope of Work
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>
                  {parsedContent.scopeOfWork}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Statutory Actions & Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Action Card: Advance Lifecycle Status */}
          {nextStep && (
            <div className="card" style={{ border: '2px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlayCircle size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                  Advance Governance Milestone
                </h3>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                Next step: <strong>{nextStep.label}</strong> — {nextStep.desc}.
              </p>

              <textarea
                placeholder="Official note or approval sanction order number..."
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                style={{
                  width: '100%',
                  height: '65px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />

              <button
                onClick={() => handleAdvanceStatus(nextStep.key)}
                disabled={updatingStatus}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '13px',
                  width: '100%'
                }}
              >
                {updatingStatus ? 'Recording Transition...' : `Approve & Move to ${nextStep.label}`}
              </button>
            </div>
          )}

          {/* Quick Details Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Project Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)' }}>
                <span>Target Ward:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{proposal.ward || 'Ward 18, Ranchi'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)' }}>
                <span>Priority Score:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{proposal.priorityScore || 85}/100</span>
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
                  <div key={idx} style={{ display: 'flex', gap: '10px', fontSize: '12px', borderLeft: '2px solid var(--primary)', paddingLeft: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                        {item.status.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
                        {item.changedBy || 'Admin Office'} • {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleDateString() : 'Recent'}
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
