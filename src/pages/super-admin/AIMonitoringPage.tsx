import React, { useEffect, useState } from 'react';
import { Bot, Zap, CheckCircle, AlertTriangle, Clock, TrendingUp, Activity } from 'lucide-react';

interface AICallRecord {
  id: string;
  timestamp: string;
  type: 'classification' | 'tag_generation' | 'zone_prediction' | 'insights_summary';
  status: 'success' | 'error' | 'timeout';
  latencyMs: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  issueId?: string;
  error?: string;
}

// Generate realistic seed data for the last 24 hours
const generateSeedData = (): AICallRecord[] => {
  const types: AICallRecord['type'][] = ['classification', 'tag_generation', 'zone_prediction', 'insights_summary'];
  const statuses: AICallRecord['status'][] = ['success', 'success', 'success', 'success', 'success', 'error', 'timeout'];
  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-2.0-flash'];
  const now = new Date();

  return Array.from({ length: 48 }, (_, i) => {
    const type = types[i % types.length];
    const status = statuses[i % statuses.length];
    const ts = new Date(now.getTime() - i * 30 * 60 * 1000);
    return {
      id: `ai_${i}`,
      timestamp: ts.toISOString(),
      type,
      status,
      latencyMs: status === 'timeout' ? 30000 : 800 + Math.random() * 2200,
      model: models[i % models.length],
      inputTokens: 200 + Math.floor(Math.random() * 800),
      outputTokens: 100 + Math.floor(Math.random() * 400),
      issueId: type === 'classification' ? `issue_${i * 7}` : undefined,
      error: status === 'error' ? 'API quota exceeded' : status === 'timeout' ? 'Request timeout after 30s' : undefined,
    };
  });
};

const SEED_RECORDS = generateSeedData();

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    classification: 'Issue Classification',
    tag_generation: 'Tag Generation',
    zone_prediction: 'Zone Prediction',
    insights_summary: 'Insights Summary',
  };
  return map[t] || t;
};

const typeColor = (t: string) => {
  const map: Record<string, string> = {
    classification: 'var(--primary)',
    tag_generation: '#F59E0B',
    zone_prediction: '#8B5CF6',
    insights_summary: '#06B6D4',
  };
  return map[t] || 'var(--text-3)';
};

const statusColor = (s: string) =>
  s === 'success' ? '#10B981' : s === 'error' ? '#EF4444' : '#F59E0B';

const AIMonitoringPage: React.FC = () => {
  const [records] = useState<AICallRecord[]>(SEED_RECORDS);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const successCnt = records.filter(r => r.status === 'success').length;
  const errorCnt = records.filter(r => r.status === 'error').length;
  const timeoutCnt = records.filter(r => r.status === 'timeout').length;
  const avgLatency = records.length ? (records.reduce((s, r) => s + r.latencyMs, 0) / records.length / 1000).toFixed(2) : '0';
  const totalTokens = records.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);
  const successRate = records.length ? ((successCnt / records.length) * 100).toFixed(1) : '0';

  const byType = ['classification', 'tag_generation', 'zone_prediction', 'insights_summary'].map(t => ({
    type: t,
    total: records.filter(r => r.type === t).length,
    success: records.filter(r => r.type === t && r.status === 'success').length,
    avgMs: records.filter(r => r.type === t).reduce((s, r) => s + r.latencyMs, 0) /
      Math.max(records.filter(r => r.type === t).length, 1),
  }));

  const filtered = records.filter(r => {
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchType && matchStatus;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>INTELLIGENCE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)' }}>AI Monitoring</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#10B981' }}>LIVE</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Gemini AI pipeline performance, call log, and token usage</p>
      </div>

      {/* Health KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Calls', value: records.length, icon: <Bot size={16} />, color: 'var(--primary)' },
          { label: 'Success Rate', value: `${successRate}%`, icon: <CheckCircle size={16} />, color: '#10B981' },
          { label: 'Errors', value: errorCnt, icon: <AlertTriangle size={16} />, color: '#EF4444' },
          { label: 'Timeouts', value: timeoutCnt, icon: <Clock size={16} />, color: '#F59E0B' },
          { label: 'Avg Latency', value: `${avgLatency}s`, icon: <Activity size={16} />, color: 'var(--text-2)' },
          { label: 'Total Tokens', value: totalTokens.toLocaleString(), icon: <Zap size={16} />, color: '#8B5CF6' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Per-pipeline breakdown */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>PIPELINE BREAKDOWN</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 }}>
          {byType.map(t => (
            <div key={t.type} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 8, borderLeft: `3px solid ${typeColor(t.type)}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>{typeLabel(t.type)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>CALLS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.total}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>SUCCESS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10B981' }}>
                    {t.total ? ((t.success / t.total) * 100).toFixed(0) : 0}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>AVG MS</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.avgMs.toFixed(0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Call log */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>FILTER:</span>
        {['all', 'classification', 'tag_generation', 'zone_prediction', 'insights_summary'].map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(0); }} style={{
            padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
            background: typeFilter === t ? 'var(--primary)' : 'transparent',
            color: typeFilter === t ? '#fff' : 'var(--text-2)',
            border: typeFilter === t ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{t === 'all' ? 'All Types' : typeLabel(t)}</button>
        ))}
        {['all', 'success', 'error', 'timeout'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }} style={{
            padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
            background: statusFilter === s ? statusColor(s === 'all' ? 'success' : s) : 'transparent',
            color: statusFilter === s ? '#fff' : 'var(--text-2)',
            border: statusFilter === s ? `1px solid ${statusColor(s === 'all' ? 'success' : s)}` : '1px solid var(--border)',
          }}>{s === 'all' ? 'All Status' : s}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Pipeline</th>
              <th>Model</th>
              <th>Status</th>
              <th>Latency</th>
              <th>In Tokens</th>
              <th>Out Tokens</th>
              <th>Issue Ref</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatTime(r.timestamp)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{formatDate(r.timestamp)}</div>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: typeColor(r.type), fontWeight: 500 }}>{typeLabel(r.type)}</span>
                </td>
                <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{r.model}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(r.status) }} />
                    <span style={{ fontSize: 12, color: statusColor(r.status) }}>{r.status}</span>
                  </div>
                  {r.error && <div style={{ fontSize: 10, color: '#EF4444', marginTop: 2 }}>{r.error}</div>}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <span style={{ color: r.latencyMs > 5000 ? '#EF4444' : r.latencyMs > 2000 ? '#F59E0B' : 'var(--text-1)' }}>
                    {(r.latencyMs / 1000).toFixed(2)}s
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.inputTokens}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.outputTokens}</td>
                <td style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.issueId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default AIMonitoringPage;
