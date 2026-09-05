import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Shield, ArrowRight } from 'lucide-react';

const AdminDependenciesPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Task Dependencies</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 4 }}>Monitor cross-department blockers and resolutions.</p>
      </header>

      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: '#ef4444' }}>
            <Shield size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Active Blockers</h2>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>1 Critical Dependency</span>
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: 600 }}>CP-1045 (Road Damage)</span>
            <span style={{ color: 'var(--error)', fontSize: 12, fontWeight: 600, padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 4 }}>BLOCKED</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-2)' }}>
            <div style={{ padding: 8, background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
              Road Dept. (Rahul Kumar)
            </div>
            <ArrowRight size={16} />
            <div style={{ padding: 8, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: 6, border: '1px solid #22c55e' }}>
              Forest Dept. (Aman Singh)
            </div>
            <ArrowRight size={16} />
            <div style={{ padding: 8, background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: 6, border: '1px solid #eab308' }}>
              Electricity Dept. (Rohit Sharma)
            </div>
            <ArrowRight size={16} />
            <div style={{ padding: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 6, border: '1px solid #ef4444' }}>
              Traffic Police
            </div>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-3)' }}>Reason: Fallen tree entangled with power lines on main road.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDependenciesPage;
