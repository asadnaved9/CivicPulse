import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { 
  PhoneCall, 
  PhoneIncoming, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  ExternalLink, 
  Search, 
  Download, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw, 
  Headphones, 
  Radio, 
  X,
  Droplet,
  Lightbulb,
  Trash2,
  HelpCircle,
  Languages
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface IVRTranscriptItem {
  sender: 'agent' | 'user' | 'caller';
  text: string;
  timestamp: string;
}

export interface IVRCallRecord {
  id: string;
  callId: string;
  callerPhone: string;
  callerName: string;
  startedAt: any;
  createdAt: any;
  durationSeconds: number;
  language: string;
  intent: 'NEW_COMPLAINT' | 'STATUS_CHECK' | 'ESCALATION' | 'GENERAL_QUERY';
  category: string;
  address: string;
  landmark?: string;
  reportId?: string;
  status: 'completed' | 'in_progress' | 'dropped' | 'escalated';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  transcript: IVRTranscriptItem[];
  summary: string;
  recordingUrl?: string;
  audioDuration?: number;
  channel: string;
  sentiment?: 'Neutral' | 'Frustrated' | 'Urgent' | 'Cooperative';
  isReal?: boolean;
}

export default function AdminIVRCallsPage() {
  const navigate = useNavigate();

  // Call Records & Loading State
  const [calls, setCalls] = useState<IVRCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [realCallCount, setRealCallCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showRealOnly, setShowRealOnly] = useState(false);

  // Selected Call Drawer View
  const [selectedCall, setSelectedCall] = useState<IVRCallRecord | null>(null);

  // Audio Playback Engine
  const [activePlayingCallId, setActivePlayingCallId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100
  const [playbackTime, setPlaybackTime] = useState(0); // in seconds
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Engine Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimerRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Fetch calls from Server API
  const fetchCallsFromServer = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/ivr/calls');
      if (res.ok) {
        const data = await res.json();
        if (data.calls && Array.isArray(data.calls)) {
          setCalls(data.calls);
          setIsFallbackData(data.isFallback === true);
          setRealCallCount(data.realCount || (data.isFallback ? 0 : data.calls.length));
        }
      }
    } catch (err) {
      console.warn('Could not fetch IVR calls from backend:', err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Firestore Live Listener + Initial Fetch
  useEffect(() => {
    fetchCallsFromServer();

    if (!isFirebaseConfigured) {
      return;
    }

    try {
      const callsRef = collection(db, 'ivr_calls');
      const unsubscribe = onSnapshot(callsRef, (snapshot) => {
        if (!snapshot.empty) {
          const liveDocs: IVRCallRecord[] = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              callId: d.callId || doc.id,
              callerPhone: d.callerPhone || '+919876543210',
              callerName: d.callerName || 'Citizen Caller',
              startedAt: d.startedAt || new Date(),
              createdAt: d.createdAt || new Date(),
              durationSeconds: d.durationSeconds || 45,
              language: d.language || 'English',
              intent: d.intent || 'NEW_COMPLAINT',
              category: d.category || 'General Civic Issue',
              address: d.address || 'Bengaluru Ward Area',
              landmark: d.landmark || '',
              reportId: d.reportId || '',
              status: d.status || 'completed',
              urgency: d.urgency || 'medium',
              transcript: Array.isArray(d.transcript) ? d.transcript : [],
              summary: d.summary || 'Citizen voice intake record.',
              recordingUrl: d.recordingUrl || undefined,
              audioDuration: d.audioDuration || d.durationSeconds || 45,
              channel: d.channel || 'Citizen Web IVR',
              sentiment: d.sentiment || 'Cooperative',
              isReal: true
            };
          });

          // Sort newest first
          liveDocs.sort((a, b) => {
            const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || a.startedAt || 0).getTime();
            const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || b.startedAt || 0).getTime();
            return tB - tA;
          });

          setCalls(liveDocs);
          setIsFallbackData(false);
          setRealCallCount(liveDocs.length);
          setLoading(false);
        }
      }, (err) => {
        console.warn('Live Firestore IVR listener warning:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription not available:', e);
    }
  }, []);

  // Audio Playback Handler
  const handlePlayAudio = (call: IVRCallRecord) => {
    // If already playing this call, toggle pause/play
    if (activePlayingCallId === call.id) {
      if (isPlaying) {
        pauseAudio();
      } else {
        resumeAudio();
      }
      return;
    }

    // Stop current
    stopAudio();

    setActivePlayingCallId(call.id);
    setIsPlaying(true);
    setPlaybackProgress(0);
    setPlaybackTime(0);

    const totalDuration = call.durationSeconds || 45;

    // Check if real recorded audio URL exists
    if (call.recordingUrl && audioRef.current) {
      audioRef.current.src = call.recordingUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(e => {
        console.warn("HTML5 audio playback error, falling back to simulated speech:", e);
        startSyntheticPlayback(call, totalDuration);
      });
      return;
    }

    // Otherwise, simulate audio playback using synthesized speech of transcript or audio waves
    startSyntheticPlayback(call, totalDuration);
  };

  const startSyntheticPlayback = (call: IVRCallRecord, totalDuration: number) => {
    // Read the transcript lines using speech synthesis if supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && call.transcript.length > 0) {
      window.speechSynthesis.cancel();
      const firstLine = call.transcript[0]?.text || call.summary;
      const utterance = new SpeechSynthesisUtterance(firstLine);
      speechUtteranceRef.current = utterance;
      utterance.rate = playbackSpeed;
      if (call.language.toLowerCase().includes('hindi')) utterance.lang = 'hi-IN';
      else if (call.language.toLowerCase().includes('bengali')) utterance.lang = 'bn-IN';
      else utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }

    // Progress timer
    clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = setInterval(() => {
      setPlaybackTime(prev => {
        const nextTime = prev + 1;
        if (nextTime >= totalDuration) {
          stopAudio();
          return 0;
        }
        setPlaybackProgress((nextTime / totalDuration) * 100);
        return nextTime;
      });
    }, 1000 / playbackSpeed);
  };

  const pauseAudio = () => {
    setIsPlaying(false);
    clearInterval(playbackTimerRef.current);
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  };

  const resumeAudio = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }

    const currentCall = calls.find(c => c.id === activePlayingCallId);
    const totalDuration = currentCall?.durationSeconds || 45;

    clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = setInterval(() => {
      setPlaybackTime(prev => {
        const nextTime = prev + 1;
        if (nextTime >= totalDuration) {
          stopAudio();
          return 0;
        }
        setPlaybackProgress((nextTime / totalDuration) * 100);
        return nextTime;
      });
    }, 1000 / playbackSpeed);
  };

  const stopAudio = () => {
    setIsPlaying(false);
    setActivePlayingCallId(null);
    setPlaybackProgress(0);
    setPlaybackTime(0);
    clearInterval(playbackTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.muted = !isMuted;
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      clearInterval(playbackTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filtered Calls Computation
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      // Real only filter
      if (showRealOnly && !call.isReal) return false;

      // Status filter
      if (statusFilter !== 'all' && call.status !== statusFilter) return false;

      // Language filter
      if (languageFilter !== 'all' && !call.language.toLowerCase().includes(languageFilter.toLowerCase())) return false;

      // Category filter
      if (categoryFilter !== 'all' && !call.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;

      // Search term filter
      if (searchTerm.trim().length > 0) {
        const q = searchTerm.toLowerCase();
        const matchesPhone = call.callerPhone.toLowerCase().includes(q);
        const matchesName = call.callerName.toLowerCase().includes(q);
        const matchesId = (call.callId || call.id).toLowerCase().includes(q);
        const matchesReport = (call.reportId || '').toLowerCase().includes(q);
        const matchesCategory = call.category.toLowerCase().includes(q);
        const matchesAddress = call.address.toLowerCase().includes(q);
        const matchesTranscript = call.transcript.some(t => t.text.toLowerCase().includes(q));

        if (!matchesPhone && !matchesName && !matchesId && !matchesReport && !matchesCategory && !matchesAddress && !matchesTranscript) {
          return false;
        }
      }

      return true;
    });
  }, [calls, searchTerm, statusFilter, languageFilter, categoryFilter, showRealOnly]);

  // High level KPIs
  const totalCallsCount = calls.length;
  const totalAudioMinutes = Math.round(calls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / 60);
  const registeredTicketsCount = calls.filter(c => !!c.reportId).length;
  const escalatedCallsCount = calls.filter(c => c.status === 'escalated' || c.urgency === 'critical').length;
  const resolutionPercentage = totalCallsCount > 0 ? Math.round((registeredTicketsCount / totalCallsCount) * 100) : 0;

  // Active playing call record
  const activeCall = calls.find(c => c.id === activePlayingCallId);

  // Helper to format seconds
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper for relative timestamps
  const getRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) return 'Recently';

    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('pothole') || c.includes('road')) return <AlertTriangle size={15} color="#EF4444" />;
    if (c.includes('light') || c.includes('electrical')) return <Lightbulb size={15} color="#F59E0B" />;
    if (c.includes('water') || c.includes('leak') || c.includes('drain')) return <Droplet size={15} color="#3B82F6" />;
    if (c.includes('waste') || c.includes('garbage')) return <Trash2 size={15} color="#10B981" />;
    return <HelpCircle size={15} color="#64748B" />;
  };

  // Status Badge Colors
  const getStatusBadge = (status: string, urgency: string) => {
    if (status === 'escalated' || urgency === 'critical') {
      return { bg: '#FEF2F2', border: '#FCA5A5', color: '#B91C1C', label: 'CRITICAL ESCALATED' };
    }
    if (status === 'in_progress' || status === 'in-progress') {
      return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', label: 'IN PROGRESS' };
    }
    return { bg: '#ECFDF5', border: '#A7F3D0', color: '#047857', label: 'COMPLETED' };
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const exportCallsAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(calls, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `civicpulse_ivr_calls_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("IVR calls exported successfully!");
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', color: 'var(--text-1)', fontFamily: "'Inter', sans-serif" }}>
      {/* Hidden HTML5 Audio Element for real recordings */}
      <audio ref={audioRef} onEnded={stopAudio} style={{ display: 'none' }} />

      {/* ── Top Header & Actions ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}>
              <PhoneCall size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                  IVR Citizen Voice Intelligence & Audio
                </h1>
                {/* Data Source Mode Indicator */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: isFallbackData ? '#FFFBEB' : '#ECFDF5',
                  color: isFallbackData ? '#B45309' : '#047857',
                  border: isFallbackData ? '1px solid #FDE68A' : '1px solid #A7F3D0'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isFallbackData ? '#F59E0B' : '#10B981',
                    boxShadow: isFallbackData ? 'none' : '0 0 0 3px rgba(16, 185, 129, 0.2)'
                  }} />
                  {isFallbackData 
                    ? 'FALLBACK DEMO DATA (Waiting for Citizen Calls)'
                    : `LIVE CITIZEN DATA (${realCallCount} Active Calls)`
                  }
                </div>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-3)' }}>
                Direct logs of all telephone and web voice calls from 1800-CIVIC-PULSE and Citizen Voice Intake.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/ivr')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
              transition: 'all 0.15s'
            }}
            title="Open Citizen Voice Helpline Simulator in a new window"
          >
            <Radio size={14} />
            <span>Launch Citizen Helpline</span>
          </button>

          <button
            onClick={fetchCallsFromServer}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-2)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Logs'}</span>
          </button>

          <button
            onClick={exportCallsAsJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-2)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Metric 1 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
            <span>Total Voice Calls</span>
            <PhoneIncoming size={16} color="#4F46E5" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-1)' }}>
            {totalCallsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={11} /> {realCallCount} Real Citizen Calls
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
            <span>Audio Time Logged</span>
            <Clock size={16} color="#0EA5E9" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-1)' }}>
            {totalAudioMinutes}m
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            Across all language channels
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
            <span>Report Registration Rate</span>
            <CheckCircle2 size={16} color="#10B981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-1)' }}>
            {resolutionPercentage}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            {registeredTicketsCount} of {totalCallsCount} yielded verified tickets
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
            <span>Distress Escalations</span>
            <ShieldAlert size={16} color="#EF4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#EF4444' }}>
            {escalatedCallsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginTop: '4px' }}>
            Direct Ward Officer dispatches
          </div>
        </div>

        {/* Metric 5 */}
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
            <span>Active Languages</span>
            <Languages size={16} color="#8B5CF6" />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}>English</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#B45309' }}>हिंदी</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#047857' }}>বাংলা</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
            Real-time multi-lingual STT
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls Toolbar ────────────────────────────── */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        padding: '16px 20px',
        border: '1px solid var(--border)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Left: Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search by caller phone, citizen name, complaint ID, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right: Dropdowns & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-2)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="escalated">Critical Escalated</option>
            <option value="in_progress">In Progress</option>
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-2)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Languages</option>
            <option value="hindi">Hindi (हिंदी)</option>
            <option value="english">English</option>
            <option value="bengali">Bengali (বাংলা)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-2)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value="pothole">Roads & Potholes</option>
            <option value="light">Streetlights</option>
            <option value="water">Water & Sanitation</option>
            <option value="waste">Solid Waste</option>
          </select>

          {/* Real Citizen Calls Filter Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-2)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={showRealOnly}
              onChange={(e) => setShowRealOnly(e.target.checked)}
              style={{ accentColor: '#4F46E5', cursor: 'pointer' }}
            />
            <span>Live Calls Only</span>
          </label>
        </div>
      </div>

      {/* ── Active Floating Audio Player Dock (if playing) ──────────────── */}
      {activeCall && (
        <div style={{
          position: 'sticky',
          top: '16px',
          zIndex: 40,
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Track Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
              <Headphones size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>{activeCall.callerName}</span>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{activeCall.callerPhone}</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#F8FAFC' }}>
                  {activeCall.language}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                {activeCall.category} • {activeCall.reportId ? `Ticket: ${activeCall.reportId}` : 'Voice Inquiry'}
              </div>
            </div>
          </div>

          {/* Player Controls & Animated Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 340px', maxWidth: '520px' }}>
            {/* Play/Pause Button */}
            <button
              onClick={() => handlePlayAudio(activeCall)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#38BDF8',
                color: '#0F172A',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(56, 189, 248, 0.4)'
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
            </button>

            {/* Restart */}
            <button
              onClick={() => {
                stopAudio();
                handlePlayAudio(activeCall);
              }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              title="Restart audio"
            >
              <RotateCcw size={15} />
            </button>

            {/* Progress Bar & Waveform */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', fontFamily: 'monospace' }}>
                <span>{formatTime(playbackTime)}</span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '12px' }}>
                  {[8, 14, 20, 12, 18, 24, 16, 10, 18, 12, 22, 14].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '2px',
                        height: isPlaying ? `${h * 0.6}px` : '3px',
                        backgroundColor: isPlaying ? '#38BDF8' : '#475569',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease'
                      }}
                    />
                  ))}
                </div>
                <span>{formatTime(activeCall.durationSeconds || 45)}</span>
              </div>
              <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${playbackProgress}%`, height: '100%', backgroundColor: '#38BDF8', transition: 'width 0.2s linear' }} />
              </div>
            </div>

            {/* Speed Toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1.0, 1.25, 1.5].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: 'none',
                    backgroundColor: playbackSpeed === speed ? '#38BDF8' : 'rgba(255,255,255,0.1)',
                    color: playbackSpeed === speed ? '#0F172A' : '#94A3B8',
                    cursor: 'pointer'
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Close Player */}
          <button
            onClick={stopAudio}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            title="Dismiss player"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Main Call Logs Table ────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={16} color="var(--primary)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
              Recorded Call Sessions ({filteredCalls.length})
            </h3>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            Showing {filteredCalls.length} of {calls.length} logs
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Loading IVR calls from database...</div>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
            <PhoneCall size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-1)' }}>No IVR Calls Match Filter</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search criteria or make a call from the helpline simulator.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
                  <th style={{ padding: '12px 18px' }}>Caller Details</th>
                  <th style={{ padding: '12px 18px' }}>Language</th>
                  <th style={{ padding: '12px 18px' }}>Issue Category</th>
                  <th style={{ padding: '12px 18px' }}>Duration</th>
                  <th style={{ padding: '12px 18px' }}>Linked Report ID</th>
                  <th style={{ padding: '12px 18px' }}>Status</th>
                  <th style={{ padding: '12px 18px' }}>Time</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right' }}>Audio & Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => {
                  const isCurrentlyPlaying = activePlayingCallId === call.id && isPlaying;
                  const statusStyle = getStatusBadge(call.status, call.urgency);

                  return (
                    <tr
                      key={call.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s',
                        backgroundColor: activePlayingCallId === call.id ? 'var(--primary-subtle)' : 'transparent'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = activePlayingCallId === call.id ? 'var(--primary-subtle)' : 'transparent')}
                    >
                      {/* Caller Details */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: call.status === 'escalated' ? '#FEE2E2' : '#EEF2FF',
                            color: call.status === 'escalated' ? '#DC2626' : '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}>
                            {call.callerName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{call.callerName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)' }}>
                              <span>{call.callerPhone}</span>
                              <button
                                onClick={() => copyToClipboard(call.callerPhone, 'Phone number')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', display: 'inline-flex' }}
                                title="Copy phone"
                              >
                                <Copy size={11} />
                              </button>
                              {call.isReal && (
                                <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                  LIVE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Language */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '11px',
                          backgroundColor: call.language.toLowerCase().includes('hindi') ? '#FEF3C7' : call.language.toLowerCase().includes('bengali') ? '#ECFDF5' : '#EEF2FF',
                          color: call.language.toLowerCase().includes('hindi') ? '#B45309' : call.language.toLowerCase().includes('bengali') ? '#047857' : '#4F46E5'
                        }}>
                          {call.language}
                        </span>
                      </td>

                      {/* Issue Category & Address */}
                      <td style={{ padding: '14px 18px', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-1)' }}>
                          {getCategoryIcon(call.category)}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{call.category}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {call.address}
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-2)' }}>
                        {formatTime(call.durationSeconds || 45)}
                      </td>

                      {/* Linked Report ID */}
                      <td style={{ padding: '14px 18px' }}>
                        {call.reportId ? (
                          <span
                            onClick={() => setSelectedCall(call)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            title="Click to inspect this report in drawer"
                          >
                            <FileText size={12} />
                            {call.reportId}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Inquiry Only</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`
                        }}>
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td style={{ padding: '14px 18px', color: 'var(--text-3)', fontSize: '11px' }}>
                        {getRelativeTime(call.createdAt || call.startedAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Play Recording Button */}
                          <button
                            onClick={() => handlePlayAudio(call)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: isCurrentlyPlaying ? '#EF4444' : '#4F46E5',
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(79,70,229,0.15)'
                            }}
                            title={isCurrentlyPlaying ? "Pause audio" : "Play recording"}
                          >
                            {isCurrentlyPlaying ? <Pause size={12} /> : <Play size={12} />}
                            <span>{isCurrentlyPlaying ? 'Pause' : 'Play Audio'}</span>
                          </button>

                          {/* Inspect Drawer Button */}
                          <button
                            onClick={() => setSelectedCall(call)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-2)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="View full conversation transcript and details"
                          >
                            Transcript
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-Over Inspection Drawer ────────────────────────────────── */}
      {selectedCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--surface)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border)',
          animation: 'slideInRight 0.25s ease'
        }}>
          {/* Drawer Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: 'var(--surface-2)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                  CALL SESSION ID: {selectedCall.callId || selectedCall.id}
                </span>
                {selectedCall.isReal && (
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', backgroundColor: '#D1FAE5', color: '#065F46' }}>
                    REAL CITIZEN CALL
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
                {selectedCall.callerName}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{selectedCall.callerPhone}</span>
                <span>•</span>
                <span>{selectedCall.channel}</span>
                <span>•</span>
                <span>{selectedCall.language}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCall(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Audio Playback Box Inside Drawer */}
            <div style={{
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Headphones size={16} color="#38BDF8" />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Call Voice Recording</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                  {formatTime(selectedCall.durationSeconds || 45)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handlePlayAudio(selectedCall)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#38BDF8',
                    color: '#0F172A',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {activePlayingCallId === selectedCall.id && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{activePlayingCallId === selectedCall.id && isPlaying ? 'Pause Audio' : 'Play Full Audio'}</span>
                </button>

                {/* Waveform graphic */}
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '16px', flex: 1 }}>
                  {[6, 12, 18, 10, 22, 14, 20, 8, 16, 24, 12, 18, 10, 16].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: activePlayingCallId === selectedCall.id && isPlaying ? `${h}px` : '4px',
                        backgroundColor: activePlayingCallId === selectedCall.id && isPlaying ? '#38BDF8' : '#475569',
                        borderRadius: '2px',
                        transition: 'height 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AI Summary Box */}
            <div style={{
              backgroundColor: 'var(--surface-2)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
                <Sparkles size={14} />
                <span>AI Automated Call Summary</span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--text-1)' }}>
                {selectedCall.summary}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', fontSize: '11px', color: 'var(--text-2)' }}>
                <div>
                  <strong>Category:</strong> {selectedCall.category}
                </div>
                <div>
                  <strong>Urgency:</strong> {selectedCall.urgency.toUpperCase()}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>Extracted Address:</strong> {selectedCall.address}
                </div>
              </div>
            </div>

            {/* Linked Ticket Pill */}
            {selectedCall.reportId && (
              <div style={{
                backgroundColor: '#ECFDF5',
                borderRadius: '12px',
                padding: '14px 16px',
                border: '1px solid #A7F3D0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>ASSOCIATED MUNICIPAL TICKET</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#065F46', marginTop: '2px' }}>
                    {selectedCall.reportId}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/complaints`)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#059669',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>View in Complaints</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            )}

            {/* Conversation Dialogue Transcript */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Verbatim Call Transcript</span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  {selectedCall.transcript.length} turns
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCall.transcript.map((item, idx) => {
                  const isAgent = item.sender === 'agent';

                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isAgent ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: isAgent ? 'var(--surface-2)' : '#4F46E5',
                        color: isAgent ? 'var(--text-1)' : '#FFFFFF',
                        border: isAgent ? '1px solid var(--border)' : 'none',
                        fontSize: '12px',
                        lineHeight: '1.5'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: isAgent ? 'var(--text-3)' : '#C7D2FE', marginBottom: '2px', textTransform: 'uppercase' }}>
                        {isAgent ? 'CivicPulse Sahayak AI' : selectedCall.callerName} • {item.timestamp}
                      </div>
                      {item.text}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface)' }}>
            <button
              onClick={() => {
                const text = selectedCall.transcript.map(t => `[${t.timestamp}] ${t.sender.toUpperCase()}: ${t.text}`).join('\n');
                copyToClipboard(text, 'Full transcript');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-2)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Copy size={13} />
              <span>Copy Transcript</span>
            </button>

            <button
              onClick={() => setSelectedCall(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
