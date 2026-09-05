import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Cpu, Coins, TrendingUp, Briefcase, ShieldCheck, 
  Layers, MessageSquare, Send, FileText, Printer, Search, 
  Bot, Play, Check, RotateCcw, Sliders, Download, Volume2, 
  Smartphone, Bell, FileCheck, Eye, HelpCircle, Activity, 
  Wifi, CheckCircle, Clock, ArrowRight, Sun, Moon, Maximize2, AlertTriangle, RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MPDecisionCockpitProps {
  clusters: any[];
  recommendations: any[];
  suggestions: any[];
  ldpProjects: any[];
  onDataRefresh?: () => void;
}

export default function MPDecisionCockpit({
  clusters,
  recommendations,
  suggestions,
  ldpProjects,
  onDataRefresh
}: MPDecisionCockpitProps) {
  const navigate = useNavigate();
  
  // Tab within the MP Cockpit
  const [activeSubTab, setActiveSubTab] = useState<'copilot' | 'executive' | 'budget' | 'simulator' | 'ingest' | 'alerts'>('copilot');

  // Guided Demo Mode State
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [demoActive, setDemoActive] = useState(false);

  // MP Copilot Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Welcome, Honorable MP. I am your Decision Copilot. Ask me anything about Ranchi Parliamentary Constituency's active theme clusters, priority hotspots, recommended alignments, or local development plans." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Executive Brief States
  const [execBrief, setExecBrief] = useState<string>('');
  const [briefLoading, setBriefLoading] = useState(false);

  // Proposal States
  const [selectedRecForProposal, setSelectedRecForProposal] = useState<any | null>(null);
  const [proposalDoc, setProposalDoc] = useState<any | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);

  // Scheme Matcher State
  const [matchedSchemes, setMatchedSchemes] = useState<Record<string, any>>({});
  const [schemesLoading, setSchemesLoading] = useState<Record<string, boolean>>({});

  // Budget Planner States
  const [budgetLimit, setBudgetLimit] = useState<number>(5.0); // 5 Crores default
  const [budgetPlan, setBudgetPlan] = useState<any | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Impact Simulator States
  const [selectedRecForSim, setSelectedRecForSim] = useState<any | null>(null);
  const [simCompletion, setSimCompletion] = useState<number>(100);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // WhatsApp/SMS Ingestion States
  const [ingestChannel, setIngestChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [ingestText, setIngestText] = useState('');
  const [ingestLocation, setIngestLocation] = useState('Koramangala 4th Block');
  const [ingestHasMedia, setIngestHasMedia] = useState(false);
  const [ingestedResult, setIngestedResult] = useState<any | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);

  // Live Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<'all' | 'Citizen' | 'Ward Officer' | 'MP Office'>('all');

  // Accessibility States (High Contrast, Large Text)
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Offline Caching states
  const [isOffline, setIsOffline] = useState(false);

  // Effect to scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Load notifications from server
  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/mp/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // On mount, load notifications & budget plan
  useEffect(() => {
    loadNotifications();
    runBudgetOptimization();

    // Setup network status listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Network offline. Switched to offline-cached data mode.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Run initial budget plan once recommendations load
  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      runBudgetOptimization();
    }
  }, [recommendations, budgetLimit]);

  // Auto-run simulation when recommendation or slider changes
  useEffect(() => {
    if (selectedRecForSim) {
      runSimulation();
    }
  }, [selectedRecForSim, simCompletion]);

  // Handle Copilot Questions
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    if (!customText) setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setChatLoading(true);

    try {
      const chatHistory = chatMessages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/mp/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history: chatHistory })
      });

      if (!res.ok) throw new Error("Server communication error.");
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err: any) {
      toast.error("Copilot failed: " + err.message);
      setChatMessages(prev => [...prev, { role: 'assistant', text: "I apologize, but I am facing temporary service constraints. Let's retry in a moment!" }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Generate Executive Brief
  const generateExecutiveBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch('/api/mp/executive-brief', { method: 'POST' });
      if (!res.ok) throw new Error("Brief generation failed.");
      const data = await res.json();
      setExecBrief(data.brief);
      toast.success("Executive Brief generated successfully!");
    } catch (err: any) {
      toast.error("Failed to generate brief: " + err.message);
    } finally {
      setBriefLoading(false);
    }
  };

  // Generate Proposal Document
  const generateProposalDoc = async (rec: any) => {
    setSelectedRecForProposal(rec);
    setProposalLoading(true);
    try {
      const res = await fetch('/api/mp/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation: rec })
      });
      if (!res.ok) throw new Error("Proposal generation failed.");
      const data = await res.json();
      setProposalDoc(data);
      toast.success("Project Proposal document compiled!");
    } catch (err: any) {
      toast.error("Failed to generate proposal: " + err.message);
    } finally {
      setProposalLoading(false);
    }
  };

  // Match Government Schemes
  const matchSchemesForRec = async (rec: any) => {
    setSchemesLoading(prev => ({ ...prev, [rec.id]: true }));
    try {
      const res = await fetch('/api/mp/scheme-matcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendation: rec })
      });
      if (!res.ok) throw new Error("Scheme matching failed.");
      const data = await res.json();
      setMatchedSchemes(prev => ({ ...prev, [rec.id]: data.schemes }));
      toast.success("Aligned Government Schemes found!");
    } catch (err: any) {
      toast.error("Failed to match schemes: " + err.message);
    } finally {
      setSchemesLoading(prev => ({ ...prev, [rec.id]: false }));
    }
  };

  // Optimize Budget Planning Combination
  const runBudgetOptimization = async () => {
    setBudgetLoading(true);
    try {
      const res = await fetch('/api/mp/budget-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetCrores: budgetLimit })
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetPlan(data);
      }
    } catch (err) {
      console.error("Budget optimization failed:", err);
    } finally {
      setBudgetLoading(false);
    }
  };

  // Run Impact Simulation
  const runSimulation = async () => {
    if (!selectedRecForSim) return;
    setSimLoading(true);
    try {
      const res = await fetch('/api/mp/impact-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: selectedRecForSim.recommendedProject,
          category: selectedRecForSim.category,
          priorityScore: selectedRecForSim.priorityScore,
          count: selectedRecForSim.relatedIds?.length || 5,
          completion: simCompletion
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Scale simulated outcome based on the selected completion %
        const scale = simCompletion / 100;
        setSimulationResult({
          ...data,
          populationBenefited: Math.floor(data.populationBenefited * scale),
          travelReduction: travelReductionScale(data.travelReduction, scale),
          infraImprovement: `${Math.floor(parseInt(data.infraImprovement) * scale)}%`,
          citizenSatisfaction: `${Math.floor(parseInt(data.citizenSatisfaction) * (0.6 + 0.4 * scale))}%`,
        });
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimLoading(false);
    }
  };

  const travelReductionScale = (val: string, scale: number) => {
    if (val === "N/A") return "N/A";
    const num = parseInt(val);
    if (isNaN(num)) return val;
    return `${Math.floor(num * scale)} mins`;
  };

  // Run WhatsApp / SMS Submission
  const runIngestion = async () => {
    if (!ingestText.trim()) {
      toast.error("Please enter report/suggestion details.");
      return;
    }
    setIngestLoading(true);
    try {
      const res = await fetch('/api/mp/whatsapp-sms-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: ingestChannel,
          text: ingestText,
          location: { ward: ingestLocation, lat: 12.9348, lng: 77.6290 },
          hasMedia: ingestHasMedia
        })
      });

      if (!res.ok) throw new Error("Ingestion pipeline error.");
      const data = await res.json();
      setIngestedResult(data);
      toast.success("Received! Ingestion pipeline executed.");
      setIngestText('');
      setIngestHasMedia(false);
      
      // Update local states
      loadNotifications();
      if (onDataRefresh) onDataRefresh();

    } catch (err: any) {
      toast.error("Ingestion failed: " + err.message);
    } finally {
      setIngestLoading(false);
    }
  };

  // Printable HTML brief export
  const handlePrintBrief = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>CivicPulse - Executive Constituency Briefing</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1f2937; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 24px; }
            h2 { font-size: 16px; margin-top: 30px; color: #1e3a8a; font-weight: 700; text-transform: uppercase; }
            p { font-size: 14px; margin-bottom: 16px; }
            .meta { font-size: 11px; color: #6b7280; font-family: monospace; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>CIVICPULSE DECISION PLATFORM - EXECUTIVE BRIEF</h1>
          <div class="meta">
            CONSTITUENCY: BANGALORE CENTRAL<br/>
            DATE GENERATED: ${new Date().toLocaleDateString()}<br/>
            ISSUED TO: OFFICE OF THE MEMBER OF PARLIAMENT
          </div>
          <div style="white-space: pre-wrap;">${execBrief}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Printable Proposal
  const handlePrintProposal = () => {
    if (!proposalDoc) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Project Proposal: ${proposalDoc.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111827; line-height: 1.6; }
            .header { border-bottom: 3px double #1f2937; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            h1 { font-size: 22px; text-transform: uppercase; margin: 0 0 5px 0; letter-spacing: 0.05em; }
            .subtitle { font-size: 12px; color: #4b5563; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; }
            .meta-box { background: #f3f4f6; padding: 15px; border-radius: 6px; font-size: 12px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            h2 { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #9ca3af; padding-bottom: 4px; margin-top: 25px; color: #1f2937; }
            p { font-size: 13.5px; margin: 8px 0 16px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Standard Infrastructure Proposal</h1>
            <div class="subtitle">Bangalore Central Constituency Development Fund (LAD)</div>
          </div>
          
          <div class="meta-box">
            <div><strong>PROJECT TITLE:</strong> ${proposalDoc.title}</div>
            <div><strong>DEVELOPMENT CATEGORY:</strong> ${selectedRecForProposal?.category}</div>
            <div><strong>PRIORITY ENGINE SCORE:</strong> ${proposalDoc.priorityScore}/100</div>
            <div><strong>ESTIMATED WARD BENEFICIARIES:</strong> ${proposalDoc.beneficiaries}</div>
          </div>

          <h2>1. Executive Summary</h2>
          <p>${proposalDoc.executiveSummary}</p>

          <h2>2. Problem Statement & Ground Evidence</h2>
          <p>${proposalDoc.problemStatement}</p>
          <p><strong>Clustered Public Distress Signals:</strong> ${proposalDoc.evidence}</p>

          <h2>3. Geographic & Demographic Profile</h2>
          <p><strong>Ward Demographics:</strong> ${proposalDoc.demographicData}</p>
          <p><strong>Infrastructure Gap Identification:</strong> ${proposalDoc.infrastructureGap}</p>

          <h2>4. Projected Outcome & Simulated Impact</h2>
          <p>${proposalDoc.estimatedImpact}</p>

          <h2>5. Implementation & Phased Milestone Timeline</h2>
          <p>${proposalDoc.implementationTimeline}</p>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Guided demo loop for judges
  const startGuidedDemo = () => {
    setDemoActive(true);
    setDemoStep(1);
    setActiveSubTab('ingest');
    setIngestChannel('whatsapp');
    setIngestText("Severe water leak on Koramangala 80ft Road. Wastewater is flooding the sidewalks and creating a major sanitation issue near the bus stand.");
    toast.success("Guided Demo Activated! Follow the highlighted steps.", { duration: 5000 });
  };

  const nextDemoStep = async () => {
    if (demoStep === 1) {
      // Ingest the WhatsApp complaint
      await runIngestion();
      setDemoStep(2);
      setActiveSubTab('alerts');
      toast.success("Step 1 Complete: WhatsApp complaint received and AI triaged!");
    } else if (demoStep === 2) {
      // Inspect alerts and notification triggers
      setDemoStep(3);
      setActiveSubTab('copilot');
      toast.success("Step 2 Complete: Multi-stakeholder notifications triggered automatically!");
      // Simulate Copilot Question
      setChatInput("What is the priority score of the Koramangala water leak?");
    } else if (demoStep === 3) {
      await handleSendMessage("What is the priority score of the water leak reported on Koramangala Road?");
      setDemoStep(4);
      setActiveSubTab('budget');
      toast.success("Step 3 Complete: MP AI Copilot answered grounded in live data!");
    } else if (demoStep === 4) {
      setDemoStep(5);
      setActiveSubTab('simulator');
      // Set some simulation rec
      if (recommendations.length > 0) {
        setSelectedRecForSim(recommendations[0]);
      }
      toast.success("Step 4 Complete: Treasury Budget Planner optimized project packages!");
    } else if (demoStep === 5) {
      setDemoStep(6);
      setActiveSubTab('executive');
      await generateExecutiveBrief();
      toast.success("Step 5 Complete: Project simulation complete!");
    } else if (demoStep === 6) {
      setDemoActive(false);
      setDemoStep(null);
      toast.success("Guided Demo Complete! You've seen the complete Citizen → AI → MP Decision loop in 2 minutes!", { duration: 6000 });
    }
  };

  const endGuidedDemo = () => {
    setDemoActive(false);
    setDemoStep(null);
    toast.dismiss();
    toast.success("Guided Demo cleared.");
  };

  return (
    <div 
      id="mp-decision-cockpit"
      className={`mp-cockpit-container ${highContrast ? 'theme-high-contrast' : ''} ${largeText ? 'theme-large-text' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        color: highContrast ? '#ffffff' : 'var(--text-1)',
        fontFamily: 'var(--font-sans)',
        fontSize: largeText ? '16px' : '14px'
      }}
    >
      
      {/* Top Banner & Control Board */}
      <div className="card" style={{ 
        borderColor: 'var(--border)', 
        background: highContrast ? '#000000' : 'var(--surface-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ padding: '4px 8px', fontSize: '11px', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>🏛️ MP OFFICE DECISION PLATFORM</span>
              {isOffline && (
                <span className="badge" style={{ background: '#F59E0B', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wifi size={10} /> OFFLINE MODE ACTIVE (CACHED)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '8px 0 4px 0', color: highContrast ? '#ffffff' : 'var(--text-1)' }}>
              Member of Parliament AI Decision Suite
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: highContrast ? '#ffffff' : 'var(--text-3)' }}>
              Fully aligned with RMC Municipal Corporation, Urban Development budget planning, and semantic citizen demand insights.
            </p>
          </div>

          {/* Quick Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setHighContrast(!highContrast)}
              style={{ padding: '8px 12px', fontSize: '12px', gap: '6px' }}
              aria-label="Toggle High Contrast Mode"
            >
              {highContrast ? <Sun size={14} /> : <Moon size={14} />}
              Contrast
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setLargeText(!largeText)}
              style={{ padding: '8px 12px', fontSize: '12px', gap: '6px' }}
              aria-label="Toggle Large Font Mode"
            >
              <Maximize2 size={14} />
              {largeText ? "Regular Text" : "Large Text"}
            </button>
            <button 
              className="btn" 
              onClick={startGuidedDemo}
              disabled={demoActive}
              style={{ 
                padding: '8px 16px', 
                fontSize: '12px', 
                background: 'var(--primary)',
                color: 'var(--bg)',
                border: 'none',
                opacity: demoActive ? 0.6 : 1,
                cursor: demoActive ? 'not-allowed' : 'pointer'
              }}
            >
              <Play size={14} />
              Launch Guided Judge Demo
            </button>
          </div>
        </div>

        {/* Guided Demo HUD */}
        {demoActive && (
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '2px solid #10B981', 
            borderRadius: '8px', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#10B981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} className="animate-pulse" /> GUIDED DEMO MODE ACTIVE
              </span>
              <button onClick={endGuidedDemo} className="text-muted" style={{ fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Quit Demo
              </button>
            </div>
            
            {/* Steps tracker */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', fontSize: '11px', textAlign: 'center' }}>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 1 ? '#10B981' : 'var(--surface-2)', color: demoStep === 1 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 1 ? 'bold' : 'normal' }}>1. Submission</div>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 2 ? '#10B981' : 'var(--surface-2)', color: demoStep === 2 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 2 ? 'bold' : 'normal' }}>2. Alerting</div>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 3 ? '#10B981' : 'var(--surface-2)', color: demoStep === 3 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 3 ? 'bold' : 'normal' }}>3. Copilot</div>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 4 ? '#10B981' : 'var(--surface-2)', color: demoStep === 4 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 4 ? 'bold' : 'normal' }}>4. Budget</div>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 5 ? '#10B981' : 'var(--surface-2)', color: demoStep === 5 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 5 ? 'bold' : 'normal' }}>5. Simulator</div>
              <div style={{ padding: '6px', borderRadius: '4px', background: demoStep === 6 ? '#10B981' : 'var(--surface-2)', color: demoStep === 6 ? '#000000' : 'var(--text-3)', fontWeight: demoStep === 6 ? 'bold' : 'normal' }}>6. Exec Brief</div>
            </div>

            {/* Instruction for current step */}
            <div style={{ fontSize: '13px', background: 'var(--surface-1)', padding: '12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Step {demoStep} Instruction:</strong> {
                  demoStep === 1 ? "Click the green button below to ingest the simulated WhatsApp voice and text water hazard report." :
                  demoStep === 2 ? "Verify how multi-stakeholder alert scopes are triggered simultaneously for Citizen, Ward Officer, and MP Office." :
                  demoStep === 3 ? "Ask the AI Copilot a grounded question about the live reported database." :
                  demoStep === 4 ? "Observe how the treasury algorithm combines the best projects given budgetary constraints." :
                  demoStep === 5 ? "Run the project What-If simulation to calculate the population benefited and satisfaction levels." :
                  "Click to compile and download your 1-click comprehensive executive brief report."
                }
              </div>
              <button 
                onClick={nextDemoStep}
                className="btn" 
                style={{ background: '#10B981', color: '#000000', fontSize: '12px', padding: '6px 14px', fontWeight: 'bold' }}
              >
                Proceed Step <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Primary Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => setActiveSubTab('copilot')}
          className={`tab-btn ${activeSubTab === 'copilot' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'copilot' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'copilot' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Bot size={14} />
          MP AI Copilot
        </button>

        <button 
          onClick={() => setActiveSubTab('executive')}
          className={`tab-btn ${activeSubTab === 'executive' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'executive' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'executive' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileText size={14} />
          Executive Briefing
        </button>

        <button 
          onClick={() => setActiveSubTab('budget')}
          className={`tab-btn ${activeSubTab === 'budget' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'budget' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'budget' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Coins size={14} />
          Treasury Budget Planner
        </button>

        <button 
          onClick={() => setActiveSubTab('simulator')}
          className={`tab-btn ${activeSubTab === 'simulator' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'simulator' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'simulator' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sliders size={14} />
          What-If Impact Simulator
        </button>

        <button 
          onClick={() => setActiveSubTab('ingest')}
          className={`tab-btn ${activeSubTab === 'ingest' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'ingest' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'ingest' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Smartphone size={14} />
          WhatsApp/SMS Triage
        </button>

        <button 
          onClick={() => setActiveSubTab('alerts')}
          className={`tab-btn ${activeSubTab === 'alerts' ? 'active' : ''}`}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'alerts' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeSubTab === 'alerts' ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Bell size={14} />
          Live Alerts Console ({notifications.length})
        </button>
      </div>

      {/* Sub-Tab Contents */}

      {/* A. COPILOT */}
      {activeSubTab === 'copilot' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', flexWrap: 'wrap' }} className="grid-responsive">
          
          {/* Main Chat box */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '550px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} style={{ color: 'var(--text-1)' }} />
                <span style={{ fontWeight: 600 }}>Interactive AI Assistant</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>MODEL: GEMINI 3.5 FLASH</span>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-3)', 
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {msg.role === 'user' ? "MP Staff" : "AI Copilot"}
                  </div>
                  <div 
                    style={{
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                      color: msg.role === 'user' ? '#ffffff' : 'var(--text-1)',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-3)' }}>
                  <RefreshCw size={14} className="animate-spin" /> Grounding answers from live databases...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestions / Actions */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', overflowX: 'auto', background: 'var(--surface-2)' }}>
              <button 
                onClick={() => handleSendMessage("What are the top development priorities for Koramangala 4th Block based on citizen upvotes?")}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                🔍 Koramangala Priorities
              </button>
              <button 
                onClick={() => handleSendMessage("Are there any citizen demands currently matching the Indiranagar 100ft road asphalt LDP project?")}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                📈 Indiranagar Plan Match
              </button>
              <button 
                onClick={() => handleSendMessage("Suggest government funding schemes for a sanitary composting kiosk.")}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                🏛️ Composting Schemes
              </button>
            </div>

            {/* Input Bar */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your query (e.g. 'Summarize road priorities in HSR')"
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => handleSendMessage()}
                className="btn btn-primary"
                style={{ padding: '12px 20px', gap: '8px' }}
              >
                <Send size={14} /> Send
              </button>
            </div>
          </div>

          {/* Sidebar list of Theme clusters & Priorities */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} style={{ color: 'var(--text-1)' }} /> Active Ward Themes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {clusters.map((c) => (
                  <div key={c.id} style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-1)' }} className="truncate">{c.theme}</span>
                      <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{c.priorityScore}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-3)' }}>
                      <span>Category: {c.category}</span>
                      <span>{c.count || c.density} signals</span>
                    </div>
                  </div>
                ))}
                {clusters.length === 0 && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '12px' }}>No active clusters found.</p>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.02)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6' }}>
                <ShieldCheck size={14} /> Decision Integrity Lock
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.4' }}>
                Answers are strict projections of live suggestions and Local Development Plans. Hallucinations are actively supressed via strict Gemini system prompt boundaries.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* B. EXECUTIVE BRIEF */}
      {activeSubTab === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0' }}>One-Click Constituency Summary Report</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
                Generates a professional 5-minute briefing summarizing top priorities, gaps, schemes, and recent changes.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={generateExecutiveBrief}
                disabled={briefLoading}
                className="btn btn-primary"
                style={{ padding: '10px 20px', gap: '8px', background: 'var(--primary)', color: 'var(--bg)' }}
              >
                <Sparkles size={16} /> 
                {briefLoading ? "Analyzing Ward Databases..." : "Compile Executive Brief"}
              </button>

              {execBrief && (
                <button 
                  onClick={handlePrintBrief}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', gap: '8px' }}
                >
                  <Printer size={16} /> Print Brief
                </button>
              )}
            </div>
          </div>

          {execBrief ? (
            <div className="card" style={{ padding: '32px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '0.05em', color: 'var(--text-1)' }}>OFFICE OF THE MEMBER OF PARLIAMENT</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'monospace' }}>CONSTITUENCY: BANGALORE CENTRAL BRIEFING LEDGER</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-3)' }}>
                  <div><strong>DATE:</strong> {new Date().toLocaleDateString()}</div>
                  <div><strong>DOC ID:</strong> CP-EXB-${Math.floor(Math.random() * 9000 + 1000)}</div>
                </div>
              </div>

              <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-1)', whiteSpace: 'pre-wrap', fontFamily: 'serif', padding: '0 8px' }}>
                {execBrief}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <FileText size={48} style={{ color: 'var(--text-3)', opacity: 0.3 }} />
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>No Executive Brief Compiled Yet</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>Click the button above to assemble live database clusters, LDPs, and upvote statistics into a structured PDF/Printable document.</p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* C. BUDGET PLANNER */}
      {activeSubTab === 'budget' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="grid-responsive">
          
          {/* Main budgeting tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Limit selector */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={18} style={{ color: '#F59E0B' }} /> Target Constituency Fund Allocation (LAD)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Adjust Available Budget Limit:</span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B' }}>₹ {budgetLimit.toFixed(1)} Crores</span>
                </div>
                
                <input 
                  type="range" 
                  min="1.0" 
                  max="15.0" 
                  step="0.5"
                  value={budgetLimit} 
                  onChange={(e) => setBudgetLimit(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#F59E0B' }}
                />

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => setBudgetLimit(1.0)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>₹1 Cr</button>
                  <button onClick={() => setBudgetLimit(3.0)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>₹3 Cr</button>
                  <button onClick={() => setBudgetLimit(5.0)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>₹5 Cr</button>
                  <button onClick={() => setBudgetLimit(10.0)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>₹10 Cr</button>
                </div>
              </div>
            </div>

            {/* Optimized Package */}
            {budgetPlan && (
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>AI Optimized Project Package</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Maximizes priority score density per rupee spent while protecting underserved zones.</p>
                </div>

                {/* Metrics grids */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  
                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>BUDGET UTILIZATION</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>₹ {budgetPlan.totalCost?.toFixed(2)} Cr</div>
                    <div style={{ fontSize: '10px', color: '#10B981' }}>{budgetPlan.utilization?.toFixed(0)}% Utilized</div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>TOTAL BENEFICIARIES</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>{budgetPlan.totalBeneficiaries?.toLocaleString()}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Est. population reach</div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>AVG PRIORITY RETAINED</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>{budgetPlan.priorityRetained?.toFixed(1)} / 100</div>
                    <div style={{ fontSize: '10px', color: '#F59E0B' }}>Efficiency ratio</div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>SECTORS ENCOMPASSED</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', wordBreak: 'break-all' }}>{budgetPlan.coverage?.join(", ") || "General"}</div>
                    <div style={{ fontSize: '10px', color: '#3B82F6' }}>Diversity metric</div>
                  </div>

                </div>

                {/* AI Rationale */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid #F59E0B', padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: '13px', lineHeight: '1.5' }}>
                  <strong>Treasury Explanation:</strong> {budgetPlan.rationale}
                </div>

                {/* Selected Projects Table */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 10px 0', color: 'var(--text-2)' }}>Selected Priority Projects ({budgetPlan.selectedProjects?.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {budgetPlan.selectedProjects?.map((p: any, idx: number) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '0' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', background: 'var(--border)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                          <div className="truncate">
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }} className="truncate">{p.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.category} | Priority Score: {p.priorityScore}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#10B981' }}>{p.rawCostString}</span>
                        </div>
                      </div>
                    ))}
                    {budgetPlan.selectedProjects?.length === 0 && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '16px' }}>No projects fit into selected budget limit.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Sidebar standard recommendations list with direct Proposal compiling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Strategic Alignments */}
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} style={{ color: 'var(--text-1)' }} /> Proposals & Schemes
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                {recommendations.map((rec) => (
                  <div key={rec.id} style={{ padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{rec.recommendedProject}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Cost: {rec.estimatedCost || 'N/A'} | Priority: {rec.priorityScore}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => generateProposalDoc(rec)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, gap: '4px' }}
                      >
                        <FileText size={10} /> Compile Doc
                      </button>
                      <button 
                        onClick={() => matchSchemesForRec(rec)}
                        disabled={schemesLoading[rec.id]}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '10px', flex: 1, gap: '4px' }}
                      >
                        <Cpu size={10} /> Match Scheme
                      </button>
                    </div>

                    {/* Matched schemes popup view */}
                    {matchedSchemes[rec.id] && (
                      <div style={{ background: 'var(--surface-1)', padding: '8px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px dashed var(--border)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#F59E0B' }}>🎯 SUITABLE GOVERNMENT SCHEMES:</span>
                        {matchedSchemes[rec.id].map((sch: any, sIdx: number) => (
                          <div key={sIdx} style={{ fontSize: '10.5px', borderBottom: sIdx < matchedSchemes[rec.id].length-1 ? '1px solid var(--border)' : 'none', paddingBottom: '4px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{sch.schemeName} ({sch.suitability})</div>
                            <div style={{ color: 'var(--text-2)', fontSize: '10px', marginTop: '2px' }}>{sch.whyFits}</div>
                            <div style={{ color: 'var(--text-3)', fontSize: '9.5px', marginTop: '2px' }}>Ratio: {sch.fundingRatio}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Proposal Overlay Modal */}
          {proposalDoc && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}>
              <div className="card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface-1)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: 'var(--text-1)' }}>Project Proposal Draft</span>
                  <button onClick={() => setProposalDoc(null)} className="text-muted" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{proposalDoc.title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/lifecycle/proposals', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              recommendationId: selectedRecForProposal?.id,
                              recommendation: selectedRecForProposal
                            })
                          });
                          const data = await res.json();
                          if (res.ok && data.proposal) {
                            toast.success("Lifecycle Proposal created! Redirecting to tracker...");
                            setProposalDoc(null);
                            navigate(`/proposal/${data.proposal.id}`);
                          } else {
                            toast.error(data.error || "Failed to create proposal record.");
                          }
                        } catch (err: any) {
                          toast.error("Network error: " + err.message);
                        }
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}
                    >
                      <ExternalLink size={12} /> Track Lifecycle
                    </button>
                    <button onClick={handlePrintProposal} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '6px' }}>
                      <Printer size={12} /> Print/PDF
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: '1.6' }}>
                  <div><strong>EXECUTIVE SUMMARY:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.executiveSummary}</p></div>
                  <div><strong>PROBLEM STATEMENT:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.problemStatement}</p></div>
                  <div><strong>EVIDENCE BASE:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.evidence}</p></div>
                  <div><strong>BENEFICIARIES:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.beneficiaries}</p></div>
                  <div><strong>DEMOGRAPHIC MATRIX:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.demographicData}</p></div>
                  <div><strong>INFRASTRUCTURE GAP DETAIL:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.infrastructureGap}</p></div>
                  <div><strong>TIMELINE PHASES:</strong> <p style={{ margin: '4px 0 0 0', color: 'var(--text-2)' }}>{proposalDoc.implementationTimeline}</p></div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* D. IMPACT SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="grid-responsive">
          
          {/* Main Simulation Board */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: '#10B981' }} /> "What-If" Project Impact Simulator
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Simulate completion percentages of planned alignments to project outcomes on local wards.</p>
            </div>

            {/* Select Recommended Project */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '8px' }}>1. Select Recommendation to Model:</label>
              <select 
                value={selectedRecForSim ? JSON.stringify(selectedRecForSim) : ''}
                onChange={(e) => setSelectedRecForSim(e.target.value ? JSON.parse(e.target.value) : null)}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '13px'
                }}
              >
                <option value="">-- Choose Aligned Recommendation --</option>
                {recommendations.map(r => (
                  <option key={r.id} value={JSON.stringify(r)}>{r.recommendedProject} (Score: {r.priorityScore})</option>
                ))}
              </select>
            </div>

            {/* Parameter sliders */}
            {selectedRecForSim && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>
                    <span>Target Project Completion Success:</span>
                    <span style={{ color: '#10B981' }}>{simCompletion}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={simCompletion}
                    onChange={(e) => setSimCompletion(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#10B981' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setSimCompletion(25)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>25% (Emergency Minor)</button>
                  <button onClick={() => setSimCompletion(50)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>50% (Phased Half)</button>
                  <button onClick={() => setSimCompletion(100)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>100% (Complete Full)</button>
                </div>
              </div>
            )}

            {/* Simulation Outcomes Output */}
            {selectedRecForSim ? (
              simulationResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Results Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>POPULATION BENEFITED</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>{simulationResult.populationBenefited?.toLocaleString()} residents</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Direct spatial ward impact</span>
                    </div>

                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>COMMUTE TIME REDUCED</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>{simulationResult.travelReduction}</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Arterial intersection savings</span>
                    </div>

                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>INFRASTRUCTURE GRADE LIFT</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>{simulationResult.infraImprovement}</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Local ward ledger health rating</span>
                    </div>

                    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600 }}>CITIZEN APPROVAL RATING</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>{simulationResult.citizenSatisfaction}</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Projected post-repair satisfaction</span>
                    </div>

                  </div>

                  {/* AI Simulation explanation */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10B981', padding: '12px 16px', borderRadius: '0 6px 6px 0', fontSize: '13px', lineHeight: '1.5' }}>
                    <strong>Simulation Projection:</strong> {simulationResult.explanation}
                  </div>

                  {/* Assumptions */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-2)' }}>Simulation Premises & Assumptions:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '11px', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {simulationResult.assumptions?.map((asm: string, idx: number) => (
                        <li key={idx}>{asm}</li>
                      ))}
                    </ul>
                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>
                  <RefreshCw className="animate-spin" style={{ margin: '0 auto 8px auto' }} /> Calculating physical model projections...
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <HelpCircle size={32} style={{ opacity: 0.3 }} />
                <span>Select a recommendation above to initiate modeling.</span>
              </div>
            )}

          </div>

          {/* Sidebar LDP official plans lookup */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} style={{ color: 'var(--text-1)' }} /> LDP Official Projects
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {ldpProjects.map(p => (
                <div key={p.id} style={{ padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)' }} className="truncate">{p.projectTitle}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span>Budget: {p.budget}</span>
                    <span>Location: {p.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* E. WHATSAPP/SMS TRIAGE */}
      {activeSubTab === 'ingest' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }} className="grid-responsive">
          
          {/* Simulation input console */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} style={{ color: 'var(--text-1)' }} /> WhatsApp & SMS Intake Simulator
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Simulate receiving public messages, passing them through the AI voice/text cleaning and classification pipeline.</p>
            </div>

            {/* Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Select Ingest Channel:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => { setIngestChannel('whatsapp'); setIngestText("Severe water leakage Koramangala block 4. Sidewalks flooded."); }}
                    className={`btn ${ingestChannel === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  >
                    WhatsApp (Multimedia/Voice)
                  </button>
                  <button 
                    onClick={() => { setIngestChannel('sms'); setIngestText("Report Problem: Potholes on sector 2 Indiranagar road. Need repair."); }}
                    className={`btn ${ingestChannel === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  >
                    SMS (Plaintext / Simple)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Sender Location / Ward:</label>
                <input 
                  type="text" 
                  value={ingestLocation}
                  onChange={(e) => setIngestLocation(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Message Text (or simulated transcription):</label>
                <textarea 
                  rows={3}
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  placeholder="Paste or type simulated citizen distress signal..."
                  style={{ width: '100%', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-1)', borderRadius: '6px', fontSize: '13px', fontFamily: 'sans-serif' }}
                />
              </div>

              {ingestChannel === 'whatsapp' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="hasMedia" 
                    checked={ingestHasMedia} 
                    onChange={(e) => setIngestHasMedia(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="hasMedia" style={{ fontSize: '12px', cursor: 'pointer', color: 'var(--text-2)' }}>Include Simulated Citizen Image Attachment & Cleaned Voice Audio</label>
                </div>
              )}

              <button 
                onClick={runIngestion}
                disabled={ingestLoading}
                className="btn btn-primary"
                style={{ padding: '12px', background: 'var(--primary)', color: 'var(--bg)', gap: '8px' }}
              >
                {ingestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                Ingest to Platform Pipeline
              </button>

            </div>

            {/* Ingestion results */}
            {ingestedResult && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} /> AI Pipeline Triage Succeeded
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div><strong>Title Assigned:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{ingestedResult.submission?.title}</p></div>
                  <div><strong>AI Category:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{ingestedResult.submission?.category}</p></div>
                  <div><strong>Dept assigned:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{ingestedResult.submission?.department}</p></div>
                  <div><strong>Severity priority:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{ingestedResult.submission?.priority} / 5</p></div>
                  <div><strong>Confidence:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{(ingestedResult.submission?.confidence * 100).toFixed(0)}%</p></div>
                  <div><strong>Language:</strong> <p style={{ margin: '2px 0 0 0', color: 'var(--text-2)' }}>{ingestedResult.submission?.detectedLanguage}</p></div>
                </div>
              </div>
            )}

          </div>

          {/* Quick presets helper */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--text-2)' }}>Simulation Presets:</h3>
            
            <button 
              onClick={() => {
                setIngestChannel('whatsapp');
                setIngestLocation("Koramangala 4th Block");
                setIngestText("Open wastewater drain overflowing outside Sony World. It stinks and poses health risks.");
                setIngestHasMedia(true);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', textAlign: 'left', padding: '10px' }}
            >
              💧 <strong>[WhatsApp] Open wastewater drain</strong><br/>
              Koramangala 4th Block (Voice + Image)
            </button>

            <button 
              onClick={() => {
                setIngestChannel('sms');
                setIngestLocation("Indiranagar 12th Main");
                setIngestText("Development Suggestion: Please build a public composting kiosk to handle restaurant food waste.");
              }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', textAlign: 'left', padding: '10px' }}
            >
              ♻️ <strong>[SMS] Compost Kiosk Proposal</strong><br/>
              Indiranagar (Text)
            </button>

            <button 
              onClick={() => {
                setIngestChannel('whatsapp');
                setIngestLocation("HSR Layout Sector 3");
                setIngestText("Motion-activated LED lights needed on internal sector 3 lanes. Yellow lights broken.");
                setIngestHasMedia(false);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', textAlign: 'left', padding: '10px' }}
            >
              💡 <strong>[WhatsApp] LED streetlighting</strong><br/>
              HSR Layout Sector 3 (Text only)
            </button>
          </div>

        </div>
      )}

      {/* F. LIVE NOTIFICATIONS */}
      {activeSubTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Audit Log & Stakeholder Alerts</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>Filter notifications sent dynamically to Citizen, Ward Officer, and MP Staff scopes.</p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setNotifFilter('all')} className={`btn ${notifFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '11px' }}>All ({notifications.length})</button>
              <button onClick={() => setNotifFilter('Citizen')} className={`btn ${notifFilter === 'Citizen' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '11px' }}>Citizen</button>
              <button onClick={() => setNotifFilter('Ward Officer')} className={`btn ${notifFilter === 'Ward Officer' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '11px' }}>Ward Officers</button>
              <button onClick={() => setNotifFilter('MP Office')} className={`btn ${notifFilter === 'MP Office' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '11px' }}>MP Office</button>
            </div>
          </div>

          {/* Audit trail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications
              .filter(n => notifFilter === 'all' || n.recipient === notifFilter)
              .map((notif) => (
                <div 
                  key={notif.id}
                  style={{
                    padding: '16px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${
                      notif.recipient === 'Citizen' ? '#10B981' : 
                      notif.recipient === 'Ward Officer' ? '#3B82F6' : 'var(--text-1)'
                    }`,
                    borderRadius: '0 6px 6px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-3)' }}>RECIPIENT: {notif.recipient}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)' }}>{notif.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-2)' }}>{notif.message}</p>
                  </div>
                  <div style={{ textTransform: 'uppercase', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <Clock size={10} /> {new Date(notif.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            {notifications.filter(n => notifFilter === 'all' || n.recipient === notifFilter).length === 0 && (
              <p style={{ margin: 0, padding: '32px', textTemplate: 'center', color: 'var(--text-3)', textAlign: 'center' }}>No logged notification logs matching selected criteria.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
