import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DevelopmentPage from '../DevelopmentPage';
import AdminSuggestionsPage from './AdminSuggestionsPage';
import { ShieldCheck, Lightbulb, TrendingUp } from 'lucide-react';

export default function AdminDevelopmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'suggestions' | 'planning') || 'suggestions';
  const [activeTab, setActiveTab] = useState<'suggestions' | 'planning'>(initialTab);

  const handleTabChange = (tab: 'suggestions' | 'planning') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Dual Mode Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => handleTabChange('suggestions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'suggestions' ? 'var(--bg)' : 'transparent',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeTab === 'suggestions' ? 'var(--primary)' : 'var(--text-3)',
              cursor: 'pointer',
              boxShadow: activeTab === 'suggestions' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Lightbulb size={15} />
            <span>Citizen Proposals Queue</span>
          </button>

          <button
            onClick={() => handleTabChange('planning')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeTab === 'planning' ? 'var(--bg)' : 'transparent',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeTab === 'planning' ? 'var(--primary)' : 'var(--text-3)',
              cursor: 'pointer',
              boxShadow: activeTab === 'planning' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <TrendingUp size={15} />
            <span>Capital Works & Strategic Planning</span>
          </button>
        </div>
      </div>

      {activeTab === 'suggestions' ? (
        <AdminSuggestionsPage />
      ) : (
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
              gap: '12px',
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
      )}
    </div>
  );
}
