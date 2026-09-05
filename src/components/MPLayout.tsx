import React from 'react';
import { MPSidebar } from './MPSidebar';
import { useMPSession } from '../contexts/MPSessionContext';
import HomePage from '../pages/HomePage';

export const MPLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isMPSession } = useMPSession();

  // Graceful degradation: if user hits /mp/* directly without an MP session,
  // render the citizen view gracefully without errors
  if (!isMPSession) {
    return <HomePage />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#ffffff', color: '#0f172a' }}>
      <MPSidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '40px 48px', overflowY: 'auto', backgroundColor: '#ffffff' }}>
        {children}
      </main>
    </div>
  );
};
