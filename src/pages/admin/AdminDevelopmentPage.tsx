import React from 'react';
import DevelopmentPage from '../DevelopmentPage';
import { ShieldCheck } from 'lucide-react';

export default function AdminDevelopmentPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Admin Strategic Planning Banner */}
      <div 
        className="card" 
        style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.08)', 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '16px 20px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
              Legislative Intelligence & Capital Works Planning
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
              Priority scores computed with official 6-factor governance weights: Demand Density (25%), Severity (20%), Equity (20%), LDP Deficit (15%), Feasibility (10%), Co-benefit (10%).
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Development Page Content */}
      <DevelopmentPage />
    </div>
  );
}
