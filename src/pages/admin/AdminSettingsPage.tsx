import React from 'react';
import { Settings, Shield, Map, Key, Database } from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          SYSTEM SETTINGS
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>
          Portal Settings & Config
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
          Manage ward configurations, AI auto-dispatching settings, and access control policies.
        </p>
      </div>

      {/* Grid of settings options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Ward Settings */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Map size={16} color="var(--primary)" /> Geographic Ward Administration
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
            Active municipality: <strong>Kolkata Municipality</strong>. Active wards: 5 divisions (Ward 63, Ward 97, Ward 108, Ward 85, Ward 50). Custom boundary shapefiles are synchronized from KMC GIS Server.
          </p>
          <button style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: '12px',
            color: 'var(--text-1)',
            cursor: 'pointer'
          }}>
            Refresh Boundary Maps
          </button>
        </div>

        {/* AI Auto-Dispatch */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Database size={16} color="var(--primary)" /> Gemini AI Auto-Dispatch Rules
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
            Triage is active. Incoming photos undergo auto-distress verification and are allocated target SLA timelines (critical: 2 days, medium: 5 days, low: 10 days).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Status: </span>
            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              AUTO-TRIAGE ACTIVE
            </span>
          </div>
        </div>

        {/* Security Access Control */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={16} color="var(--primary)" /> Access Control & Audit
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
            Role-Based Access Control (RBAC) is enforced. Security clearance level: <strong>Ward Administrator</strong>. Active security keys are managed on the Super Admin console.
          </p>
          <button style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: '12px',
            color: 'var(--text-1)',
            cursor: 'pointer'
          }}>
            Download Security Audit Log
          </button>
        </div>

      </div>

    </div>
  );
};

export default AdminSettingsPage;
