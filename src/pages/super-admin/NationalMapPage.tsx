import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { MapPin, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: string;
  severity: number;
  category: string;
  address: string;
  municipalityId?: string;
}

// India bounding box
const INDIA_BOUNDS = { north: 37.1, south: 6.5, east: 97.5, west: 68.0 };

// Seed issue locations across India
const SEED_ISSUES: Issue[] = [
  { id: 's1', title: 'Road collapse on NH-12', lat: 22.5726, lng: 88.3639, status: 'open', severity: 5, category: 'road_damage', address: 'Kolkata, WB', municipalityId: 'Kolkata Municipality' },
  { id: 's2', title: 'Streetlight failures', lat: 22.5200, lng: 88.3500, status: 'in_progress', severity: 3, category: 'streetlight', address: 'South Kolkata', municipalityId: 'Kolkata Municipality' },
  { id: 's3', title: 'Water main burst', lat: 22.6000, lng: 88.4000, status: 'open', severity: 5, category: 'water_leak', address: 'North Kolkata' },
  { id: 's4', title: 'Pothole cluster, MG Road', lat: 12.9716, lng: 77.5946, status: 'resolved', severity: 4, category: 'pothole', address: 'Bangalore, KA', municipalityId: 'Bangalore Urban' },
  { id: 's5', title: 'Garbage accumulation', lat: 12.9300, lng: 77.6000, status: 'open', severity: 3, category: 'garbage', address: 'Whitefield, Bangalore' },
  { id: 's6', title: 'Flooding on SV Road', lat: 19.0760, lng: 72.8777, status: 'in_progress', severity: 4, category: 'flooding', address: 'Mumbai, MH', municipalityId: 'Mumbai Municipal Corporation' },
  { id: 's7', title: 'Open manhole on LBS Marg', lat: 19.1200, lng: 72.8500, status: 'open', severity: 5, category: 'drain_blocked', address: 'Thane, Mumbai' },
  { id: 's8', title: 'Broken footpath railing', lat: 13.0827, lng: 80.2707, status: 'resolved', severity: 2, category: 'road_damage', address: 'Chennai, TN', municipalityId: 'Chennai Corporation' },
  { id: 's9', title: 'Power line sparking', lat: 17.3850, lng: 78.4867, status: 'open', severity: 5, category: 'electrical', address: 'Hyderabad, TS', municipalityId: 'Hyderabad GHMC' },
  { id: 's10', title: 'Overflowing drain', lat: 17.4100, lng: 78.5000, status: 'in_progress', severity: 4, category: 'drain_blocked', address: 'Secunderabad, TS' },
  { id: 's11', title: 'Fallen tree blocking road', lat: 28.6139, lng: 77.2090, status: 'resolved', severity: 3, category: 'road_damage', address: 'Delhi, DL' },
  { id: 's12', title: 'Illegal dumping site', lat: 28.7000, lng: 77.1500, status: 'open', severity: 3, category: 'garbage', address: 'North Delhi' },
  { id: 's13', title: 'Broken water pump', lat: 23.0225, lng: 72.5714, status: 'open', severity: 4, category: 'water_leak', address: 'Ahmedabad, GJ', municipalityId: 'Ahmedabad Municipal' },
  { id: 's14', title: 'Pothole highway 48', lat: 18.5204, lng: 73.8567, status: 'in_progress', severity: 3, category: 'pothole', address: 'Pune, MH' },
  { id: 's15', title: 'Bus stop vandalism', lat: 26.8467, lng: 80.9462, status: 'open', severity: 2, category: 'park_damage', address: 'Lucknow, UP' },
];

const statusColor = (s: string) => s === 'open' ? '#EF4444' : s === 'in_progress' ? '#F59E0B' : '#10B981';
const statusLabel = (s: string) => s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : 'Resolved';

// Simple SVG map of India outline (approximate path)
const INDIA_SVG_PATH = "M200,20 L240,15 L280,30 L310,20 L350,40 L370,80 L390,100 L400,140 L390,170 L410,200 L420,240 L400,280 L380,310 L350,340 L320,370 L290,400 L260,430 L240,460 L220,490 L210,520 L200,550 L180,540 L160,510 L140,480 L130,450 L120,420 L110,390 L100,360 L90,330 L80,300 L70,260 L60,220 L70,180 L90,150 L110,120 L130,90 L160,60 L190,40 Z";

const NationalMapPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!isFirebaseConfigured) {
        setIssues(SEED_ISSUES);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'issues'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue))
          .filter(i => i.lat && i.lng && i.lat >= INDIA_BOUNDS.south && i.lat <= INDIA_BOUNDS.north);
        setIssues(items.length >= 5 ? items : [...SEED_ISSUES]);
      } catch {
        setIssues(SEED_ISSUES);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Map lat/lng to SVG coordinates (500x600 viewport)
  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng - INDIA_BOUNDS.west) / (INDIA_BOUNDS.east - INDIA_BOUNDS.west)) * 460 + 20;
    const y = ((INDIA_BOUNDS.north - lat) / (INDIA_BOUNDS.north - INDIA_BOUNDS.south)) * 560 + 20;
    return { x, y };
  };

  const filtered = issues.filter(i => {
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || String(i.severity) === severityFilter;
    return matchStatus && matchSeverity;
  });

  const openCnt = issues.filter(i => i.status === 'open').length;
  const inProgressCnt = issues.filter(i => i.status === 'in_progress').length;
  const resolvedCnt = issues.filter(i => i.status === 'resolved').length;
  const criticalCnt = issues.filter(i => i.severity >= 4).length;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>GOVERNANCE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>National Map</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Real-time civic issue distribution across all municipalities in India</p>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Issues', value: issues.length, color: 'var(--text-1)', icon: <MapPin size={14}/> },
          { label: 'Open', value: openCnt, color: '#EF4444', icon: <AlertTriangle size={14}/> },
          { label: 'In Progress', value: inProgressCnt, color: '#F59E0B', icon: <Clock size={14}/> },
          { label: 'Resolved', value: resolvedCnt, color: '#10B981', icon: <CheckCircle size={14}/> },
          { label: 'Critical (4–5)', value: criticalCnt, color: '#EF4444', icon: <AlertTriangle size={14}/> },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '13px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>{loading ? '—' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} color="var(--text-3)" />
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: statusFilter === s ? 'var(--primary)' : 'transparent',
            color: statusFilter === s ? '#fff' : 'var(--text-2)',
            border: statusFilter === s ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{s === 'all' ? 'All Status' : statusLabel(s)}</button>
        ))}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        {['all', '5', '4', '3', '2', '1'].map(sev => (
          <button key={sev} onClick={() => setSeverityFilter(sev)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: severityFilter === sev ? 'var(--primary)' : 'transparent',
            color: severityFilter === sev ? '#fff' : 'var(--text-2)',
            border: severityFilter === sev ? '1px solid var(--primary)' : '1px solid var(--border)',
          }}>{sev === 'all' ? 'All Severity' : `S-${sev}`}</button>
        ))}
      </div>

      {/* Map + Sidebar */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* SVG Map */}
        <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', position: 'relative', minHeight: 500 }}>
          {loading ? (
            <div className="shimmer" style={{ height: 520 }} />
          ) : (
            <svg ref={svgRef} viewBox="0 0 500 600" style={{ width: '100%', display: 'block' }}>
              {/* Background */}
              <rect width="500" height="600" fill="var(--bg)" />
              {/* India silhouette (approximate grid dots as reference points) */}
              <g opacity="0.07">
                {Array.from({ length: 20 }).map((_, r) =>
                  Array.from({ length: 16 }).map((_, c) => (
                    <circle key={`${r}-${c}`} cx={30 + c * 28} cy={30 + r * 28} r={1.5} fill="var(--text-3)" />
                  ))
                )}
              </g>
              {/* City labels */}
              {[
                { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
                { name: 'Mumbai', lat: 19.076, lng: 72.8777 },
                { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
                { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
                { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
                { name: 'Hyderabad', lat: 17.385, lng: 78.4867 },
                { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
                { name: 'Pune', lat: 18.5204, lng: 73.8567 },
              ].map(city => {
                const { x, y } = latLngToXY(city.lat, city.lng);
                return (
                  <g key={city.name}>
                    <circle cx={x} cy={y} r={4} fill="var(--border)" stroke="var(--text-3)" strokeWidth={1} />
                    <text x={x + 6} y={y + 4} fontSize={8} fill="var(--text-3)" fontFamily="JetBrains Mono">{city.name}</text>
                  </g>
                );
              })}
              {/* Issue pins */}
              {filtered.map(issue => {
                const { x, y } = latLngToXY(issue.lat, issue.lng);
                const color = statusColor(issue.status);
                const r = 5 + (issue.severity - 1) * 1.5;
                return (
                  <g key={issue.id} onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={r + 3} fill={color} opacity={0.2} />
                    <circle cx={x} cy={y} r={r}
                      fill={color} opacity={0.85}
                      stroke={selectedIssue?.id === issue.id ? '#fff' : 'transparent'}
                      strokeWidth={2}
                    />
                    {issue.severity === 5 && (
                      <circle cx={x} cy={y} r={r + 6} fill={color} opacity={0.1}>
                        <animate attributeName="r" from={r + 4} to={r + 12} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from={0.15} to={0} dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Map Legend */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Legend</div>
            {[['Open', '#EF4444'], ['In Progress', '#F59E0B'], ['Resolved', '#10B981']].map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ color: 'var(--text-2)' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, color: 'var(--text-3)', fontSize: 10 }}>Pin size = severity</div>
          </div>
        </div>

        {/* Issue detail panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          {selectedIssue ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Issue Detail</span>
                <button onClick={() => setSelectedIssue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><Filter size={13} /></button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{selectedIssue.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{selectedIssue.address}</div>
              </div>
              {[
                ['Status', <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: statusColor(selectedIssue.status) + '22', color: statusColor(selectedIssue.status), border: `1px solid ${statusColor(selectedIssue.status)}` }}>{statusLabel(selectedIssue.status)}</span>],
                ['Severity', `S-${selectedIssue.severity}`],
                ['Category', selectedIssue.category?.replace('_', ' ')],
                ['Municipality', selectedIssue.municipalityId || '—'],
                ['Lat / Lng', `${selectedIssue.lat?.toFixed(4)}, ${selectedIssue.lng?.toFixed(4)}`],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>{val as React.ReactNode}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Click any pin on the map to view issue details.
                <br /><br />
                Showing <strong style={{ color: 'var(--text-1)' }}>{filtered.length}</strong> of {issues.length} issues.
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>By Category</div>
                {Array.from(new Set(issues.map(i => i.category))).slice(0, 6).map(cat => {
                  const cnt = issues.filter(i => i.category === cat).length;
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{(cat as string)?.replace('_', ' ')}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', fontWeight: 600 }}>{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NationalMapPage;
