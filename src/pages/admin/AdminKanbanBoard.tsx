import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertOctagon, ArrowRight, Camera, Check, Shield } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: number;
  assignedDepartment?: string;
}

interface KanbanProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
}

export const AdminKanbanBoard: React.FC<KanbanProps> = ({ issues, onSelectIssue }) => {
  const { t } = useLanguage();

  const columns = [
    { id: 'reported', title: 'Pending' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'blocked', title: 'Blocked' },
    { id: 'resolved', title: 'Resolved' },
  ];

  const getColColor = (id: string) => {
    switch (id) {
      case 'reported': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'blocked': return '#ef4444';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, height: '100%' }}>
      {columns.map(col => {
        const colIssues = issues.filter(i => {
          if (col.id === 'blocked') return i.status === 'blocked';
          if (col.id === 'reported') return i.status === 'reported' || i.status === 'verified';
          return i.status === col.id;
        });

        return (
          <div key={col.id} style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface-2)', padding: 12, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: getColColor(col.id), marginRight: 6 }}></span>
                {col.title}
              </h3>
              <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--surface)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-2)' }}>{colIssues.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {colIssues.map(issue => (
                <div 
                  key={issue.id} 
                  onClick={() => onSelectIssue(issue)}
                  style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{issue.id}</span>
                    {issue.status === 'blocked' && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>BLOCKED</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-1)' }}>{issue.title}</h4>
                  
                  {issue.assignedDepartment && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🏢 {issue.assignedDepartment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
