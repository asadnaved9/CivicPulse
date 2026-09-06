import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  PlusCircle, 
  MapPin, 
  CheckCircle2, 
  Cpu, 
  Award, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  BarChart3, 
  Users, 
  Clock, 
  Layers 
} from 'lucide-react';
import { MobileMapMockup } from '../components/MobileMapMockup';
import { AnimatedHowItWorks2D } from '../components/AnimatedHowItWorks2D';
import { InteractiveCityRadar } from '../components/InteractiveCityRadar';
import { AnimatedConclusion2D } from '../components/AnimatedConclusion2D';
import { useLanguage } from '../contexts/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', minHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden', transition: 'background 0.3s ease, color 0.3s ease' }}>
      
      {/* Animated Neon Background Glow Orbs */}
      <div className="neon-orb neon-orb-cyan" style={{ top: '5%', left: '-80px', width: '480px', height: '480px' }} />
      <div className="neon-orb neon-orb-purple" style={{ top: '12%', right: '-80px', width: '520px', height: '520px' }} />
      <div className="neon-orb neon-orb-emerald" style={{ top: '48%', left: '15%', width: '420px', height: '420px' }} />
      <div className="neon-orb neon-orb-purple" style={{ top: '72%', right: '5%', width: '550px', height: '550px' }} />

      {/* SECTION 1: HERO SECTION */}
      <section className="hero-gradient" style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr', gap: '64px', alignItems: 'center' }} className="hero-grid">
          
          {/* Left Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 10 }}>
            <h1 style={{ 
              fontSize: 'clamp(40px, 5vw, 64px)', 
              fontWeight: 700, 
              lineHeight: 1.1, 
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--text-1)'
            }}>
              {t('home.heroTitle', 'Every Issue Reported. Every Repair Verified.')}
            </h1>
            
            <p style={{ 
              fontSize: 'clamp(16px, 2vw, 18px)', 
              color: 'var(--text-2)', 
              lineHeight: 1.6, 
              maxWidth: '540px',
              margin: 0
            }}>
              {t('home.heroSubtitle', 'AI-driven accountability for the modern city. Transparent, verifiable, and tamper-proof infrastructure monitoring.')}
            </p>

            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => navigate('/report', { state: { mode: 'suggestion' } })}
                className="btn" 
                style={{ 
                  background: 'var(--primary)', 
                  color: 'var(--bg)', 
                  padding: '14px 28px', 
                  fontSize: '14px', 
                  fontWeight: 600,
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <TrendingUp size={18} style={{ marginRight: '8px' }} />
                {t('suggestDevelopment', 'Suggest Development').toUpperCase()}
              </button>
              <button 
                onClick={() => navigate('/report', { state: { mode: 'problem' } })}
                className="btn" 
                style={{ 
                  background: 'transparent', 
                  color: 'var(--text-1)', 
                  border: '1px solid var(--text-1)',
                  padding: '14px 28px', 
                  fontSize: '14px', 
                  fontWeight: 600,
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={18} style={{ marginRight: '8px' }} />
                {t('nav.reportIssue').toUpperCase()}
              </button>
            </div>
          </div>

          {/* Right Phone Column */}
          <div style={{ display: 'flex', justifyContent: 'center', zIndex: 10, position: 'relative' }}>
            {/* Subtle background glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 0 }} />
            <MobileMapMockup />
          </div>
        </div>
      </section>

      {/* SECTION 2: 2D ANIMATED INTERACTIVE STEP BY STEP GUIDE */}
      <AnimatedHowItWorks2D />

      {/* SECTION 3: INTERACTIVE CITY HEALTH & STREAM RADAR */}
      <InteractiveCityRadar />

      {/* SECTION 4: 2D ANIMATED CITY TRANSFORMATION CONCLUSION */}
      <AnimatedConclusion2D />

      {/* Responsive Grid Styles */}
      <style>
        {`
          @media (min-width: 992px) {
            .hero-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}
