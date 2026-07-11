import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users } from 'lucide-react';

const AdminWorkersPage: React.FC = () => {
  const { t } = useLanguage();

  const workers = [
    { id: 1, name: 'Rahul Kumar', dept: 'Road Department', status: 'Blocked', task: 'CP-1045' },
    { id: 2, name: 'Aman Singh', dept: 'Forest Department', status: 'Assigned', task: 'CP-1045' },
    { id: 3, name: 'Rohit Sharma', dept: 'Electricity Department', status: 'Pending', task: 'CP-1045' },
    { id: 4, name: 'Vikash Yadav', dept: 'Traffic Police', status: 'Pending', task: 'CP-1045' },
    { id: 5, name: 'Sanjay Mishra', dept: 'Water Department', status: 'Active', task: 'CP-1012' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Municipal Workers</h1>
        <p style={{ color: 'var(--text-2)', marginTop: 4 }}>Live tracking of worker assignments and statuses.</p>
      </header>

      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px' }}>Worker Name</th>
              <th style={{ padding: '16px' }}>Department</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Current Task</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                      {w.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {w.name}
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-2)' }}>{w.dept}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    fontSize: 12, 
                    fontWeight: 600,
                    background: w.status === 'Blocked' ? 'rgba(239, 68, 68, 0.1)' : 
                                w.status === 'Assigned' ? 'rgba(59, 130, 246, 0.1)' : 
                                w.status === 'Pending' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    color: w.status === 'Blocked' ? '#ef4444' : 
                           w.status === 'Assigned' ? '#3b82f6' : 
                           w.status === 'Pending' ? '#eab308' : '#22c55e',
                  }}>
                    {w.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-2)' }}>{w.task}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminWorkersPage;
