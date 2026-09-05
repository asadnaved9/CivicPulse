import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../config/firebase';
import { 
  Award, CheckCircle, TrendingUp, AlertCircle, Sparkles, 
  ChevronRight, Calendar, User, ShieldAlert, MessageSquare, 
  Send, Loader, Download, FileText, Filter, LayoutGrid, CheckSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DevelopmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Active Tab: 'analytics' | 'intelligence' | 'insights-chat'
  const [activeTab, setActiveTab] = useState<'analytics' | 'intelligence' | 'insights-chat'>('analytics');

  // ═══════════════════════════════════════════════════════════════
  // TAB 1: OPERATIONS ANALYTICS STATES
  // ═══════════════════════════════════════════════════════════════
  const [healthScore, setHealthScore] = useState(85);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    verified: 0,
    avgSeverity: 3
  });
  const [areaSummary, setAreaSummary] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<{ [key: string]: number }>({
    pothole: 0,
    streetlight: 0,
    water: 0,
    waste: 0,
    other: 0
  });
  const [resolutions, setResolutions] = useState<any[]>([]);

  // ═══════════════════════════════════════════════════════════════
  // TAB 2: AI DEVELOPMENT GAPS STATES
  // ═══════════════════════════════════════════════════════════════
  const [clusters, setClusters] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [ldpProjects, setLdpProjects] = useState<any[]>([]);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // LDP Upload form states
  const [ldpText, setLdpText] = useState('');
  const [ldpFilename, setLdpFilename] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // TAB 3: GROUNDED CHAT & EXECUTIVE COMPILER STATES
  // ═══════════════════════════════════════════════════════════════
  const [issues, setIssues] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Narrative Report compiler
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [narrativeReport, setNarrativeReport] = useState<string | null>(null);

  // Load and sync intelligence datasets
  const loadIntelligenceData = async () => {
    try {
      if (!isFirebaseConfigured) return;
      const clustersSnap = await getDocs(collection(db, 'clusters'));
      setClusters(clustersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const recsSnap = await getDocs(collection(db, 'recommendations'));
      setRecommendations(recsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ldpSnap = await getDocs(collection(db, 'developmentPlans'));
      setLdpProjects(ldpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to load intelligence data:", err);
    }
  };

  // Sync operations analytics
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        // Fetch Area Summary from cache or Firestore
        const cachedSummary = sessionStorage.getItem('civicpulse_area_summary');
        const cachedTime = sessionStorage.getItem('civicpulse_area_summary_time');
        const now = Date.now();

        if (cachedSummary && cachedTime && (now - parseInt(cachedTime)) < 10 * 60 * 1000) {
          setAreaSummary(cachedSummary);
        } else {
          const summarySnap = await getDoc(doc(db, 'analytics', 'summary'));
          if (summarySnap.exists()) {
            const txt = summarySnap.data().summaryText;
            setAreaSummary(txt);
            sessionStorage.setItem('civicpulse_area_summary', txt);
            sessionStorage.setItem('civicpulse_area_summary_time', now.toString());
          } else {
            setAreaSummary("Municipal and community operations are balanced. Focus is directed on pothole repairs and lighting safety in central residential zones.");
          }
        }

        // Fetch Health Score metrics
        const healthSnap = await getDoc(doc(db, 'analytics', 'healthScore'));
        if (healthSnap.exists()) {
          const data = healthSnap.data();
          setHealthScore(data.score || 85);
          setStats({
            total: data.totalIssues || 0,
            open: data.openCount || 0,
            resolved: data.resolvedCount || 0,
            verified: data.verifiedCount || 0,
            avgSeverity: data.avgSeverity || 3
          });
        }

        // Fetch issues to calculate Category Hotspots and load grounding chat context
        const issuesSnap = await getDocs(collection(db, 'issues'));
        const list = issuesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setIssues(list);

        const counts: { [key: string]: number } = { pothole: 0, streetlight: 0, water: 0, waste: 0, other: 0 };
        const resolvedList: any[] = [];

        list.forEach((issue) => {
          const cat = issue.category || 'other';
          if (counts[cat] !== undefined) {
            counts[cat]++;
          } else {
            counts['other']++;
          }

          if (issue.status === 'resolved') {
            resolvedList.push(issue);
          }
        });

        setCategoryCounts(counts);

        // Sort resolved feed desc
        resolvedList.sort((a, b) => {
          const tA = a.resolvedAt?.seconds || 0;
          const tB = b.resolvedAt?.seconds || 0;
          return tB - tA;
        });
        setResolutions(resolvedList.slice(0, 5));

      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    loadIntelligenceData();
  }, []);

  // Auto scroll chat log
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handler: Rebuild AI Clusters
  const handleRebuildClusters = async () => {
    setClusteringLoading(true);
    try {
      const res = await fetchWithAuth('/api/clusters/rebuild', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'AI Cluster rebuilding completed successfully!');
        await loadIntelligenceData();
      } else {
        toast.error('Failed to rebuild clusters.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during clustering.');
    } finally {
      setClusteringLoading(false);
    }
  };

  // Handler: Trigger AI Alignment Analysis
  const handleCompareDemandPlan = async () => {
    setCompareLoading(true);
    try {
      const res = await fetchWithAuth('/api/compare', { method: 'POST' });
      if (res.ok) {
        toast.success('AI Alignment comparison updated!');
        await loadIntelligenceData();
      } else {
        toast.error('Failed to analyze alignment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  // Drag and Drop LDP file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setLdpFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLdpText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLdpFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLdpText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Save official LDP Plan
  const handleUploadLDP = async () => {
    if (!ldpText) {
      toast.error('Please paste plan text or select a plan document.');
      return;
    }
    setUploadLoading(true);
    try {
      const res = await fetchWithAuth('/api/ldp/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ldpText, filename: ldpFilename })
      });
      if (res.ok) {
        toast.success('Local Development Plan parsed and saved!');
        setLdpText('');
        setLdpFilename('');
        await loadIntelligenceData();
      } else {
        toast.error('Failed to parse LDP text.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error uploading LDP.');
    } finally {
      setUploadLoading(false);
    }
  };

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
          contextIssues: issues
        })
      });

      const data = await response.json();
      setChatHistory([...nextHistory, { role: 'model', text: data.reply || "AI Service is currently unresponsive." }]);
    } catch (err) {
      console.error("Grounded chat error:", err);
      setChatHistory([...nextHistory, { role: 'model', text: "Unable to reach the civic intelligence gateway. Please verify network access." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Narrative Report compiler handler
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setNarrativeReport(null);

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

  // Circular health score colors
  const getHealthColorClass = (score: number) => {
    if (score >= 80) return { color: 'var(--success)', label: 'OPTIMAL' };
    if (score >= 50) return { color: 'var(--warning)', label: 'ELEVATED' };
    return { color: 'var(--danger)', label: 'CRITICAL' };
  };

  const healthMeta = getHealthColorClass(healthScore);
  const strokeRadius = 40;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (healthScore / 100) * strokeCircumference;

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '6px' }}>Development Intelligence Suite</h1>
        <p style={{ color: 'var(--text-2)' }}>
          Consolidated operations monitoring, spatial gaps alignment, and grounded narrative analytics supporting MP capital allocation decisions.
        </p>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px', gap: '8px', overflowX: 'auto', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'analytics' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          📊 Operations Analytics
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'intelligence' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'intelligence' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          ✨ AI Development Gaps
        </button>
        <button
          onClick={() => setActiveTab('insights-chat')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'insights-chat' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'insights-chat' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          💬 Grounded Analyst & Reports
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: OPERATIONS ANALYTICS VIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Top summary row */}
          <div className="grid-dashboard-top" style={{ gap: '24px' }}>
            {/* Health Score Gauge */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r={strokeRadius} fill="transparent" stroke="var(--border)" strokeWidth="6" />
                  <circle 
                    cx="50" cy="50" r={strokeRadius} 
                    fill="transparent" 
                    stroke={healthMeta.color} 
                    strokeWidth="6" 
                    strokeDasharray={strokeCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', lineHeight: '1' }}>{healthScore}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600 }}>SCORE</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ward Health Index</span>
                <span style={{ fontSize: '18px', fontWeight: 600, color: healthMeta.color }}>{healthMeta.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Computed from {stats.open} unresolved of {stats.total} logged signals.</span>
              </div>
            </div>

            {/* Autonomous briefing summary */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Operations Executive Briefing</h3>
              </div>
              <p className="text-sm" style={{ margin: 0, color: 'var(--text-1)', lineHeight: '1.5' }}>
                {areaSummary}
              </p>
              <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>⚡ Autonomous Summary Agent briefing. Synchronized in real time.</span>
            </div>
          </div>

          {/* Double column hotspots and resolutions */}
          <div className="grid-dashboard-main" style={{ gap: '24px', alignItems: 'start' }}>
            {/* Column 1: Category hotspots */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Category Hotspots</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Relative share of logged infrastructure signals</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                {Object.entries(categoryCounts).map(([cat, count]) => {
                  const maxCount = Math.max(...(Object.values(categoryCounts) as number[]), 1);
                  const percentage = ((count as number) / maxCount) * 100;
                  return (
                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-1)', fontWeight: 500 }}>{cat}</span>
                        <span style={{ color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{count} signals</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: spatial priority hotspots */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Development Hotspots</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Top AI-clustered community demand priorities</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {clusters.length > 0 ? (
                  [...clusters].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)).slice(0, 5).map((cluster, idx) => (
                    <div key={cluster.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', width: '16px' }}>#{idx + 1}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cluster.theme}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>📂 {cluster.category?.toUpperCase()} • {cluster.count || 1} ideas</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{cluster.priorityScore || 0} score</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', padding: '24px 0', textAlign: 'center' }}>
                    No hotspots compiled yet. Trigger analysis in the AI Gaps tab.
                  </span>
                )}
              </div>
            </div>

            {/* Column 3: Recent Resolutions */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Recent Resolutions</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Verified public infrastructure repairs</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {resolutions.length > 0 ? (
                  resolutions.slice(0, 4).map((res) => (
                    <div 
                      key={res.id} 
                      onClick={() => navigate(`/issue/${res.id}`)}
                      style={{ padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '6px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                      className="hover-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>✓ RESOLVED</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                          {res.resolvedAt?.seconds ? new Date(res.resolvedAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {res.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', padding: '24px 0', textAlign: 'center' }}>
                    No resolution logged in this cycle yet.
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: AI DEVELOPMENT GAPS VIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'intelligence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Clustering controls */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>AI Theme Clustering Engine</h2>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>
                  Groups public suggestions semantically into actionable localized capital expenditure development clusters.
                </p>
              </div>
              
              <button
                onClick={handleRebuildClusters}
                disabled={clusteringLoading}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                {clusteringLoading ? 'Processing clusters...' : '🔄 Re-run AI Clustering'}
              </button>
            </div>

            {/* Clusters List */}
            <div>
              {clusters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', background: 'var(--surface-2)', borderRadius: '8px' }}>
                  No development clusters computed yet. Click "Re-run AI Clustering" to process.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {clusters.map((cl) => {
                    const isExpanded = expandedClusterId === cl.id;
                    return (
                      <div 
                        key={cl.id} 
                        className="hover-card"
                        style={{
                          padding: '16px',
                          background: 'var(--surface-1)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div>
                            <span style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--surface-2)', color: 'var(--text-2)', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--border)', textTransform: 'uppercase' }}>
                              {cl.category || 'General'}
                            </span>
                            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '6px 0 2px 0', color: 'var(--text-1)' }}>
                              {cl.theme}
                            </h3>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)' }}>{cl.priorityScore || 0}</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-3)', fontWeight: 600 }}>PRIORITY</div>
                          </div>
                        </div>

                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.4' }}>
                          {cl.aiSummary || 'Consolidated public development proposal.'}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>📋 {cl.count || 1} Citizen signals grouped</span>
                          <button
                            onClick={() => setExpandedClusterId(isExpanded ? null : cl.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {isExpanded ? 'Hide Derivation ▲' : 'Explain Score ▼'}
                          </button>
                        </div>

                        {isExpanded && cl.scoreDetails && (
                          <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '11px', borderLeft: '3px solid var(--primary)' }}>
                            <strong>Derivation:</strong> {cl.scoreDetails.reasoning || 'Calculated programmatically based on localized vulnerability factors.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LDP plan compiler and gap analyzer */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>Local Development Plan (LDP) Compiler</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>
                Cross-reference spatial citizen clusters against approved ward plans to spot budget gaps and misalignment.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('ldp-file-picker')?.click()}
                style={{
                  border: '2px dashed ' + (dragActive ? 'var(--primary)' : 'var(--border)'),
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--surface-2)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <input id="ldp-file-picker" type="file" onChange={handleFileSelect} style={{ display: 'none' }} />
                <span style={{ fontSize: '24px' }}>📂</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Drag LDP vision sheets here or click to browse</span>
                {ldpFilename && <span style={{ fontSize: '11px', background: 'var(--surface)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>📄 {ldpFilename}</span>}
              </div>

              {/* Text Area copy paste */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  placeholder="Paste formal capital expenditure plans or ward guidelines..."
                  value={ldpText}
                  onChange={(e) => setLdpText(e.target.value)}
                  style={{ width: '100%', height: '80px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', resize: 'none' }}
                />
                <button
                  onClick={handleUploadLDP}
                  disabled={uploadLoading || (!ldpText && !ldpFilename)}
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-end', fontSize: '12px' }}
                >
                  {uploadLoading ? 'Compiling plan...' : 'Analyze & Save LDP Plan'}
                </button>
              </div>
            </div>

            {/* Gap Alignment Trigger */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Demand vs. Plan Alignment Analyzer</h3>
                <span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>Run automated Gemini evaluation to cross-reference budget with public upvotes.</span>
              </div>
              <button
                onClick={handleCompareDemandPlan}
                disabled={compareLoading}
                className="btn btn-primary"
                style={{ fontSize: '12px' }}
              >
                {compareLoading ? 'Running Alignment...' : '🔍 Trigger AI Alignment Analysis'}
              </button>
            </div>

            {/* Recommendations Output */}
            {recommendations.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Strategic Action Recommendations</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recommendations.map((rec: any, idx: number) => {
                    if (rec.id === 'executive_summary') {
                      return (
                        <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>📈 ALIGNMENT REPORT INDEX</strong>
                          <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5' }}>{rec.analysisText}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={idx} style={{ padding: '14px', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <strong style={{ fontSize: '13px' }}>💡 {rec.suggestionTheme || rec.theme}</strong>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-2)' }}>Gap Level: {rec.gapLevel || 'High'}</span>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-2)' }}>{rec.recommendationText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: GROUNDED CHAT & EXECUTIVE COMPILER VIEW
          ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'insights-chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Grounded QA Assistant chat panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '560px', padding: 0 }}>
            {/* Panel header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Grounded Ward Analyst</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Direct context Q&A grounded in Firestore dataset (no hallucinations)</span>
              </div>
            </div>

            {/* Chat conversation area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                Welcome, Analyst. I have full context of active ward reports, LDP templates, and community demand upvotes. Ask me anything.
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
                  <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%' }} />
                  <div className="shimmer" style={{ width: '6px', height: '6px', borderRadius: '50%' }} />
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat form entry */}
            <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input text-sm"
                placeholder="Ask e.g., Which category has the highest urgency score?..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 16px' }} disabled={chatLoading}>
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Narrative Report Compiler */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Executive Narrative Compiler</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Generate formal text writeups for official government submissions</span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Category Scope Filter</label>
                <select 
                  className="form-input" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ background: 'var(--surface-2)' }}
                >
                  <option value="all">All Combined Categories</option>
                  <option value="pothole">Potholes & Sidewalks</option>
                  <option value="streetlight">Streetlight & Safety</option>
                  <option value="water">Water Drainage</option>
                  <option value="waste">Waste Management</option>
                </select>
              </div>

              <button 
                onClick={handleGenerateReport} 
                disabled={generatingReport} 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                {generatingReport ? 'Compiling Official Report...' : 'Compile Executive Brief'}
              </button>
            </div>

            {/* Compiled Text Report panel */}
            {narrativeReport && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>COMPILED NARRATIVE WRITEUP</span>
                  <button onClick={handleDownloadReport} className="btn btn-secondary text-xs" style={{ padding: '4px 10px' }}>
                    <Download size={13} /> Export .txt
                  </button>
                </div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '14px', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                  {narrativeReport}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
