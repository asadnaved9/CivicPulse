import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserCheck, ChevronRight, X, ArrowRight, ShieldCheck, Cpu, HeartHandshake } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { user, loginWithGoogle, loginAnonymously } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAuthOptions, setShowAuthOptions] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('civicpulse_onboarded');
    if (!hasOnboarded) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleSkipOrClose = () => {
    localStorage.setItem('civicpulse_onboarded', 'true');
    setIsOpen(false);
  };

  const slides = [
    {
      title: "Report Issues",
      icon: <ShieldCheck size={32} style={{ color: 'var(--primary)' }} />,
      desc: "Spot hazards, damaged public utilities, or road safety concerns in your ward. Submit them in seconds with precise GPS locations.",
      illustration: (
        <div style={{ position: 'relative', width: '200px', height: '140px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Map Grid Background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, background: 'radial-gradient(circle, var(--text-1) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          
          {/* Tactile Radar Circles */}
          <div className="pulse-ring" style={{ position: 'absolute', width: '60px', height: '60px', border: '1.5px solid var(--primary)', borderRadius: '50%', opacity: 0 }} />
          <div className="pulse-ring" style={{ position: 'absolute', width: '90px', height: '90px', border: '1px solid var(--primary)', borderRadius: '50%', opacity: 0, animationDelay: '0.8s' }} />

          {/* Map Pin */}
          <div className="float-pin" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', border: '3px solid var(--surface)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }} />
            <div style={{ width: '4px', height: '10px', background: 'var(--primary)', transform: 'translateY(-2px)' }} />
          </div>
        </div>
      )
    },
    {
      title: "AI Analyzes",
      icon: <Cpu size={32} style={{ color: 'var(--primary)' }} />,
      desc: "Our customized municipal AI pipeline instantly parses details, automatically categorizes issues, assesses safety severities, and routes to correct ward authorities.",
      illustration: (
        <div style={{ position: 'relative', width: '200px', height: '140px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px', gap: '8px' }}>
          {/* AI Code/Data Blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: 0.8 }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="block-pulse" style={{ width: '40px', height: '8px', background: 'var(--text-3)', borderRadius: '4px', animationDelay: '0.1s' }} />
              <div className="block-pulse" style={{ width: '90px', height: '8px', background: 'var(--primary)', borderRadius: '4px', opacity: 0.7 }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="block-pulse" style={{ width: '70px', height: '8px', background: 'var(--text-3)', borderRadius: '4px', animationDelay: '0.3s' }} />
              <div className="block-pulse" style={{ width: '50px', height: '8px', background: 'var(--text-2)', borderRadius: '4px', animationDelay: '0.5s' }} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div className="block-pulse" style={{ width: '55px', height: '8px', background: 'var(--primary)', borderRadius: '4px', opacity: 0.7, animationDelay: '0.2s' }} />
              <div className="block-pulse" style={{ width: '75px', height: '8px', background: 'var(--text-3)', borderRadius: '4px', animationDelay: '0.4s' }} />
            </div>
          </div>

          {/* Neon Scanner Line */}
          <div className="radar-scanner" style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', opacity: 0.8, shadow: '0 0 8px var(--primary)' }} />
        </div>
      )
    },
    {
      title: "Community Resolves",
      icon: <HeartHandshake size={32} style={{ color: 'var(--primary)' }} />,
      desc: "Earn impact points, secure leadership badges, vote on priority repairs, and monitor live resolutions to restore municipal transparency.",
      illustration: (
        <div style={{ position: 'relative', width: '200px', height: '140px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px' }}>
          {/* Verification / Progress Check */}
          <div style={{ width: '100%', background: 'var(--border)', height: '6px', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
            <div className="progress-fill" style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--primary)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="success-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-subtle)', border: '1.5px solid var(--primary)', color: 'var(--primary)' }}>
              ✓
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-1)' }}>100% RESOLVED</span>
          </div>

          {/* Confetti Micro-Effects */}
          <div className="confetti" style={{ position: 'absolute', left: '30%', top: '30%', width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%' }} />
          <div className="confetti" style={{ position: 'absolute', right: '35%', bottom: '25%', width: '5px', height: '5px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.4s' }} />
          <div className="confetti" style={{ position: 'absolute', left: '25%', bottom: '30%', width: '3px', height: '3px', background: 'var(--text-2)', borderRadius: '50%', animationDelay: '0.8s' }} />
        </div>
      )
    }
  ];

  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      if (!user) {
        setShowAuthOptions(true);
      } else {
        handleSkipOrClose();
      }
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={handleSkipOrClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .float-pin {
          animation: float-pin-anim 1.8s ease-in-out infinite;
        }
        @keyframes float-pin-anim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .pulse-ring {
          animation: pulse-ring-anim 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes pulse-ring-anim {
          0% { transform: scale(0.5); opacity: 1; }
          80%, 100% { transform: scale(1.4); opacity: 0; }
        }
        .radar-scanner {
          animation: radar-scanner-anim 2.5s ease-in-out infinite;
        }
        @keyframes radar-scanner-anim {
          0%, 100% { top: 0%; }
          50% { top: 90%; }
        }
        .block-pulse {
          animation: block-pulse-anim 1.5s ease-in-out infinite alternate;
        }
        @keyframes block-pulse-anim {
          0% { opacity: 0.3; }
          100% { opacity: 0.9; }
        }
        .progress-fill {
          animation: progress-fill-anim 3s ease-out infinite;
        }
        @keyframes progress-fill-anim {
          0% { width: 0%; }
          75%, 100% { width: 100%; }
        }
        .success-badge {
          animation: success-badge-anim 3s ease-out infinite;
        }
        @keyframes success-badge-anim {
          0%, 70% { transform: scale(0.7); opacity: 0.2; }
          75%, 100% { transform: scale(1); opacity: 1; }
        }
        .confetti {
          animation: confetti-anim 3s ease-out infinite;
        }
        @keyframes confetti-anim {
          0%, 70% { transform: scale(0.2) translateY(10px); opacity: 0; }
          75% { opacity: 1; }
          100% { transform: scale(1) translateY(-15px); opacity: 0; }
        }
      `}</style>

      <div 
        className="card" 
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          background: 'var(--surface)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleSkipOrClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-3)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          className="hover-card"
        >
          <X size={18} />
        </button>

        {!showAuthOptions ? (
          <>
            {/* Slide Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <div style={{
                background: 'var(--primary-subtle)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {slides[currentSlide].icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  STEP {currentSlide + 1} OF 3
                </span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  {slides[currentSlide].title}
                </h3>
              </div>
            </div>

            {/* Slide Illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              {slides[currentSlide].illustration}
            </div>

            {/* Description */}
            <p className="text-sm" style={{ color: 'var(--text-2)', textAlign: 'center', lineHeight: '1.6', margin: '0 12px' }}>
              {slides[currentSlide].desc}
            </p>

            {/* Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              {/* Dot Indicators */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {slides.map((_, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: currentSlide === idx ? '20px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      background: currentSlide === idx ? 'var(--primary)' : 'var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isLastSlide && (
                  <button 
                    onClick={handleSkipOrClose}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', background: 'transparent', border: 'none' }}
                  >
                    Skip
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {isLastSlide ? "Get Started" : "Next"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Custom Embedded Sign-In Slide to meet the 'ends with Get Started -> sign in' requirement smoothly */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                background: 'var(--primary-subtle)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto',
                color: 'var(--primary)'
              }}>
                <LogIn size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Create Your Account</h3>
              <p className="text-sm" style={{ color: 'var(--text-2)', padding: '0 12px' }}>
                Sign in to secure your points, claim resolution badges, vote on priority repairs, and unlock all CivicPulse benefits.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '13px', display: 'flex', justifyContent: 'center' }}
                onClick={async () => {
                  handleSkipOrClose();
                  await loginWithGoogle();
                }}
              >
                Sign In with Google
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '12px', fontSize: '13px', display: 'flex', justifyContent: 'center' }}
                onClick={async () => {
                  handleSkipOrClose();
                  await loginAnonymously();
                }}
              >
                Continue Anonymously
              </button>
            </div>

            <button 
              className="btn text-muted" 
              style={{ background: 'transparent', alignSelf: 'center', fontSize: '12px', marginTop: '4px', border: 'none', padding: '4px' }}
              onClick={handleSkipOrClose}
            >
              Skip Registration for Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
