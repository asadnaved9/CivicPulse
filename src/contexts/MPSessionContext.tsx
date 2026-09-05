import React, { createContext, useContext, useState, useEffect } from 'react';

interface MPSessionContextType {
  isMPSession: boolean;
  enterMPMode: () => void;
  exitMPMode: () => void;
}

const MPSessionContext = createContext<MPSessionContextType | undefined>(undefined);

export const MPSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMPSession, setIsMPSession] = useState<boolean>(() => {
    return localStorage.getItem('civicpulse_mp_session') === 'true';
  });

  const enterMPMode = () => {
    localStorage.setItem('civicpulse_mp_session', 'true');
    setIsMPSession(true);
  };

  const exitMPMode = () => {
    localStorage.removeItem('civicpulse_mp_session');
    setIsMPSession(false);
  };

  return (
    <MPSessionContext.Provider value={{ isMPSession, enterMPMode, exitMPMode }}>
      {children}
    </MPSessionContext.Provider>
  );
};

export const useMPSession = () => {
  const context = useContext(MPSessionContext);
  if (!context) {
    throw new Error('useMPSession must be used within an MPSessionProvider');
  }
  return context;
};
