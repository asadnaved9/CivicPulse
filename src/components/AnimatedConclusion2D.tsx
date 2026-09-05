import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Award, 
  Zap, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  MapPin,
  Building,
  Users
} from 'lucide-react';

export const AnimatedConclusion2D: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'AFTER' | 'BEFORE'>('AFTER');
  const [autoToggle, setAutoToggle] = useState<boolean>(true);

  // Auto toggle preview mode every 5 seconds unless user manually interacts
  useEffect(() => {
    if (!autoToggle) return;
    const interval = setInterval(() => {
      setViewMode(prev => prev === 'AFTER' ? 'BEFORE' : 'AFTER');
    }, 5000);
    return () => clearInterval(interval);
  }, [autoToggle]);

  return (
    <section 
      style={{ 
        background: 'var(--bg)', 
        borderTop: '1px solid var(--border)', 
        padding: '40px 24px', 
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 28px auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            The Modern City Transformation
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
            Compare how traditional municipal management operates versus the AI-powered CivicPulse ecosystem.
          </p>

          {/* Interactive Toggle Switch */}
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              background: 'var(--surface-2)', 
              border: '1px solid var(--border)', 
              borderRadius: '30px', 
              padding: '3px',
              margin: '8px auto 0 auto',
              cursor: 'pointer'
            }}
            onMouseEnter={() => setAutoToggle(false)}
          >
            <button
              onClick={() => { setViewMode('BEFORE'); setAutoToggle(false); }}
              style={{
                background: viewMode === 'BEFORE' ? 'var(--badge-danger-bg)' : 'transparent',
                color: viewMode === 'BEFORE' ? 'var(--badge-danger-text)' : 'var(--text-3)',
                border: viewMode === 'BEFORE' ? '1px solid var(--badge-danger-border)' : 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={13} /> Legacy System
            </button>

            <button
              onClick={() => { setViewMode('AFTER'); setAutoToggle(false); }}
              style={{
                background: viewMode === 'AFTER' ? 'var(--badge-success-bg)' : 'transparent',
                color: viewMode === 'AFTER' ? 'var(--badge-success-text)' : 'var(--text-3)',
                border: viewMode === 'AFTER' ? '1px solid var(--badge-success-border)' : 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={13} /> CivicPulse Ecosystem
            </button>
          </div>
        </div>

        {/* 2D ANIMATED STAGE SCREEN SHOWCASE */}
        <div 
          style={{ 
            background: 'var(--surface)', 
            border: viewMode === 'AFTER' ? '1px solid var(--badge-success-border)' : '1px solid var(--badge-danger-border)', 
            borderRadius: '12px', 
            padding: '24px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            transition: 'all 0.4s ease',
            position: 'relative'
          }}
          className="conclusion-grid"
        >
          
          {/* Left Details Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              background: viewMode === 'AFTER' ? 'var(--badge-success-bg)' : 'var(--badge-danger-bg)', 
              border: viewMode === 'AFTER' ? '1px solid var(--badge-success-border)' : '1px solid var(--badge-danger-border)', 
              color: viewMode === 'AFTER' ? 'var(--badge-success-text)' : 'var(--badge-danger-text)',
              fontSize: '12px',
              fontWeight: 700,
              width: 'fit-content'
            }}>
              {viewMode === 'AFTER' ? 'POWERED BY CIVICPULSE AI' : 'TRADITIONAL MUNICIPALITY'}
            </div>

            <h3 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: 0, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {viewMode === 'AFTER' 
                ? 'Automated Triage & Transparent Proof' 
                : 'Manual Filing & Untracked Delays'}
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              {viewMode === 'AFTER'
                ? 'Issue reports are geolocated, classified by vision AI models, and dispatched to local teams with mandatory photo verification upon completion.'
                : 'Paper forms or fragmented hotlines result in lost tickets, lack of accountability, and zero public progress visibility.'}
            </p>

            {/* Feature Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                {viewMode === 'AFTER' 
                  ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  : <XCircle size={16} style={{ color: 'var(--danger)' }} />}
                <span>{viewMode === 'AFTER' ? 'Average Resolution: 48 Hours' : 'Average Resolution: 14 to 30 Days'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                {viewMode === 'AFTER' 
                  ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  : <XCircle size={16} style={{ color: 'var(--danger)' }} />}
                <span>{viewMode === 'AFTER' ? 'Tamper-Proof Photo Proof-of-Work' : 'Zero Public Verification Required'}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-1)' }}>
                {viewMode === 'AFTER' 
                  ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  : <XCircle size={16} style={{ color: 'var(--danger)' }} />}
                <span>{viewMode === 'AFTER' ? 'Citizen Gamification & Karma Rewards' : 'No Feedback Loop for Residents'}</span>
              </div>
            </div>
          </div>

          {/* Right 2D Animated Interface Graphic */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {viewMode === 'AFTER' ? (
              /* AFTER 2D SMART CITY HUD */
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid var(--badge-success-border)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeIn 0.4s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> MUNICIPAL HEALTH: 98/100
                  </span>
                  <span style={{ fontSize: '10px', background: 'var(--badge-success-bg)', color: 'var(--badge-success-text)', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    OPTIMAL
                  </span>
                </div>

                {/* 2D City Grid Mockup */}
                <div style={{ background: 'var(--mockup-card)', border: '1px solid var(--mockup-card-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building size={16} style={{ color: 'var(--success)' }} />
                      <span style={{ fontSize: '13px', color: 'var(--mockup-text)', fontWeight: 600 }}>Ward 17 District</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--mockup-subtext)' }}>100% Tracked</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: 'var(--mockup-inner-bg)', border: '1px solid var(--mockup-inner-border)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--mockup-subtext)' }}>AI Dispatch</span>
                      <strong style={{ fontSize: '13px', color: 'var(--success)' }}>Instant</strong>
                    </div>
                    <div style={{ background: 'var(--mockup-inner-bg)', border: '1px solid var(--mockup-inner-border)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--mockup-subtext)' }}>Verified Proof</span>
                      <strong style={{ fontSize: '13px', color: 'var(--success)' }}>Active</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--badge-success-bg)', border: '1px solid var(--badge-success-border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={20} style={{ color: 'var(--badge-success-text)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--badge-success-text)', fontWeight: 600 }}>
                    12,840 Active Citizens Earning Karma Badges Daily
                  </span>
                </div>
              </div>
            ) : (
              /* BEFORE 2D LEGACY HUD */
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '380px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid var(--badge-danger-border)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeIn 0.4s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--badge-danger-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <XCircle size={14} /> LEGACY HOTLINE SYSTEM
                  </span>
                  <span style={{ fontSize: '10px', background: 'var(--badge-danger-bg)', color: 'var(--badge-danger-text)', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    UNTRACKED
                  </span>
                </div>

                <div style={{ background: 'var(--mockup-card)', border: '1px solid var(--mockup-card-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--badge-danger-text)', fontWeight: 600 }}>Unverified Paper Filing</span>
                    <span style={{ fontSize: '11px', color: 'var(--mockup-subtext)' }}>Pending</span>
                  </div>

                  <div style={{ background: 'var(--mockup-inner-bg)', border: '1px solid var(--mockup-inner-border)', padding: '12px', borderRadius: '8px', fontSize: '12px', color: 'var(--mockup-subtext)' }}>
                    ⚠️ High backlog of duplicate reports. No geolocation verification or photo proof.
                  </div>
                </div>

                <div style={{ background: 'var(--badge-danger-bg)', border: '1px solid var(--badge-danger-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--badge-danger-text)', textAlign: 'center', fontWeight: 600 }}>
                  No public audit trail or citizen feedback loop
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
