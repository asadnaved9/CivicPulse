import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage, Language } from '../../contexts/LanguageContext';
import { 
  Shield, 
  Globe, 
  Settings as SettingsIcon, 
  Check, 
  User, 
  Bell, 
  Sliders, 
  FileText,
  Lock,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MPSettingsPage() {
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [notificationDigest, setNotificationDigest] = useState('realtime');
  const [governancePact, setGovernancePact] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          ADMIN PORTAL
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
          MP Administration Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
          Configure legislative workspace preferences, language models, and priority audit engine parameters.
        </p>
      </div>

      {/* 1. Language & Regional Settings */}
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={18} style={{ color: '#0f172a' }} />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Working Language & Dialect
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Used for automated brief translation and AI prompt dialect processing.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  toast.success(`Language updated to ${lang.name}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                  background: isSelected ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 500, color: '#0f172a' }}>
                    {lang.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {lang.native}
                  </div>
                </div>
                {isSelected && <Check size={16} style={{ color: '#0f172a' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Governance Formula Parameters (6-Factor) */}
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={18} style={{ color: '#0f172a' }} />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              6-Factor Priority Formula Weights
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Standard weights mandated by Parliamentary Governance Challenge framework.
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Demand Density & Upvotes', weight: '25%' },
            { label: 'Infrastructure Gap & Distance', weight: '20%' },
            { label: 'Demographic Reach & Equity', weight: '20%' },
            { label: 'LDP Unbudgeted Deficit', weight: '15%' },
            { label: 'Technical & Site Feasibility', weight: '10%' },
            { label: 'Environmental & Co-benefit', weight: '10%' },
          ].map((item, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '12px 14px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}
            >
              <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                {item.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Session & Security Details */}
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={18} style={{ color: '#0f172a' }} />
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Parliamentary Session Credentials
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Constituency: Ranchi Parliamentary Representative (Jharkhand)
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>
          You are currently in the dedicated <strong>Admin & MP Office</strong> session. Actions taken in the Decision Cockpit, Knapsack Budget Optimizer, and Proposal Lifecycle Pipeline carry official representative attribution.
        </div>
      </div>

    </div>
  );
}
