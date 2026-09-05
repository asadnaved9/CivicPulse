import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { RANCHI_MUNICIPAL_ASSETS, MunicipalAsset } from '../../data/assetsData';
import { RANCHI_ISSUES } from '../../utils/seedData';
import { 
  AlertTriangle, Lightbulb, Droplet, Trash2, HelpCircle, 
  MapPin, Clock, CheckCircle, ShieldAlert, Navigation, Layers,
  Building2, Wrench, AlertOctagon, CheckCircle2, Eye, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Issue {
  id: string;
  title: string;
  category: string;
  severity: number;
  status: string;
  lat: number;
  lng: number;
  address: string;
  imageUrl?: string;
  assignedDepartment?: string;
}

const RanchiWards = [
  { name: 'Ward 18 - Main Road / Shaheed Chowk Corridor', points: '240,120 480,100 520,240 280,260' },
  { name: 'Ward 17 - Hindpiri / Daily Market Dense Sector', points: '140,220 280,260 260,380 120,340' },
  { name: 'Ward 14 - Church Road / Purulia Commercial Link', points: '380,180 580,160 550,300 360,310' },
  { name: 'Ward 12 - Kadru / Overbridge Transit Junction', points: '260,280 440,290 410,400 230,390' },
  { name: 'Ward 10 - Lalpur / Circular Road Academic Belt', points: '200,40 450,30 480,140 230,150' },
  { name: 'Ward 26 - Harmu Bypass Drainage Axis', points: '80,260 220,280 200,410 60,380' }
];

const AdminMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [assets, setAssets] = useState<MunicipalAsset[]>(RANCHI_MUNICIPAL_ASSETS);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MunicipalAsset | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'hazards' | 'assets'>('all');

  // Ranchi geographic boundaries for SVG conversion (640x440 viewport)
  const latMin = 23.3100;
  const latMax = 23.4000;
  const lngMin = 85.2900;
  const lngMax = 85.3600;

  // Convert GPS Coordinates to SVG coordinate workspace
  const convertToCoords = (lat: number, lng: number) => {
    // Clamp inside viewport
    const clampedLat = Math.max(latMin, Math.min(latMax, lat));
    const clampedLng = Math.max(lngMin, Math.min(lngMax, lng));
    const x = ((clampedLng - lngMin) / (lngMax - lngMin)) * 640;
    const y = 440 - (((clampedLat - latMin) / (latMax - latMin)) * 440);
    return { x, y };
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Use rich Ranchi seeded issues
      const fallbackList = (RANCHI_ISSUES as any[]).map((iss, idx) => ({
        id: `seed_issue_${idx + 1}`,
        title: iss.title,
        category: iss.category,
        severity: iss.severity || 4,
        status: iss.status || 'reported',
        lat: iss.lat,
        lng: iss.lng,
        address: iss.address,
        imageUrl: iss.imageUrl
      }));
      setIssues(fallbackList);
      setAssets(RANCHI_MUNICIPAL_ASSETS);
      setLoading(false);
      return;
    }

    // Sync issues
    const issuesRef = collection(db, 'issues');
    const unsubscribeIssues = onSnapshot(issuesRef, (snapshot) => {
      if (snapshot.empty) {
        const fallbackList = (RANCHI_ISSUES as any[]).map((iss, idx) => ({
          id: `seed_issue_${idx + 1}`,
          title: iss.title,
          category: iss.category,
          severity: iss.severity || 4,
          status: iss.status || 'reported',
          lat: iss.lat,
          lng: iss.lng,
          address: iss.address,
          imageUrl: iss.imageUrl
        }));
        setIssues(fallbackList);
      } else {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
        setIssues(list);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Issues fallback to Ranchi seeds:', err);
      const fallbackList = (RANCHI_ISSUES as any[]).map((iss, idx) => ({
        id: `seed_issue_${idx + 1}`,
        title: iss.title,
        category: iss.category,
        severity: iss.severity || 4,
        status: iss.status || 'reported',
        lat: iss.lat,
        lng: iss.lng,
        address: iss.address,
        imageUrl: iss.imageUrl
      }));
      setIssues(fallbackList);
      setLoading(false);
    });

    // Sync assets
    const assetsRef = collection(db, 'assets');
    const unsubscribeAssets = onSnapshot(assetsRef, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MunicipalAsset));
        setAssets(list);
      }
    }, () => {
      setAssets(RANCHI_MUNICIPAL_ASSETS);
    });

    return () => {
      unsubscribeIssues();
      unsubscribeAssets();
    };
  }, []);

  const getPinColor = (status: string) => {
    switch (status) {
      case 'reported': return '#EF4444'; // Red
      case 'verified': return '#3B82F6'; // Blue
      case 'in_progress': return '#F59E0B'; // Amber
      case 'resolved': return '#10B981'; // Green
      case 'blocked': return '#DC2626'; // Dark red
      default: return '#9CA3AF';
    }
  };

  const getAssetColor = (condition: string) => {
    switch (condition) {
      case 'healthy': return '#10B981'; // Green
      case 'maintenance_due': return '#F59E0B'; // Amber
      case 'critical': return '#EF4444'; // Red
      case 'out_of_service': return '#6B7280'; // Gray
      default: return '#3B82F6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pothole':
      case 'road': return <AlertTriangle size={14} color="#EF4444" />;
      case 'streetlight': return <Lightbulb size={14} color="#F59E0B" />;
      case 'water': return <Droplet size={14} color="#3B82F6" />;
      case 'waste': return <Trash2 size={14} color="#10B981" />;
      default: return <Building2 size={14} color="#9CA3AF" />;
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
      
      {/* Map View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header and Layer Switcher */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              GIS RADAR • RANCHI MUNICIPALITY
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', marginTop: 2, margin: 0 }}>
              Ward Spatial Radar & Asset Overlay
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: 2, margin: 0 }}>
              Real-time telemetry of citizen distress reports and municipal physical assets across Ranchi sectors.
            </p>
          </div>

          {/* Layer Filter Buttons */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setActiveLayer('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                background: activeLayer === 'all' ? 'var(--surface)' : 'transparent',
                color: activeLayer === 'all' ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              All Telemetry ({issues.length + assets.length})
            </button>
            <button
              onClick={() => setActiveLayer('hazards')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                background: activeLayer === 'hazards' ? 'var(--surface)' : 'transparent',
                color: activeLayer === 'hazards' ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              ⚠️ Citizen Hazards ({issues.length})
            </button>
            <button
              onClick={() => setActiveLayer('assets')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '11px',
                fontWeight: 600,
                background: activeLayer === 'assets' ? 'var(--surface)' : 'transparent',
                color: activeLayer === 'assets' ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              🏛️ City Assets ({assets.length})
            </button>
          </div>
        </div>

        {/* GIS Canvas Container */}
        <div style={{
          flex: 1,
          background: '#0B0F19', // Dark blueprint theme for high-contrast command radar
          borderRadius: 10,
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Layer Controls HUD */}
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#FFFFFF',
            zIndex: 10,
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Layers size={13} color="#3B82F6" />
            <span>RANCHI WARD MESH ACTIVE</span>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              LIVE TELEMETRY
            </span>
          </div>

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 6,
            padding: '8px 14px',
            color: '#FFFFFF',
            zIndex: 10,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              ● Reported Hazard
            </span>
            <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
              ● In Progress
            </span>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              ● Resolved Proof
            </span>
            <span style={{ color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 4 }}>
              ■ Municipal Asset
            </span>
          </div>

          {/* SVG Map Canvas */}
          <svg 
            width="640" 
            height="440" 
            viewBox="0 0 640 440" 
            style={{ maxWidth: '100%', height: 'auto', zIndex: 1 }}
          >
            {/* Draw Ward Boundaries */}
            {RanchiWards.map((ward, idx) => (
              <polygon
                key={idx}
                points={ward.points}
                fill="rgba(59, 130, 246, 0.03)"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => {
                  e.currentTarget.setAttribute('fill', 'rgba(59, 130, 246, 0.08)');
                  e.currentTarget.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
                }}
                onMouseLeave={e => {
                  e.currentTarget.setAttribute('fill', 'rgba(59, 130, 246, 0.03)');
                  e.currentTarget.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
                }}
              >
                <title>{ward.name}</title>
              </polygon>
            ))}

            {/* Grid references */}
            <line x1="120" y1="0" x2="120" y2="440" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="240" y1="0" x2="240" y2="440" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="360" y1="0" x2="360" y2="440" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="480" y1="0" x2="480" y2="440" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="0" y1="110" x2="640" y2="110" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="0" y1="220" x2="640" y2="220" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />
            <line x1="0" y1="330" x2="640" y2="330" stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="4,4" />

            {/* Ward Labels */}
            <text x="320" y="190" fill="rgba(255, 255, 255, 0.2)" fontSize="10" fontFamily="monospace" textAnchor="middle">WARD 18 - MAIN ROAD</text>
            <text x="180" y="300" fill="rgba(255, 255, 255, 0.2)" fontSize="10" fontFamily="monospace" textAnchor="middle">WARD 17 - HINDPIRI</text>
            <text x="460" y="240" fill="rgba(255, 255, 255, 0.2)" fontSize="10" fontFamily="monospace" textAnchor="middle">WARD 14 - CHURCH RD</text>
            <text x="330" y="340" fill="rgba(255, 255, 255, 0.2)" fontSize="10" fontFamily="monospace" textAnchor="middle">WARD 12 - KADRU</text>
            <text x="330" y="90" fill="rgba(255, 255, 255, 0.2)" fontSize="10" fontFamily="monospace" textAnchor="middle">WARD 10 - LALPUR</text>

            {/* Render Municipal Physical Assets (Square Pins) */}
            {(activeLayer === 'all' || activeLayer === 'assets') && assets.map((asset) => {
              const { x, y } = convertToCoords(asset.lat, asset.lng);
              const color = getAssetColor(asset.condition);
              const isSelected = selectedAsset?.id === asset.id;

              return (
                <g 
                  key={asset.id} 
                  transform={`translate(${x}, ${y})`}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setSelectedIssue(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x="-8"
                    y="-8"
                    width="16"
                    height="16"
                    rx="3"
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? "2.5" : "1"}
                    style={{ transition: 'transform 0.15s ease' }}
                  />
                  <text
                    x="0"
                    y="3"
                    fill="#FFFFFF"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    A
                  </text>
                  <title>{`${asset.id}: ${asset.name} (${asset.condition})`}</title>
                </g>
              );
            })}

            {/* Render Citizen Reported Hazards (Circular Pulse Pins) */}
            {(activeLayer === 'all' || activeLayer === 'hazards') && issues.map((issue) => {
              if (!issue.lat || !issue.lng) return null;
              const { x, y } = convertToCoords(issue.lat, issue.lng);
              const pinColor = getPinColor(issue.status);
              const isSelected = selectedIssue?.id === issue.id;

              return (
                <g 
                  key={issue.id} 
                  transform={`translate(${x}, ${y})`}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setSelectedAsset(null);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer glowing radar pulse for high severity */}
                  {issue.severity >= 4 && (
                    <circle
                      r="12"
                      fill="none"
                      stroke={pinColor}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                  {/* Pin Dot */}
                  <circle
                    r={isSelected ? 8 : 6}
                    fill={pinColor}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <title>{`${issue.title} [${issue.status.toUpperCase()}]`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Side Inspector Panel (Shows details when clicking either hazard or asset) */}
      <div style={{
        width: '360px',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-4px 0 10px rgba(0,0,0,0.03)'
      }}>
        {selectedAsset ? (
          /* Asset Details */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                MUNICIPAL ASSET INSPECTOR
              </span>
              <button 
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>
                {selectedAsset.id} • {selectedAsset.ward}
              </span>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-1)' }}>
                {selectedAsset.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block', marginTop: '2px' }}>
                {selectedAsset.address}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Condition</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: getAssetColor(selectedAsset.condition), marginTop: '2px', textTransform: 'capitalize' }}>
                  {selectedAsset.condition.replace('_', ' ')}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Health Score</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: selectedAsset.healthScore >= 70 ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
                  {selectedAsset.healthScore}/100
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>Department</span>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedAsset.department}</div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>Engineering Specs</span>
              <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{selectedAsset.specifications}</p>
            </div>

            <button
              onClick={() => navigate('/admin/assets')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Wrench size={14} />
              <span>Open Asset In Inventory</span>
            </button>
          </div>
        ) : selectedIssue ? (
          /* Hazard Issue Details */
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                CITIZEN COMPLAINT INSPECTOR
              </span>
              <button 
                onClick={() => setSelectedIssue(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            {selectedIssue.imageUrl && (
              <img 
                src={selectedIssue.imageUrl} 
                alt="Location Proof"
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {getCategoryIcon(selectedIssue.category)}
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-2)' }}>
                  {selectedIssue.category}
                </span>
                <span style={{ fontSize: '10px', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-2)' }}>
                  Sev {selectedIssue.severity}/5
                </span>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                {selectedIssue.title}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block', marginTop: '4px' }}>
                {selectedIssue.address}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Status</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: getPinColor(selectedIssue.status), marginTop: '2px', textTransform: 'uppercase' }}>
                  {selectedIssue.status}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Coordinates</span>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-1)', marginTop: '2px' }}>
                  {selectedIssue.lat?.toFixed(3)}, {selectedIssue.lng?.toFixed(3)}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/complaints')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <span>Manage in Complaints Board</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Empty selection guide */
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: 'auto' }}>
            <Navigation size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>Interactive Spatial Inspection</div>
              <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.5 }}>
                Click any hazard dot (circle) or physical asset (square) on the radar map to view details, linked complaints, and dispatch work squads.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminMapPage;
