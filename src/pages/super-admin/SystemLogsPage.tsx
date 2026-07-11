import React, { useEffect, useRef, useState } from 'react';
import { Terminal, CheckCircle, AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
}

const SOURCES = ['AuthContext', 'Firestore', 'AIAgent', 'StorageService', 'RequireRole', 'AdminDashboard', 'ReportPage', 'MapPage', 'IssueSync', 'NotificationService'];

const SAMPLE_MESSAGES: { level: LogLevel; source: string; message: string; details?: string }[] = [
  { level: 'INFO', source: 'AuthContext', message: 'User signed in: admin@civicpulse.gov.in', details: 'Role resolved: admin | municipalityId: Kolkata Municipality' },
  { level: 'SUCCESS', source: 'IssueSync', message: 'Issue seed_001 status updated to in_progress' },
  { level: 'WARN', source: 'AIAgent', message: 'Gemini rate limit approaching: 85% of quota used' },
  { level: 'ERROR', source: 'StorageService', message: 'Upload failed: resolvedImageUrl for issue_xyz', details: 'Error: storage/unauthorized — check Firestore Security Rules' },
  { level: 'INFO', source: 'RequireRole', message: 'Access granted to /admin/dashboard for uid: mock_demo_uid' },
  { level: 'DEBUG', source: 'Firestore', message: 'getCountFromServer: issues[status==open] → 23' },
  { level: 'INFO', source: 'NotificationService', message: 'Notification dispatched to uid: u1 — "Your issue #45 is In Progress"' },
  { level: 'SUCCESS', source: 'AIAgent', message: 'Gemini classification complete: pothole (confidence: 0.94)' },
  { level: 'WARN', source: 'MapPage', message: 'Leaflet container already initialized — forcing re-mount' },
  { level: 'ERROR', source: 'Firestore', message: 'Permission denied: /analytics/healthScore', details: 'Firestore rules: server-only writes. Client attempted direct write.' },
  { level: 'INFO', source: 'AuthContext', message: 'Super admin signed in: superadmin@civicpulse.gov.in' },
  { level: 'SUCCESS', source: 'IssueSync', message: 'Zone prediction batch updated: 4 zones recalculated' },
  { level: 'DEBUG', source: 'AIAgent', message: 'Token usage: input=420, output=180, model=gemini-2.0-flash-exp' },
  { level: 'INFO', source: 'ReportPage', message: 'New issue submitted: "Water main burst near Park Street"' },
  { level: 'WARN', source: 'AdminDashboard', message: 'SLA breach detected: issue_034 open for 12 days (estDays: 5)' },
  { level: 'SUCCESS', source: 'Firestore', message: 'Batch write complete: 6 seed issues seeded to /issues' },
  { level: 'INFO', source: 'AuthContext', message: 'User signed out gracefully' },
  { level: 'ERROR', source: 'AIAgent', message: 'Gemini API timeout after 30s — falling back to cached classification' },
  { level: 'DEBUG', source: 'Firestore', message: 'onSnapshot listener attached: /issues (real-time)' },
  { level: 'SUCCESS', source: 'NotificationService', message: 'Batch notifications sent: 12 users notified of status updates' },
];

let logSeq = 0;
const generateLog = (): LogEntry => {
  const template = SAMPLE_MESSAGES[logSeq % SAMPLE_MESSAGES.length];
  logSeq++;
  const now = new Date();
  return {
    id: `log_${Date.now()}_${Math.random()}`,
    timestamp: now.toISOString(),
    level: template.level,
    source: template.source,
    message: template.message,
    details: template.details,
  };
};

const seedLogs = (): LogEntry[] => {
  const now = Date.now();
  return Array.from({ length: 40 }, (_, i) => {
    const template = SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length];
    return {
      id: `log_seed_${i}`,
      timestamp: new Date(now - (40 - i) * 60 * 1000 - Math.random() * 30000).toISOString(),
      level: template.level,
      source: template.source,
      message: template.message,
      details: template.details,
    };
  });
};

const levelIcon = (level: LogLevel) => {
  const s = 13;
  switch (level) {
    case 'SUCCESS': return <CheckCircle size={s} color="#10B981" />;
    case 'ERROR': return <XCircle size={s} color="#EF4444" />;
    case 'WARN': return <AlertTriangle size={s} color="#F59E0B" />;
    case 'INFO': return <Info size={s} color="var(--primary)" />;
    case 'DEBUG': return <Terminal size={s} color="var(--text-3)" />;
  }
};

const levelColor = (level: LogLevel) => {
  switch (level) {
    case 'SUCCESS': return '#10B981';
    case 'ERROR': return '#EF4444';
    case 'WARN': return '#F59E0B';
    case 'INFO': return 'var(--primary)';
    case 'DEBUG': return 'var(--text-3)';
  }
};

const SystemLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>(seedLogs);
  const [paused, setPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Simulate real-time log stream
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = generateLog();
        const updated = [...prev, newLog];
        return updated.slice(-200); // keep last 200 logs
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    if (autoScroll && !paused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, paused]);

  const filtered = logs.filter(l => {
    const matchLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchSource = sourceFilter === 'ALL' || l.source === sourceFilter;
    const matchSearch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSource && matchSearch;
  });

  const counts: Record<LogLevel, number> = {
    SUCCESS: logs.filter(l => l.level === 'SUCCESS').length,
    INFO: logs.filter(l => l.level === 'INFO').length,
    WARN: logs.filter(l => l.level === 'WARN').length,
    ERROR: logs.filter(l => l.level === 'ERROR').length,
    DEBUG: logs.filter(l => l.level === 'DEBUG').length,
  };

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString([], { month: 'short', day: '2-digit' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>INTELLIGENCE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)' }}>System Logs</h1>
            {!paused && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#10B981' }}>LIVE</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Real-time application event stream — last {logs.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}
            onClick={() => setAutoScroll(p => !p)}>
            {autoScroll ? 'Pause Scroll' : 'Resume Scroll'}
          </button>
          <button
            onClick={() => setPaused(p => !p)}
            className={paused ? 'btn btn-primary' : 'btn btn-danger'}
            style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={12} />
            {paused ? 'Resume Stream' : 'Pause Stream'}
          </button>
        </div>
      </div>

      {/* Level counts */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['ALL', 'SUCCESS', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map(level => (
          <button key={level} onClick={() => setLevelFilter(level)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
            background: levelFilter === level ? levelColor(level === 'ALL' ? 'INFO' : level) + '20' : 'transparent',
            color: levelFilter === level ? levelColor(level === 'ALL' ? 'INFO' : level) : 'var(--text-2)',
            border: levelFilter === level ? `1px solid ${levelColor(level === 'ALL' ? 'INFO' : level)}` : '1px solid var(--border)',
          }}>
            {level !== 'ALL' && levelIcon(level as LogLevel)}
            {level} {level !== 'ALL' && <span style={{ fontWeight: 700 }}>{counts[level as LogLevel]}</span>}
          </button>
        ))}
        <select className="form-select" style={{ width: 160, padding: '6px 10px', fontSize: 11 }}
          value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
          <option value="ALL">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="form-input" style={{ width: 200, padding: '6px 10px', fontSize: 11 }}
          placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Log terminal */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
        maxHeight: 560, overflowY: 'auto', fontFamily: 'var(--font-mono)',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No log entries match filters.</div>
        ) : (
          filtered.map(log => (
            <div
              key={log.id}
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px',
                borderBottom: '1px solid var(--border)', cursor: log.details ? 'pointer' : 'default',
                background: log.level === 'ERROR' ? 'rgba(239,68,68,0.04)' : log.level === 'WARN' ? 'rgba(245,158,11,0.03)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>{levelIcon(log.level)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0, width: 150 }}>{formatTs(log.timestamp)}</div>
              <div style={{ fontSize: 11, color: typeColor(log.source), flexShrink: 0, width: 140 }}>[{log.source}]</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-1)' }}>{log.message}</div>
                {expandedId === log.id && log.details && (
                  <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 4, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
                    {log.details}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 10, color: levelColor(log.level), fontWeight: 600, flexShrink: 0 }}>{log.level}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>
        Showing {filtered.length} entries · Click rows with details to expand · Stream updates every ~3.5s
      </div>
    </div>
  );
};

// Helper used from AIMonitoringPage
function typeColor(source: string): string {
  const map: Record<string, string> = {
    AuthContext: 'var(--primary)',
    Firestore: '#06B6D4',
    AIAgent: '#8B5CF6',
    StorageService: '#F59E0B',
    RequireRole: '#10B981',
    AdminDashboard: 'var(--primary)',
    ReportPage: '#F59E0B',
    MapPage: '#10B981',
    IssueSync: '#10B981',
    NotificationService: '#F97316',
  };
  return map[source] || 'var(--text-3)';
}

export default SystemLogsPage;
