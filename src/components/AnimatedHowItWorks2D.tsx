import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Cpu, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  Zap, 
  Truck, 
  AlertTriangle,
  Radio
} from 'lucide-react';

export const AnimatedHowItWorks2D: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  const steps = [
    {
      id: 'step-1',
      number: '01',
      title: 'Snap & Geo-Tag',
      subtitle: 'Capture & Instant Location',
      icon: Camera,
      badge: 'Step 1: Capture',
      desc: 'Use your phone camera or upload a photo of the infrastructure issue. CivicPulse automatically extracts precise GPS coordinates, timestamp, and metadata.',
      accent: '#3b82f6'
    },
    {
      id: 'step-2',
      number: '02',
      title: 'AI Hazard Triage',
      subtitle: 'Neural Classification',
      icon: Cpu,
      badge: 'Step 2: AI Analysis',
      desc: 'Our vision model scans the image to identify damage type, severity score, and flags urgent safety hazards for priority municipal routing.',
      accent: '#a855f7'
    },
    {
      id: 'step-3',
      number: '03',
      title: 'Municipal Action',
      subtitle: 'Dispatch & Live Tracking',
      icon: Truck,
      badge: 'Step 3: Execution',
      desc: 'The ticket is dispatched directly to local public works teams. Citizens can track repair progress in real-time on the interactive city map.',
      accent: '#f59e0b'
    },
    {
      id: 'step-4',
      number: '04',
      title: 'Verified & Rewarded',
      subtitle: 'Proof-of-Work & Points',
      icon: Award,
      badge: 'Step 4: Verification',
      desc: 'Engineers submit timestamped photo proof upon completion. Once verified, the report status updates on the public ledger and you earn civic karma points!',
      accent: '#10b981'
    }
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  return (
    <section 
      style={{ 
        background: 'var(--bg)', 
        borderTop: '1px solid var(--border)', 
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px', 
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s ease'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 28px auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            How Reporting & Verification Works
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
            Experience the seamless 4-step pipeline from capturing a neighborhood problem to verified municipal repair.
          </p>
        </div>

        {/* 4-Step Navigation Tabs */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '10px', 
            marginBottom: '24px' 
          }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                style={{
                  background: isActive ? 'var(--surface-2)' : 'var(--surface)',
                  border: isActive ? `1px solid ${step.accent}` : '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? `0 4px 12px ${step.accent}15` : 'none'
                }}
              >
                {/* Active progress indicator line */}
                {isActive && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: '3px',
                      background: step.accent,
                      width: '100%',
                      animation: isAutoPlaying ? 'progressBar 4.5s linear infinite' : 'none'
                    }}
                  />
                )}

                <div 
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '6px', 
                    background: isActive ? `${step.accent}25` : 'var(--surface-2)',
                    border: `1px solid ${isActive ? step.accent : 'var(--border)'}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: isActive ? step.accent : 'var(--text-3)',
                    flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Icon size={15} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: step.accent, letterSpacing: '0.05em' }}>
                    STEP {step.number}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isActive ? 'var(--text-1)' : 'var(--text-2)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2D Interactive Stage Card */}
        <div 
          style={{ 
            background: 'var(--surface)', 
            border: `1px solid ${steps[activeStep].accent}40`, 
            borderRadius: '12px', 
            padding: '24px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
            alignItems: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
            position: 'relative'
          }}
          className="stage-grid"
        >
          {/* Left Explanatory Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '4px 12px', 
              borderRadius: '12px', 
              background: `${steps[activeStep].accent}18`, 
              border: `1px solid ${steps[activeStep].accent}40`,
              color: steps[activeStep].accent,
              fontSize: '12px',
              fontWeight: 600,
              width: 'fit-content'
            }}>
              {steps[activeStep].badge}
            </div>

            <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, margin: 0, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {steps[activeStep].title}
            </h3>

            <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
              {steps[activeStep].desc}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <button 
                onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                className="btn"
                style={{ 
                  background: steps[activeStep].accent, 
                  color: '#ffffff', 
                  padding: '10px 20px', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Next Step <ArrowRight size={14} />
              </button>
              
              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={12} style={{ color: isAutoPlaying ? 'var(--success)' : 'var(--text-3)' }} /> 
                {isAutoPlaying ? 'Auto-advancing' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Right 2D Animated UI Graphic Screen */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '280px', position: 'relative' }}>
            
            {/* STEP 1: 2D CAMERA & GPS SCANNER */}
            {activeStep === 0 && (
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '360px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid var(--mockup-border)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.4s ease-out'
                }}
              >
                {/* Laser scanning beam line */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: '2px', 
                    background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', 
                    boxShadow: '0 0 12px #3b82f6',
                    animation: 'scanBeam 2.5s infinite ease-in-out',
                    zIndex: 20
                  }} 
                />

                {/* Top Viewfinder Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--mockup-subtext)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Radio size={12} style={{ color: 'var(--danger)' }} /> LIVE GPS SEARCH
                  </span>
                  <span>4K EXIF</span>
                </div>

                {/* 2D Camera Screen Box */}
                <div 
                  style={{ 
                    height: '160px', 
                    borderRadius: '10px', 
                    background: 'var(--mockup-card)', 
                    border: '1px dashed var(--mockup-card-border)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Camera size={36} style={{ color: '#3b82f6', opacity: 0.9 }} />
                  <span style={{ fontSize: '12px', color: 'var(--mockup-text)', marginTop: '8px', fontWeight: 700 }}>
                    POTHOLE DETECTED
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--mockup-muted)', fontFamily: 'var(--font-mono)' }}>
                    TARGET LOCKED: 37.7749° N, 122.4194° W
                  </span>

                  {/* Corner Target Markers */}
                  <div style={{ position: 'absolute', top: 10, left: 10, width: 12, height: 12, borderTop: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', top: 10, right: 10, width: 12, height: 12, borderTop: '2px solid #3b82f6', borderRight: '2px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', bottom: 10, left: 10, width: 12, height: 12, borderBottom: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6' }} />
                  <div style={{ position: 'absolute', bottom: 10, right: 10, width: 12, height: 12, borderBottom: '2px solid #3b82f6', borderRight: '2px solid #3b82f6' }} />
                </div>

                {/* Metadata Card */}
                <div style={{ background: 'var(--mockup-card)', border: '1px solid var(--mockup-card-border)', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} style={{ color: '#3b82f6' }} />
                    <span style={{ fontSize: '12px', color: 'var(--mockup-text)', fontWeight: 600 }}>Oak Street & 5th Ave</span>
                  </div>
                  <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    ± 1.2m
                  </span>
                </div>
              </div>
            )}

            {/* STEP 2: 2D AI NEURAL TRIAGE HUD */}
            {activeStep === 1 && (
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '360px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid #a855f760', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.4s ease-out',
                  boxShadow: '0 8px 30px rgba(168,85,247,0.12)'
                }}
              >
                {/* Top Neural Model Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={14} className="shimmer" /> AI VISION MODEL V4
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(168,85,247,0.18)', color: '#a855f7', padding: '3px 8px', borderRadius: '10px', fontWeight: 700, border: '1px solid rgba(168,85,247,0.3)' }}>
                    CONFIDENCE 98.6%
                  </span>
                </div>

                {/* 2D Neural Grid Scanner Box */}
                <div 
                  style={{ 
                    height: '110px', 
                    borderRadius: '10px', 
                    background: 'var(--mockup-card)', 
                    border: '1px dashed #a855f760', 
                    position: 'relative', 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px'
                  }}
                >
                  {/* Grid lines background */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                  {/* Pulsing Neural Target Circle */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px dashed #a855f7', animation: 'spin 8s linear infinite' }} />
                    <div style={{ position: 'absolute', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                    </div>
                  </div>

                  <div style={{ marginLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px', zIndex: 2 }}>
                    <span style={{ fontSize: '9px', color: '#a855f7', fontWeight: 700, letterSpacing: '0.05em' }}>CLASSIFIED DEFECT</span>
                    <strong style={{ fontSize: '13px', color: 'var(--mockup-text)' }}>Asphalt Surface Fracture</strong>
                    <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 600 }}>Urgency: High (92/100)</span>
                  </div>
                </div>

                {/* Neural Progress HUD Details */}
                <div style={{ background: 'var(--mockup-card)', border: '1px solid var(--mockup-card-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--mockup-text)' }}>
                    <span>Assigned Sector</span>
                    <strong style={{ color: '#a855f7' }}>Public Works Ward #17</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--mockup-text)' }}>
                    <span>Severity Triage</span>
                    <strong style={{ color: 'var(--danger)' }}>CRITICAL (Score 92/100)</strong>
                  </div>

                  {/* Animated severity bar */}
                  <div style={{ width: '100%', height: '6px', background: 'var(--mockup-inner-bg)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #a855f7, #ef4444)', borderRadius: '3px' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--badge-danger-bg)', border: '1px solid var(--badge-danger-border)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--badge-danger-text)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--badge-danger-text)', lineHeight: 1.3, fontWeight: 600 }}>
                    Automated Priority Dispatch triggered to Public Works Division #3
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: 2D MUNICIPAL DISPATCH HUD */}
            {activeStep === 2 && (
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '360px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid #f59e0b50', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  animation: 'fadeIn 0.4s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={14} /> LIVE MUNICIPAL DISPATCH
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--mockup-text)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>TICKET #8492</span>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '4px 0' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--mockup-text)', fontWeight: 500 }}>Ticket Created & Routed</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--mockup-muted)' }}>10:14 AM</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--mockup-text)', fontWeight: 500 }}>Crew #4 Assigned</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--mockup-muted)' }}>10:22 AM</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={16} style={{ color: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
                    <strong style={{ fontSize: '12px', color: '#d97706' }}>Asphalt Repair In Progress (75%)</strong>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#d97706', fontWeight: 700 }}>Active</span>
                  </div>

                </div>

                <div style={{ background: 'var(--mockup-card)', border: '1px solid var(--mockup-card-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: 'var(--mockup-subtext)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Est. Completion: <strong>25 Mins</strong></span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Live Map Sync ON</span>
                </div>
              </div>
            )}

            {/* STEP 4: 2D REWARD & VERIFICATION STAMP */}
            {activeStep === 3 && (
              <div 
                style={{ 
                  width: '100%', 
                  maxWidth: '360px', 
                  background: 'var(--mockup-bg)', 
                  border: '1px solid #10b98160', 
                  borderRadius: '16px', 
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '16px',
                  position: 'relative',
                  animation: 'fadeIn 0.4s ease-out'
                }}
              >
                <div 
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    background: 'var(--badge-success-bg)', 
                    border: '1px solid var(--badge-success-border)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--badge-success-text)'
                  }}
                >
                  <ShieldCheck size={28} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', letterSpacing: '0.08em' }}>
                    VERIFIED PROOF-OF-WORK
                  </span>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--mockup-text)' }}>
                    Pothole Sealed & Inspected
                  </h4>
                </div>

                <div style={{ background: 'var(--badge-success-bg)', border: '1px solid var(--badge-success-border)', borderRadius: '12px', padding: '12px 16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} style={{ color: 'var(--badge-success-text)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--badge-success-text)' }}>Civic Karma Reward</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--badge-success-text)' }}>
                    +50 PTS
                  </span>
                </div>

                <span style={{ fontSize: '11px', color: 'var(--mockup-muted)', fontFamily: 'var(--font-mono)' }}>
                  VERIFICATION HASH: 0x8f2a...91b4
                </span>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
