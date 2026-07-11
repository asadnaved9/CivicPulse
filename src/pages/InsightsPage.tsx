import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../config/firebase';
import { 
  Sparkles, Send, Loader, MessageSquare, Download, FileText, 
  CheckSquare, Filter, Building, HelpCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InsightsPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Q&A Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Narrative Report states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [narrativeReport, setNarrativeReport] = useState<string | null>(null);

  // Sync active issues list to ground the AI context
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const snap = await getDocs(collection(db, 'issues'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIssues(list);
      } catch (err) {
        console.error("Failed to load context for insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, []);

  // Auto-scroll chat log
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Q&A Chat Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatMessage('');

    const nextHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(nextHistory);
    setChatLoading(true);

    try {
      const response = await fetchWithAuth('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: nextHistory.slice(0, -1),
          contextIssues: issues // Grounding dataset
        })
      });

      const data = await response.json();
      setChatHistory([...nextHistory, { role: 'model', text: data.reply || "AI Service is currently unresponsive." }]);
    } catch (err) {
      console.error("Ground-truth chat error:", err);
      setChatHistory([...nextHistory, { role: 'model', text: "Unable to reach the civic intelligence gateway. Please verify network access." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Area Narrative Report
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setNarrativeReport(null);

    // Filter issues based on category selection to narrow report scope
    const filteredCtx = selectedCategory === 'all' 
      ? issues 
      : issues.filter(i => i.category === selectedCategory);

    try {
      const response = await fetchWithAuth('/api/agents/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextIssues: filteredCtx
        })
      });

      const data = await response.json();
      setNarrativeReport(data.report);
      toast.success("Intelligence Report compiled successfully!");
    } catch (err) {
      console.error("Report compilation failed:", err);
      toast.error("Failed to generate Area Intelligence Report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Download compiled report as .txt file
  const handleDownloadReport = () => {
    if (!narrativeReport) return;

    const header = `CIVICPULSE WARD INTELLIGENCE REPORT\n======================================\nScope: ${selectedCategory.toUpperCase()} CATEGORY\nGenerated: ${new Date().toLocaleString()}\n======================================\n\n`;
    const blob = new Blob([header + narrativeReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `civicpulse_report_${selectedCategory}.txt`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report file downloaded successfully.");
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Title Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ marginBottom: '6px' }}>Civic Intelligence Analyst Workspace</h1>
        <p style={{ color: 'var(--text-2)' }}>
          Interact with our grounded LLM model to query infrastructure logs or compile structured executive summaries for local wards.
        </p>
      </div>

      <div className="grid-cols-2" style={{ gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Grounded Q&A Assistant */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0 }}>
          
          {/* Column Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Ward Q&A Ground-Truth Engine</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Analyzing {issues.length} reported events across the municipality</span>
            </div>
          </div>

          {/* Chat Logs */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', alignSelf: 'flex-start', maxWidth: '85%', lineHeight: '1.4' }}>
              Welcome. I am grounded directly in active Firestore reports for the municipal wards. 
              <br /><br />
              Ask me specific analytical queries:
              <ul style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li><em>"How many water leaks are currently open?"</em></li>
                <li><em>"Where are the streetlights broken?"</em></li>
                <li><em>"Show me the high severity issues in the commercial sector."</em></li>
              </ul>
            </div>

            {chatHistory.map((chat, idx) => (
              <div 
                key={idx}
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  maxWidth: '85%',
                  lineHeight: '1.4',
                  alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                  background: chat.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                  color: chat.role === 'user' ? '#FFFFFF' : 'var(--text-1)'
                }}
              >
                {chat.text}
              </div>
            ))}

            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '6px 12px' }}>
                <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)' }} />
                <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', animationDelay: '0.2s' }} />
                <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-3)', animationDelay: '0.4s' }} />
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input text-sm" 
              placeholder="e.g. List all potholes that are verified..." 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              disabled={chatLoading}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 16px' }} disabled={chatLoading}>
              <Send size={15} />
            </button>
          </form>

        </div>

        {/* RIGHT COLUMN: Executive Report Compiler */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Executive Ward Report Compiler</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Generate professional audits for BBMP engineering directors</span>
            </div>

            {/* Filter */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} />
                Scope Filter
              </label>
              <select 
                className="form-input" 
                style={{ background: 'var(--surface-2)' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories Combined</option>
                <option value="pothole">Potholes Only</option>
                <option value="streetlight">Broken Streetlights Only</option>
                <option value="water">Water & Sewers Only</option>
                <option value="waste">Waste Management Only</option>
              </select>
            </div>

            <button 
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
            >
              {generatingReport ? (
                <>
                  <Loader size={16} className="shimmer" style={{ animation: 'spin 1.2s linear infinite' }} />
                  Compiling Narrative Report...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Compile Executive Summary
                </>
              )}
            </button>
          </div>

          {/* Compiled Output Card */}
          {narrativeReport && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} />
                  COMPILED TEXT NARRATIVE
                </span>
                
                <button 
                  onClick={handleDownloadReport}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '6px 12px' }}
                >
                  <Download size={13} />
                  Export .txt
                </button>
              </div>

              <div 
                style={{ 
                  background: 'var(--bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '6px', 
                  padding: '20px', 
                  fontSize: '13px', 
                  lineHeight: '1.6', 
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {narrativeReport}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
