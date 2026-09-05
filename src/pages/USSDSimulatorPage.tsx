import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, Phone, Radio, ArrowLeft, RefreshCw, Send, CheckCircle2, Shield, Info, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function USSDSimulatorPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('+91 98450 12345');
  const [sessionId, setSessionId] = useState(() => `ussd_demo_${Date.now()}`);
  const [ussdDisplay, setUssdDisplay] = useState('Dialing *384# ...');
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logs, setLogs] = useState<Array<{ from: 'network' | 'user'; text: string; time: string }>>([]);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Auto-initiate session on load
  useEffect(() => {
    startSession('*384#');
  }, []);

  const startSession = async (dialCode: string = '*384#') => {
    setIsLoading(true);
    setIsComplete(false);
    setSubmittedData(null);
    const newSession = `ussd_demo_${Date.now()}`;
    setSessionId(newSession);

    try {
      const res = await fetch('/api/ussd/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: newSession,
          input: dialCode,
          phoneNumber
        })
      });

      const data = await res.json();
      setUssdDisplay(data.message);
      setIsComplete(data.isComplete);
      setLogs([{ from: 'network', text: data.message, time: new Date().toLocaleTimeString() }]);
    } catch (e: any) {
      toast.error('USSD Gateway connection failed');
      setUssdDisplay('Connection error to cellular tower gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isLoading || isComplete) return;

    const userInput = inputVal.trim();
    setInputVal('');
    setIsLoading(true);

    setLogs(prev => [...prev, { from: 'user', text: userInput, time: new Date().toLocaleTimeString() }]);

    try {
      const res = await fetch('/api/ussd/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          input: userInput,
          phoneNumber
        })
      });

      const data = await res.json();
      setUssdDisplay(data.message);
      setIsComplete(data.isComplete);
      setLogs(prev => [...prev, { from: 'network', text: data.message, time: new Date().toLocaleTimeString() }]);

      if (data.isComplete && data.requestPayload) {
        setSubmittedData(data.requestPayload);
        toast.success('USSD civic submission saved to database!', { duration: 4000 });
      }
    } catch (e) {
      toast.error('Transmission error');
    } finally {
      setIsLoading(false);
    }
  };

  const pressKey = (key: string) => {
    if (isComplete) return;
    setInputVal(prev => prev + key);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Feature Phone USSD/IVR Gateway
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-3)' }}>
              Universal digital inclusion layer enabling citizens on 2G feature phones to report issues and needs with zero internet data.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => startSession('*384#')} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Redial *384#
          </button>
        </div>
      </div>

      {/* Main Container: Feature Phone Mockup + Live Wire Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Feature Phone Device UI */}
        <div 
          className="card" 
          style={{ 
            background: '#1a1f2c', 
            borderRadius: '28px', 
            border: '4px solid #2d3748', 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxWidth: '380px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {/* Phone Ear Speaker */}
          <div style={{ width: '60px', height: '6px', background: '#4a5568', borderRadius: '3px', marginBottom: '16px' }} />

          {/* Signal & Carrier Header */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', padding: '0 8px', marginBottom: '8px' }}>
            <span>📶 BSNL / Vodacom GSM</span>
            <span>⚡ USSD Gateway Active</span>
          </div>

          {/* Monochrome / Backlit Feature Phone Screen */}
          <div 
            style={{ 
              width: '100%', 
              minHeight: '220px', 
              background: '#0a1f0a', 
              border: '2px solid #14532d', 
              borderRadius: '12px', 
              padding: '16px', 
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: '"Courier New", Courier, monospace'
            }}
          >
            {/* Screen Content */}
            <div style={{ color: '#4ade80', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>USSD Requesting...</span>
                </div>
              ) : (
                ussdDisplay
              )}
            </div>

            {/* Input Response Box */}
            <form onSubmit={handleSend} style={{ marginTop: '12px', borderTop: '1px dashed #166534', paddingTop: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder={isComplete ? "Session completed" : "Type reply (e.g. 1)..."}
                  disabled={isComplete || isLoading}
                  autoFocus
                  style={{
                    flex: 1,
                    background: '#052e16',
                    border: '1px solid #16a34a',
                    color: '#86efac',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'inherit'
                  }}
                />
                <button
                  type="submit"
                  disabled={isComplete || isLoading || !inputVal}
                  style={{
                    background: '#16a34a',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0 12px',
                    fontWeight: 700,
                    cursor: (isComplete || isLoading || !inputVal) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>

          {/* Physical Phone Keypad Simulation */}
          <div style={{ width: '100%', marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => pressKey(k)}
                disabled={isComplete}
                style={{
                  background: '#242e42',
                  border: '1px solid #334155',
                  color: '#e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 0',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isComplete ? 'not-allowed' : 'pointer',
                  boxShadow: '0 3px 0 #0f172a',
                  transition: 'transform 0.05s'
                }}
              >
                {k}
              </button>
            ))}
          </div>

          {/* Call / End Buttons */}
          <div style={{ width: '100%', marginTop: '12px', display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => startSession('*384#')} 
              style={{ flex: 1, background: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <PhoneCall size={14} /> Call / Redial
            </button>
            <button 
              onClick={() => {
                setIsComplete(true);
                setUssdDisplay('Session ended by user.');
              }} 
              style={{ flex: 1, background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <Phone size={14} /> End Call
            </button>
          </div>
        </div>

        {/* Right Column: Live Network Trace & Persisted Data Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Explanation Card */}
          <div className="card" style={{ padding: '18px', background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Radio size={16} className="text-primary" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                DPI Zero-Data Inclusion Protocol (*384#)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.5' }}>
              In emerging BRICS economies, up to 40% of underserved citizens access mobile services solely via 2G networks without smartphones. This engine provides full parity: citizens navigate interactive USSD menu trees, categorize local needs, and submit tickets directly into the live municipal database.
            </p>
          </div>

          {/* Persisted Database Record (Visible upon completion) */}
          {submittedData && (
            <div className="card" style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.08)', border: '2px solid #10B981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#10B981' }}>
                  Persisted to Live Firestore
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                <div><strong style={{ color: 'var(--text-1)' }}>Type:</strong> {submittedData.type}</div>
                <div><strong style={{ color: 'var(--text-1)' }}>Channel:</strong> {submittedData.channel.toUpperCase()}</div>
                <div><strong style={{ color: 'var(--text-1)' }}>Sector:</strong> {submittedData.category}</div>
                <div><strong style={{ color: 'var(--text-1)' }}>Ward:</strong> {submittedData.ward}</div>
                <div><strong style={{ color: 'var(--text-1)' }}>Urgency:</strong> {submittedData.urgency}/100 ({submittedData.priority})</div>
                <div><strong style={{ color: 'var(--text-1)' }}>Phone:</strong> {submittedData.phoneNumber}</div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-2)' }}>
                <strong>Reported Issue:</strong> "{submittedData.description_original}"
              </div>
            </div>
          )}

          {/* Live USSD Network Logs */}
          <div className="card" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>TELECOM GSM SESSION TRACE</span>
              <span className="badge badge-secondary" style={{ fontSize: '10px' }}>Session: {sessionId.slice(-10)}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px' }}>
              {logs.map((log, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    background: log.from === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-2)',
                    borderLeft: `3px solid ${log.from === 'user' ? '#3b82f6' : '#10b981'}`,
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-3)', fontSize: '10px', marginBottom: '4px' }}>
                    <span>{log.from === 'user' ? '📱 CITIZEN KEYPAD' : '🗼 CELLULAR BASE STATION'}</span>
                    <span>{log.time}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{log.text}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
