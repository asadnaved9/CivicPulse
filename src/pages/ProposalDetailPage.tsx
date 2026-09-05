import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Proposal, ProposalStatus } from '../types/proposal';
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, Building2, MapPin, DollarSign, Tag, UserCheck,
  Send, ShieldCheck, PlayCircle, Award, XCircle
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

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();

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
        navigate('/recommendations');
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
          changedBy: userRole === 'mp' ? 'Member of Parliament Office' : 'Authorized Representative'
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
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top navigation */}
      <button 
        onClick={() => navigate('/recommendations')} 
        className="btn btn-secondary text-xs" 
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <ArrowLeft size={14} /> Back to Recommendations
      </button>

      {/* Header card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '11px' }}>
                GOVERNMENT CAPITAL PROPOSAL
              </span>
              <span className="badge" style={{ 
                background: proposal.status === 'completed' ? 'var(--success)' : proposal.status === 'rejected' ? 'var(--danger)' : 'var(--primary)',
                color: '#FFF',
                textTransform: 'uppercase',
                fontSize: '11px',
                fontWeight: 700
              }}>
                {proposal.status.replace('_', ' ')}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-1)' }}>
              {proposal.title}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={13} /> Category: {proposal.category || 'Infrastructure'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> Location: {proposal.location || 'Bangalore Central'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={13} /> Sanction Estimate: {proposal.estimatedCost}
              </span>
            </div>
          </div>

          <div className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'right' }}>
            DOC ID: {proposal.id}
          </div>
        </div>

        {/* Lifecycle Phase Progression Tracker */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '12px' }}>
            Decision & Execution Phase Pipeline
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
                borderColor = 'var(--primary)';
                bg = 'rgba(59, 130, 246, 0.1)';
                textColor = 'var(--primary)';
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
                      <Clock size={12} style={{ color: 'var(--primary)' }} />
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

        {/* Citizen Transparency Notice */}
        <div style={{ background: 'var(--surface-2)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                Citizen Public Audit View
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                This proposal is in the public tracking ledger. Lifecycle transitions (administrative sanctions, scheme budget disbursements, and contractor verification) are managed by the MP Office.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Proposal Spec Sheet & Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Column 1: Formal Proposal Spec Document */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <FileText size={16} className="text-primary" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
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
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Problem Statement & Citizen Need</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.problemStatement}</p>
              </div>
            )}
            {parsedContent.evidence && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Civic Evidence Base</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.evidence}</p>
              </div>
            )}
            {parsedContent.infrastructureGap && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Infrastructure Gap & LDP Analysis</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.infrastructureGap}</p>
              </div>
            )}
            {parsedContent.beneficiaries && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Primary Beneficiaries & Population Reach</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.beneficiaries}</p>
              </div>
            )}
            {parsedContent.implementationTimeline && (
              <div>
                <strong style={{ color: 'var(--text-1)', fontSize: '11px', textTransform: 'uppercase' }}>Phased Implementation Schedule</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{parsedContent.implementationTimeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Audit Trail & Status History */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Clock size={16} className="text-primary" />
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
              Audit History & State Transitions
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(proposal.statusHistory || []).map((entry, idx) => {
              const dateStr = entry.changedAt?.seconds 
                ? new Date(entry.changedAt.seconds * 1000).toLocaleString() 
                : new Date(entry.changedAt).toLocaleString();

              return (
                <div 
                  key={idx} 
                  style={{
                    padding: '10px',
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    borderLeft: '3px solid var(--primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-1)' }}>
                      {entry.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {dateStr}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-2)' }}>{entry.note || 'Status updated'}</div>
                  {entry.changedBy && (
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>By: {entry.changedBy}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
