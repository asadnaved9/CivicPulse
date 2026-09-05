import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useMPSession } from '../../contexts/MPSessionContext';

export default function MPLoginPage() {
  const { enterMPMode } = useMPSession();
  const navigate = useNavigate();

  const handleEnter = () => {
    enterMPMode();
    navigate('/mp/dashboard');
  };

  return (
    <div 
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div 
        className="card" 
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }}
      >
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}
        >
          <ShieldCheck size={36} />
        </div>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', fontWeight: 700, marginBottom: '12px' }}>
            <Lock size={12} /> RESTRICTED ACCESS
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-1)' }}>
            MP & Administration Portal
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
            Authorized interface for Members of Parliament, Ward Commissioners, and Strategic Planning Officers.
          </p>
        </div>

        <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <button
            onClick={handleEnter}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6'
            }}
          >
            <span>Enter MP Control Panel</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
          CivicPulse Governance System • Bangalore Central Parliamentary Office
        </div>
      </div>
    </div>
  );
}
