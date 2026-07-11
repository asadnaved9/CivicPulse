import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { 
  AlertTriangle, Lightbulb, Droplet, Trash2, HelpCircle, 
  MapPin, Clock, CheckCircle, ShieldAlert, Navigation, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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
}

const KolkataWards = [
  { name: 'Ward 63 - Park Street / Commercial Sector', points: '150,120 320,100 350,220 180,240' },
  { name: 'Ward 97 - Gariahat / Southern Markets', points: '180,240 350,220 320,380 120,340' },
  { name: 'Ward 108 - Salt Lake / IT & Residential', points: '320,100 520,80 550,250 350,220' },
  { name: 'Ward 85 - Ballygunge / Residential Hub', points: '350,220 550,250 490,400 320,380' },
  { name: 'Ward 50 - Sealdah / Transit Corridor', points: '50,150 150,120 180,240 120,340 40,280' }
];

const AdminMapPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  
  // Kolkata geographic bounds
  const latMin = 22.5000;
  const latMax = 22.6000;
  const lngMin = 88.3000;
  const lngMax = 88.4500;

  // Convert real Geolocation Lat/Lng to SVG coordinate workspace (600x420)
  const convertToCoords = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 600;
    const y = 420 - (((lat - latMin) / (latMax - latMin)) * 420);
    return { x, y };
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribe = onSnapshot(issuesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      setIssues(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getPinColor = (status: string) => {
    switch (status) {
      case 'reported': return '#EF4444'; // Red
      case 'verified': return '#3B82F6'; // Blue
      case 'in_progress': return '#F59E0B'; // Amber
      case 'resolved': return '#10B981'; // Green
      default: return '#9CA3AF';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pothole': return <AlertTriangle size={14} color="#EF4444" />;
      case 'streetlight': return <Lightbulb size={14} color="#F59E0B" />;
      case 'water': return <Droplet size={14} color="#3B82F6" />;
      case 'waste': return <Trash2 size={14} color="#10B981" />;
      default: return <HelpCircle size={14} color="#9CA3AF" />;
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      
      {/* Map View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            GIS OVERVIEW
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>
            Ward Geo-Spatial Radar
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
            Visual dispatch terminal showing live locations and status of all infrastructure hazards in Kolkata wards.
          </p>
        </div>

        {/* GIS Canvas Container */}
        <div style={{
          flex: 1,
          background: '#0B0F19', // Sleek dark blueprint theme for operations map
          borderRadius: 8,
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
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#FFFFFF',
            zIndex: 10,
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Layers size={12} color="#3B82F6" />
            <span>WARD SCHEMATIC ACTIVE</span>
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              LIVE
            </span>
          </div>

          {/* SVG Map Canvas */}
          <svg 
            width="600" 
            height="420" 
            viewBox="0 0 600 420" 
            style={{ maxWidth: '100%', height: 'auto', zIndex: 1 }}
          >
            {/* Draw Ward Boundaries */}
            {KolkataWards.map((ward, idx) => (
              <polygon
                key={idx}
                points={ward.points}
                fill="rgba(59, 130, 246, 0.02)"
                stroke="rgba(255, 255, 255, 0.07)"
                strokeWidth="1"
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.setAttribute('fill', 'rgba(59, 130, 246, 0.06)');
                  e.currentTarget.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
                }}
                onMouseLeave={e => {
                  e.currentTarget.setAttribute('fill', 'rgba(59, 130, 246, 0.02)');
                  e.currentTarget.setAttribute('stroke', 'rgba(255, 255, 255, 0.07)');
                }}
              >
                <title>{ward.name}</title>
              </polygon>
            ))}

            {/* Grid references */}
            <line x1="100" y1="0" x2="100" y2="420" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="200" y1="0" x2="200" y2="420" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="300" y1="0" x2="300" y2="420" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="400" y1="0" x2="400" y2="420" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="500" y1="0" x2="500" y2="420" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />
            <line x1="0" y1="300" x2="600" y2="300" stroke="rgba(255, 255, 255, 0.02)" strokeDasharray="5,5" />

            {/* Plot issue pins */}
            {issues.map(issue => {
              if (!issue.lat || !issue.lng) return null;
              
              // Filter logic boundaries check
              if (issue.lat < latMin || issue.lat > latMax || issue.lng < lngMin || issue.lng > lngMax) {
                return null;
              }

              const { x, y } = convertToCoords(issue.lat, issue.lng);
              const color = getPinColor(issue.status);
              const isSelected = selectedIssue?.id === issue.id;

              return (
                <g 
                  key={issue.id} 
                  cursor="pointer" 
                  onClick={() => setSelectedIssue(issue)}
                >
                  {/* Ripple pulse circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 16 : 8}
                    fill={color}
                    opacity="0.15"
                    className="pulse-effect"
                  >
                    <animate attributeName="r" values="6;18;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                  </circle>

                  {/* Inner pin point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={color}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#FFFFFF',
            zIndex: 10,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <span>Reported</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
              <span>Verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <span>In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>Resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Details HUD */}
      {selectedIssue && (
        <div style={{
          width: '350px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          gap: 16,
          boxShadow: '-4px 0 10px -5px rgba(0,0,0,0.05)',
          animation: 'slideIn 0.2s ease'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Selected Pin Node</span>
              <button 
                onClick={() => setSelectedIssue(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                ×
              </button>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginTop: 6, marginBottom: 2 }}>{selectedIssue.title}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block' }}>{selectedIssue.address}</span>
          </div>

          {selectedIssue.imageUrl && (
            <img 
              src={selectedIssue.imageUrl} 
              alt="Node visual" 
              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
            />
          )}

          <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 10, background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>
              {getCategoryIcon(selectedIssue.category)}
              <span>{selectedIssue.category.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 6 }}>
              <strong>Coordinates:</strong> {selectedIssue.lat.toFixed(4)}N, {selectedIssue.lng.toFixed(4)}E
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', marginTop: 4 }}>
              <strong>Status:</strong> {selectedIssue.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            <a 
              href={`/issue/${selectedIssue.id}`} 
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-1)',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              Inspect Public Portal <Navigation size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMapPage;
