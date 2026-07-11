import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Building2, Users } from 'lucide-react';

const AdminDepartmentsPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Departments</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 4 }}>Manage municipal departments and their active workloads.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {/* Road Department */}
        <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: '#3b82f6' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Road Department</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>12 Active Workers</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 14 }}>
            <span>Active Tasks: <strong>8</strong></span>
            <span>Blocked: <strong style={{ color: 'var(--error)' }}>2</strong></span>
          </div>
        </div>

        {/* Forest Department */}
        <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, color: '#22c55e' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Forest Department</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>5 Active Workers</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 14 }}>
            <span>Active Tasks: <strong>3</strong></span>
            <span>Blocked: <strong>0</strong></span>
          </div>
        </div>

        {/* Electricity Department */}
        <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, background: 'rgba(234, 179, 8, 0.1)', borderRadius: 8, color: '#eab308' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Electricity Department</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>8 Active Workers</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 14 }}>
            <span>Active Tasks: <strong>5</strong></span>
            <span>Blocked: <strong>0</strong></span>
          </div>
        </div>
        
        {/* Traffic Police */}
        <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: '#ef4444' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Traffic Police</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>20 Active Workers</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: 14 }}>
            <span>Active Tasks: <strong>12</strong></span>
            <span>Blocked: <strong>0</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDepartmentsPage;
