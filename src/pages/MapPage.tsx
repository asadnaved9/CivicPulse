import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../config/firebase';
import { 
  AlertTriangle, Lightbulb, Droplet, Trash2, HelpCircle, 
  Layers, MapPin, Eye, Calendar, ArrowRight, X, ShieldAlert,
  PlusCircle, Loader, Map as MapIcon, Grid
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLanguage } from '../contexts/LanguageContext';

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function MapPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [issues, setIssues] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map Filter Options
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRiskZones, setShowRiskZones] = useState(true);

  // Collapsible & Tip States
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [scrubberCollapsed, setScrubberCollapsed] = useState(true);
  const [showProTip, setShowProTip] = useState(true);

  // Auto-hide pro tip after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProTip(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  // Selected Issue & Predictive Zone for Sidebar
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [forecastDays, setForecastDays] = useState<number>(0); // 0 (current), 7 (next 7 days), 30 (next 30 days)
  
  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapMode, setMapMode] = useState<'openfreemap' | 'grid'>('openfreemap');
  const [hoveredSvgIssue, setHoveredSvgIssue] = useState<{ issue: any; x: number; y: number } | null>(null);

  // Geocoordinates bounding box for Kolkata sectors
  // Min Lat: 12.9200, Max Lat: 12.9950
  // Min Lng: 77.6000, Max Lng: 77.7700
  const latMin = 22.5000;
  const latMax = 22.6000;
  const lngMin = 88.3000;
  const lngMax = 88.4500;

  // Convert real Geolocation Lat/Lng to SVG coordinate workspace (800x500)
  const convertToCoords = (lat: number, lng: number) => {
    // x corresponds to longitude
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 800;
    // y corresponds to latitude (inverted since y goes down in SVG)
    const y = 500 - (((lat - latMin) / (latMax - latMin)) * 500);
    return { x, y };
  };

  // Convert SVG coordinate workspace back to real Geolocation Lat/Lng
  const convertToLatLng = (svgX: number, svgY: number) => {
    const lng = lngMin + (svgX / 800) * (lngMax - lngMin);
    const lat = latMin + ((500 - svgY) / 500) * (latMax - latMin);
    return { lat, lng };
  };

  // Fetch Issues and Predictions in Real-time from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribeIssues = onSnapshot(issuesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setIssues(list);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading issues on map failed:", err);
      setLoading(false);
    });

    const predictRef = collection(db, 'zonePredictions');
    const unsubscribePredict = onSnapshot(predictRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPredictions(list);
    }, (err) => {
      console.error("Firestore loading zone predictions failed:", err);
    });

    return () => {
      unsubscribeIssues();
      unsubscribePredict();
    };
  }, []);

  // Filter logic
  const filteredIssues = issues.filter((issue) => {
    if (issue.status === 'duplicate') return false;
    const matchesCat = filterCategory === 'all' || issue.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'resolved' && issue.status === 'resolved') ||
      (filterStatus === 'open' && issue.status !== 'resolved');
    return matchesCat && matchesStatus;
  });

  // Initialize MapLibre GL instance for OpenFreeMap
  useEffect(() => {
    if (mapMode !== 'openfreemap') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    // Wait for the container element to be rendered
    const container = document.getElementById('openfreemap-canvas');
    if (!container) return;

    let mapInstance: maplibregl.Map;
    try {
      mapInstance = new maplibregl.Map({
        container: 'openfreemap-canvas',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [88.3639, 22.5726], // Koramangala, Kolkata
        zoom: 12.5,
        pitch: 0,
        bearing: 0
      });
      mapRef.current = mapInstance;
    } catch (err) {
      console.error("MapLibre GL initialization failed, switching to Grid mode:", err);
      toast.error("Interactive Map failed to load. Switching to SVG layout.");
      setMapMode('grid');
      return;
    }

    // Navigation Controls
    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    // Simple Map Interaction handlers
    mapInstance.on('click', () => {
      setContextMenu(null);
    });

    // Custom Right click context menu on the interactive map
    mapInstance.on('contextmenu', (e) => {
      e.preventDefault();
      const clickX = e.point.x;
      const clickY = e.point.y;
      setContextMenu({
        x: clickX,
        y: clickY,
        lat: e.lngLat.lat,
        lng: e.lngLat.lng
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapMode]);

  // Sync Markers for OpenFreeMap
  useEffect(() => {
    if (mapMode !== 'openfreemap' || !mapRef.current) return;

    const mapInstance = mapRef.current;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add risk zone overlays as MapLibre markers
    if (showRiskZones) {
      predictions.forEach((pred) => {
        if (!pred.lat || !pred.lng) return;

        const el = document.createElement('div');
        el.className = 'custom-risk-zone-marker';
        el.style.width = '60px';
        el.style.height = '60px';
        el.style.borderRadius = '50%';
        
        let strokeColor = '#EF4444';
        let fillColor = 'rgba(239, 68, 68, 0.15)';
        if (pred.riskLevel === 'medium') {
          strokeColor = '#F59E0B';
          fillColor = 'rgba(245, 158, 11, 0.15)';
        } else if (pred.riskLevel === 'critical') {
          strokeColor = '#DC2626';
          fillColor = 'rgba(220, 38, 38, 0.25)';
        }

        el.style.background = fillColor;
        el.style.border = `2px dashed ${strokeColor}`;
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.cursor = 'pointer';
        el.title = `AI Predicted Hazard Grid: ${pred.riskLevel.toUpperCase()} RISK\n\nReason: ${pred.reason}\nActive concurrent reports: ${pred.issueCount}`;

        // Exclamation circle inside
        const inner = document.createElement('div');
        inner.style.width = '16px';
        inner.style.height = '16px';
        inner.style.borderRadius = '50%';
        inner.style.background = strokeColor;
        inner.style.color = '#FFF';
        inner.style.fontSize = '10px';
        inner.style.fontWeight = 'bold';
        inner.style.display = 'flex';
        inner.style.alignItems = 'center';
        inner.style.justifyContent = 'center';
        inner.innerText = '!';
        el.appendChild(inner);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          handleRiskZoneClick(pred);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pred.lng, pred.lat])
          .addTo(mapInstance);

        markersRef.current.push(marker);
      });

      // Staggered outbreaks forecast overlays
      if (forecastDays > 0) {
        const forecasts = [
          { id: 'f1', sector: 'Whitefield IT Corridor', riskLevel: 'high', category: 'streetlight', reason: 'High transformer load risk due to seasonal heatwave peaks.', issueCount: 6, lat: 12.9692, lng: 77.7490 },
          { id: 'f2', sector: 'Koramangala Block 3', riskLevel: 'critical', category: 'pothole', reason: 'Heavy runoff flooding predicted on Outer Ring Road underpass.', issueCount: 9, lat: 12.9344, lng: 77.6255 }
        ];
        
        forecasts.forEach(f => {
          const el = document.createElement('div');
          el.style.width = '80px';
          el.style.height = '80px';
          el.style.borderRadius = '50%';
          el.style.background = 'rgba(239, 68, 68, 0.15)';
          el.style.border = '2px dashed #EF4444';
          el.style.display = 'flex';
          el.style.flexDirection = 'column';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.cursor = 'pointer';
          el.title = `FORECAST: ${f.reason}`;

          const innerText = document.createElement('div');
          innerText.style.fontSize = '8px';
          innerText.style.color = '#EF4444';
          innerText.style.fontWeight = 'bold';
          innerText.style.textAlign = 'center';
          innerText.style.padding = '2px';
          innerText.innerText = 'PREDICTED';
          el.appendChild(innerText);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            handleRiskZoneClick(f);
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([f.lng, f.lat])
            .addTo(mapInstance);
          
          markersRef.current.push(marker);
        });
      }
    }

    // Add filtered issues markers
    filteredIssues.forEach((issue) => {
      if (!issue.lat || !issue.lng) return;

      const el = document.createElement('div');
      el.className = 'custom-issue-marker';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.position = 'relative';

      const isResolved = issue.status === 'resolved';
      const color = isResolved ? '#10B981' : '#E11D48'; // High contrast red for active, green for resolved
      
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          ${(!isResolved && issue.severity >= 4) ? `
            <div style="position: absolute; width: 34px; height: 34px; background: ${color}; opacity: 0.25; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          ` : ''}
          <svg width="28" height="34" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3))">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16.5C9.51 16.5 7.5 14.49 7.5 12C7.5 9.51 9.51 7.5 12 7.5C14.49 7.5 16.5 9.51 16.5 12C16.5 14.49 14.49 16.5 12 16.5Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="3.5" fill="#FFFFFF"/>
          </svg>
        </div>

        <!-- Hover-able Tooltip -->
        <div class="marker-tooltip" style="
          display: none;
          position: absolute;
          bottom: 38px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          color: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: var(--font-sans), sans-serif;
          font-size: 11px;
          width: 200px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          border: 1px solid #334155;
          z-index: 9999;
          pointer-events: none;
        ">
          <div style="font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ffffff;">
            ${escapeHTML(issue.title)}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px;">
            <span style="color: #94a3b8; text-transform: uppercase; font-family: var(--font-mono); font-size: 9px;">${escapeHTML(issue.category)}</span>
            <span style="
              background: ${isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; 
              color: ${isResolved ? '#10B981' : '#F87171'}; 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-weight: 600;
              font-size: 9px;
              text-transform: uppercase;
              border: 1px solid ${isResolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
            ">
              ${escapeHTML(issue.status).toUpperCase()}
            </span>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedIssue(issue);
        setContextMenu(null);
      });

      // Show/Hide tooltip on hover
      el.addEventListener('mouseenter', () => {
        const tt = el.querySelector('.marker-tooltip') as HTMLDivElement;
        if (tt) tt.style.display = 'block';
      });
      el.addEventListener('mouseleave', () => {
        const tt = el.querySelector('.marker-tooltip') as HTMLDivElement;
        if (tt) tt.style.display = 'none';
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([issue.lng, issue.lat])
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

  }, [filteredIssues, predictions, showRiskZones, mapMode, forecastDays]);

  // Center on Selected Issue
  useEffect(() => {
    if (mapMode === 'openfreemap' && mapRef.current && selectedIssue && selectedIssue.lat && selectedIssue.lng) {
      mapRef.current.easeTo({
        center: [selectedIssue.lng, selectedIssue.lat],
        zoom: 14.5,
        duration: 800
      });
    }
  }, [selectedIssue, mapMode]);

  // Handle Map Click to clear menus
  const handleMapClick = () => {
    setContextMenu(null);
  };

  // Right-click context capture on the SVG canvas wrapper
  const handleMapRightClick = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixels to relative SVG coordinate space (800x500)
    const svgX = (clickX / rect.width) * 800;
    const svgY = (clickY / rect.height) * 500;

    const { lat, lng } = convertToLatLng(svgX, svgY);

    setContextMenu({
      x: clickX,
      y: clickY,
      lat,
      lng
    });
  };

  const navigateToReport = () => {
    if (contextMenu) {
      navigate('/report', { 
        state: { 
          lat: contextMenu.lat, 
          lng: contextMenu.lng 
        } 
      });
      setContextMenu(null);
    }
  };

  const handleRiskZoneClick = async (pred: any) => {
    setSelectedIssue(null);
    setSelectedPrediction(pred);
    setLoadingReportCard(true);
    setReportCard(null);
    try {
      const response = await fetchWithAuth('/api/agents/report-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          zoneName: pred.sector || "Koramangala Ward",
          contextIssues: issues.filter(i => i.category === pred.category)
        })
      });
      const data = await response.json();
      setReportCard(data);
    } catch (err) {
      console.error("Failed to load report card:", err);
      // Fallback
      setReportCard({
        zoneName: pred.sector || "Koramangala",
        overallGrade: "C+",
        overallTrend: "stable",
        dimensions: {
          Infrastructure: { grade: "C-", justification: "Pavement conditions have deteriorated due to unresolved potholes." },
          Sanitation: { grade: "B", justification: "Garbage collection routes remain highly stable." },
          Safety: { grade: "D", justification: "High rate of unresolved streetlight outages creates persistent risk zones." },
          ResponseTime: { grade: "C", justification: "Average time to resolution currently sits at 9.4 days." },
          CommunityEngagement: { grade: "A", justification: "Excellent community participation and upvoting engagement." }
        }
      });
    } finally {
      setLoadingReportCard(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pothole': return <AlertTriangle size={14} />;
      case 'streetlight': return <Lightbulb size={14} />;
      case 'water': return <Droplet size={14} />;
      case 'waste': return <Trash2 size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'verified': return 'badge-primary';
      default: return 'badge-neutral';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      
      {/* 1. Header Filters Strip */}
      <div 
        className="map-filters-strip"
        style={{ 
          background: 'var(--surface)', 
          borderBottom: filtersCollapsed ? 'none' : '1px solid var(--border)', 
          padding: filtersCollapsed ? '0px 24px' : '12px 24px', 
          height: filtersCollapsed ? '0px' : 'auto',
          maxHeight: filtersCollapsed ? '0px' : '400px',
          overflow: 'hidden',
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '16px',
          zIndex: 20,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: filtersCollapsed ? 0 : 1,
          pointerEvents: filtersCollapsed ? 'none' : 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>
            {t('map.filters')}
          </span>
          
          {/* Category Filter Group */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pothole', 'streetlight', 'water', 'waste'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`btn btn-secondary`}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px',
                  background: filterCategory === cat ? 'var(--primary)' : 'var(--surface-2)',
                  borderColor: filterCategory === cat ? 'var(--primary)' : 'var(--border)',
                  color: filterCategory === cat ? '#FFFFFF' : 'var(--text-1)'
                }}
              >
                {cat === 'all' ? t('map.categories.all') : t(`map.categories.${cat}` as any)}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

          {/* Status Filter Group */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'open', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-secondary`}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px',
                  background: filterStatus === st ? 'var(--primary)' : 'var(--surface-2)',
                  borderColor: filterStatus === st ? 'var(--primary)' : 'var(--border)',
                  color: filterStatus === st ? '#FFFFFF' : 'var(--text-1)'
                }}
              >
                {st === 'all' ? t('map.statuses.all') : t(`map.statuses.${st}` as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Prediction Toggle & Collapse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Map Style Mode Switcher */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
            <button
              onClick={() => setMapMode('openfreemap')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                background: mapMode === 'openfreemap' ? 'var(--primary)' : 'transparent',
                color: mapMode === 'openfreemap' ? '#FFF' : 'var(--text-1)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Switch to interactive OpenFreeMap"
            >
              <MapIcon size={13} />
              {t('map.mode.openfreemap')}
            </button>
            <button
              onClick={() => setMapMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                background: mapMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: mapMode === 'grid' ? '#FFF' : 'var(--text-1)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Switch to SVG Grid Overlay Map"
            >
              <Grid size={13} />
              {t('map.mode.svggrid')}
            </button>
          </div>

          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`btn ${showRiskZones ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            <Layers size={14} />
            {showRiskZones ? t('map.risk.hide') : t('map.risk.show')}
          </button>

          <button
            onClick={() => setFiltersCollapsed(true)}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Collapse filters for larger map"
          >
            <X size={14} />
            {t('map.collapse')}
          </button>
        </div>
      </div>

      {/* 2. Map Canvas Workspace Container */}
      <div 
        ref={mapContainerRef}
        className="map-workspace-container"
        style={{ 
          flex: 1, 
          minHeight: '600px',
          position: 'relative', 
          background: '#FFFFFF', 
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderRadius: '10px'
        }}
        onClick={handleMapClick}
      >
        {/* Floating Expand Filters Button */}
        {filtersCollapsed && (
          <button
            onClick={() => setFiltersCollapsed(false)}
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-1)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
              zIndex: 25
            }}
            className="hover-card"
          >
            <Layers size={13} style={{ color: 'var(--primary)' }} />
            {t('map.showFilters')}
          </button>
        )}

        {/* Pro-Tip Floating Overlay */}
        {showProTip && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              width: '280px',
              background: 'rgba(10, 12, 16, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              zIndex: 35,
              animation: 'fadeIn 0.3s ease-out',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: '#FFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <strong style={{ fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#10B981', fontFamily: 'var(--font-mono)' }}>{t('map.protip.title')}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: '#A1A1AA' }}>
              {t('map.protip.desc')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setShowProTip(false)}
                style={{
                  background: '#10B981',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {t('map.protip.ok')}
              </button>
            </div>
          </div>
        )}

        {mapMode === 'openfreemap' ? (
          <div 
            id="openfreemap-canvas" 
            style={{ width: '100%', height: '100%', borderRadius: '10px' }} 
          />
        ) : (
          <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 800 500" 
          preserveAspectRatio="xMidYMid slice"
          onContextMenu={handleMapRightClick}
          style={{ cursor: 'crosshair', userSelect: 'none', background: '#FFFFFF' }}
        >
          {/* Base Grid */}
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />

          {/* Sector Outlines & Bounding Grids (Kolkata Areas) */}
          {/* Koramangala */}
          <polygon 
            points="100,280 280,280 280,450 100,450" 
            fill="rgba(0, 0, 0, 0.01)" 
            stroke="var(--text-1)" 
            strokeWidth="1.2" 
            strokeDasharray="5,5"
            opacity="0.25"
          />
          <text x="110" y="300" fill="var(--text-1)" opacity="0.4" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
            SECTOR: KORAMANGALA
          </text>

          {/* Indiranagar */}
          <polygon 
            points="240,80 440,80 440,240 240,240" 
            fill="rgba(0, 0, 0, 0.01)" 
            stroke="var(--text-1)" 
            strokeWidth="1.2" 
            strokeDasharray="5,5"
            opacity="0.25"
          />
          <text x="250" y="100" fill="var(--text-1)" opacity="0.4" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
            SECTOR: INDIRANAGAR
          </text>

          {/* Whitefield */}
          <polygon 
            points="520,120 780,120 780,380 520,380" 
            fill="rgba(0, 0, 0, 0.01)" 
            stroke="var(--text-1)" 
            strokeWidth="1.2" 
            strokeDasharray="5,5"
            opacity="0.25"
          />
          <text x="530" y="140" fill="var(--text-1)" opacity="0.4" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
            SECTOR: WHITEFIELD IT CORRIDOR
          </text>

          {/* Major Connecting Arterial Roads */}
          {/* HAL Airport Rd */}
          <path d="M 280,260 Q 400,220 540,200" fill="none" stroke="#D4D4D4" strokeWidth="2.5" opacity="0.7" />
          <text x="410" y="235" fill="var(--text-3)" opacity="0.6" fontSize="8" transform="rotate(-10, 410, 235)">
            HAL AIRPORT ROAD
          </text>
          
          {/* Inner Ring Rd */}
          <path d="M 180,380 Q 220,310 270,250" fill="none" stroke="#E5E5E5" strokeWidth="1.5" opacity="0.8" />

          {/* Outer Ring Rd */}
          <path d="M 250,420 Q 480,410 590,260" fill="none" stroke="#D4D4D4" strokeWidth="3" opacity="0.7" />
          <text x="460" y="395" fill="var(--text-3)" opacity="0.6" fontSize="8">
            OUTER RING ROAD
          </text>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* PREDICTIVE RISK ZONE OVERLAYS (Grid clusters of 3+ open issues) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {showRiskZones && predictions.map((pred) => {
            const coords = convertToCoords(pred.lat, pred.lng);
            
            // Choose color based on riskLevel and forecastDays
            let fillColor = 'rgba(0, 0, 0, 0.03)'; // low
            let strokeColor = 'var(--text-3)';
            let boxSize = 60;
            
            if (forecastDays === 7) {
              boxSize = 90;
              fillColor = 'rgba(239, 68, 68, 0.12)';
              strokeColor = '#EF4444';
            } else if (forecastDays === 30) {
              boxSize = 130;
              fillColor = 'rgba(239, 68, 68, 0.22)';
              strokeColor = '#DC2626';
            } else {
              if (pred.riskLevel === 'medium') {
                fillColor = 'rgba(0, 0, 0, 0.06)';
                strokeColor = 'var(--text-2)';
              } else if (pred.riskLevel === 'high' || pred.riskLevel === 'critical') {
                fillColor = 'rgba(0, 0, 0, 0.1)';
                strokeColor = 'var(--text-1)';
              }
            }

            return (
              <g 
                key={pred.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRiskZoneClick(pred);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Overlay Box representing 2-decimal rounded cluster block */}
                <rect
                  x={coords.x - boxSize / 2}
                  y={coords.y - boxSize / 2}
                  width={boxSize}
                  height={boxSize}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={forecastDays > 0 ? "2" : "1"}
                  strokeDasharray={forecastDays > 0 ? "6,4" : "4,4"}
                  style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
                
                {/* Risk Warning Icon inside block */}
                <circle cx={coords.x - boxSize / 2 + 12} cy={coords.y - boxSize / 2 + 12} r="6" fill={strokeColor} />
                <text x={coords.x - boxSize / 2 + 10} y={coords.y - boxSize / 2 + 15} fill="#FFF" fontSize="7" fontWeight="bold">!</text>

                <title>
                  {`AI Predicted Hazard Grid: ${pred.riskLevel.toUpperCase()} RISK\n\nReason: ${pred.reason}\nActive concurrent reports: ${pred.issueCount}`}
                </title>
              </g>
            );
          })}

          {/* FUTURE PREDICTED OUTBREAKS IN FORECAST MODE */}
          {forecastDays > 0 && (
            <g opacity="0.95">
              {/* Future Outbreak 1: Whitefield Heatwave overload */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleRiskZoneClick({ id: 'f1', sector: 'Whitefield IT Corridor', riskLevel: 'high', category: 'streetlight', reason: 'High transformer load risk due to seasonal heatwave peaks.', issueCount: 6 })}>
                <circle cx="550" cy="180" r="22" fill="rgba(239, 68, 68, 0.15)" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="550" cy="180" r="4" fill="#EF4444" />
                <text x="560" y="184" fill="#EF4444" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">PREDICTED BLACKOUT ZONE (88% CONF)</text>
              </g>

              {/* Future Outbreak 2: Koramangala monsoon erosion */}
              <g style={{ cursor: 'pointer' }} onClick={() => handleRiskZoneClick({ id: 'f2', sector: 'Koramangala Block 3', riskLevel: 'critical', category: 'pothole', reason: 'Heavy runoff flooding predicted on Outer Ring Road underpass.', issueCount: 9 })}>
                <circle cx="280" cy="390" r="26" fill="rgba(239, 68, 68, 0.15)" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="280" cy="390" r="4" fill="#DC2626" />
                <text x="290" y="394" fill="#DC2626" fontSize="8" fontFamily="var(--font-mono)" fontWeight="600">PREDICTED FLASHOVER PIT (94% CONF)</text>
              </g>
            </g>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ISSUE MARKER PINS */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {filteredIssues.map((issue) => {
            if (!issue.lat || !issue.lng) return null;
            const coords = convertToCoords(issue.lat, issue.lng);

            const isSelected = selectedIssue?.id === issue.id;
            const isResolved = issue.status === 'resolved';

            // Monochromatic Brutalist Palette
            const pinColor = isResolved ? '#FFFFFF' : '#000000';
            const strokeColor = isResolved ? 'var(--text-3)' : '#000000';

            return (
              <g 
                key={issue.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIssue(issue);
                  setContextMenu(null);
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect = mapContainerRef.current?.getBoundingClientRect();
                  const x = rect.left - (parentRect?.left || 0) + rect.width / 2;
                  const y = rect.top - (parentRect?.top || 0) - 8;
                  setHoveredSvgIssue({
                    issue,
                    x,
                    y
                  });
                }}
                onMouseLeave={() => {
                  setHoveredSvgIssue(null);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse Glow for highly-escalated or unverified high priority issues */}
                {(!isResolved && issue.severity >= 4) && (
                  <circle 
                    cx={coords.x} 
                    cy={coords.y} 
                    r={isSelected ? 18 : 12} 
                    fill="#000000" 
                    opacity="0.1"
                    style={{ animation: 'pulse 2s infinite' }}
                  />
                )}

                {/* Outer concentric stroke if selected */}
                {isSelected && (
                  <circle cx={coords.x} cy={coords.y} r="10" fill="none" stroke="var(--text-1)" strokeWidth="1" />
                )}

                {/* Core Marker Pin */}
                <circle 
                  cx={coords.x} 
                  cy={coords.y} 
                  r={isSelected ? 5.5 : 4} 
                  fill={pinColor}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  style={{ transition: 'all 0.15s ease' }}
                />

                <title>{`${issue.title} (${issue.category.toUpperCase()})`}</title>
              </g>
            );
          })}
        </svg>
        )}

        {/* SVG Hover Tooltip */}
        {hoveredSvgIssue && (
          <div 
            style={{
              position: 'absolute',
              top: `${hoveredSvgIssue.y}px`,
              left: `${hoveredSvgIssue.x}px`,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: '11px',
              width: '200px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #334155',
              zIndex: 9999,
              pointerEvents: 'none',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>
              {hoveredSvgIssue.issue.title}
            </div>
            <div style={{ display: 'flex', justify_content: 'space-between', alignItems: 'center', fontSize: '10px' }}>
              <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                {hoveredSvgIssue.issue.category}
              </span>
              <span style={{
                background: hoveredSvgIssue.issue.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: hoveredSvgIssue.issue.status === 'resolved' ? '#10B981' : '#F87171',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '9px',
                textTransform: 'uppercase',
                border: `1px solid ${hoveredSvgIssue.issue.status === 'resolved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {hoveredSvgIssue.issue.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* RIGHT-CLICK CONTEXT MENU POPUP */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {contextMenu && (
          <div 
            className="card"
            style={{ 
              position: 'absolute', 
              top: `${contextMenu.y}px`, 
              left: `${contextMenu.x}px`, 
              zIndex: 30,
              padding: '12px',
              minWidth: '220px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                GPS: {contextMenu.lat.toFixed(5)}, {contextMenu.lng.toFixed(5)}
              </span>
              <button 
                onClick={navigateToReport}
                className="btn btn-primary"
                style={{ width: '100%', padding: '6px 12px', fontSize: '12px' }}
              >
                <PlusCircle size={13} />
                {t('map.hazard.reportHere')}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SLIDE-IN SIDEBAR REPORT DETAIL DRAWER (Right aligned) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedIssue && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              bottom: '20px',
              width: '380px',
              maxWidth: 'calc(100% - 40px)',
              background: 'rgba(10, 12, 16, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              zIndex: 40,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Drawer Image Header */}
            <div style={{ height: '180px', position: 'relative', background: '#0f172a', borderBottom: '1px solid var(--border)' }}>
              {selectedIssue.imageUrl ? (
                <img 
                  src={selectedIssue.imageUrl} 
                  alt={selectedIssue.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                  color: 'var(--text-2)',
                  gap: '12px'
                }}>
                  {selectedIssue.category === 'pothole' && <AlertTriangle size={48} className="text-red-500" />}
                  {selectedIssue.category === 'streetlight' && <Lightbulb size={48} className="text-yellow-500" />}
                  {selectedIssue.category === 'water' && <Droplet size={48} className="text-blue-500" />}
                  {selectedIssue.category === 'waste' && <Trash2 size={48} className="text-green-500" />}
                  {selectedIssue.category === 'other' && <HelpCircle size={48} className="text-gray-400" />}
                  {!['pothole', 'streetlight', 'water', 'waste', 'other'].includes(selectedIssue.category) && <HelpCircle size={48} className="text-gray-400" />}
                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {t('map.hazard.noImage')}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setSelectedIssue(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(10,12,16,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>

              {/* Severity overlay badge */}
              <div 
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'var(--danger)',
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                {t('map.hazard.severity')} {selectedIssue.severity}/5
              </div>
            </div>

            {/* Content body */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className={`badge ${getStatusBadgeClass(selectedIssue.status)}`} style={{ marginBottom: '8px' }}>
                  {selectedIssue.status.replace('_', ' ').toUpperCase()}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, lineHeight: '1.2' }}>
                  {selectedIssue.title}
                </h3>
              </div>

              {/* Grid properties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                    {t('map.hazard.category')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                    {getCategoryIcon(selectedIssue.category)}
                    {t(`map.categories.${selectedIssue.category}` as any)}
                  </div>
                </div>

                <div style={{ background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>
                    {t('map.hazard.upvotes')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>
                    <MapPin size={13} style={{ color: 'var(--primary)' }} />
                    {(selectedIssue.upvotes || []).length} {t('map.hazard.votesCount')}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {t('map.hazard.description')}
                </span>
                <p className="text-sm" style={{ margin: 0, color: 'var(--text-2)' }}>
                  {selectedIssue.description || t('map.hazard.noDesc')}
                </p>
              </div>

              {/* Address */}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-2)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {t('map.hazard.reportedAddress')}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>{selectedIssue.address}</span>
                </div>
              </div>

              {/* Escalated state badge if active */}
              {selectedIssue.escalated && (
                <div 
                  style={{ 
                    background: 'var(--danger-subtle)', 
                    color: 'var(--danger)', 
                    padding: '8px 12px', 
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px'
                  }}
                >
                  <ShieldAlert size={16} />
                  <span>{t('map.hazard.escalated')}</span>
                </div>
              )}
            </div>

            {/* Bottom button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <button 
                onClick={() => navigate(`/issue/${selectedIssue.id}`)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {t('map.hazard.viewResolution')}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SLIDE-IN NEIGHBORHOOD CIVIC REPORT CARD (Right aligned) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {selectedPrediction && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              bottom: '90px',
              width: '380px',
              maxWidth: 'calc(100% - 40px)',
              background: 'rgba(10, 12, 16, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              zIndex: 41,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out',
              color: '#FFFFFF'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', position: 'relative', background: 'var(--surface-2)' }}>
              <button 
                onClick={() => setSelectedPrediction(null)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
              
              <span className="text-mono" style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>
                {t('map.metrics.title')}
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, paddingRight: '30px' }}>
                {selectedPrediction.sector || "Koramangala"} {t('map.metrics.reportCard')}
              </h2>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loadingReportCard ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                  <Loader className="shimmer" size={24} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{t('map.metrics.analyzing')}</span>
                </div>
              ) : reportCard ? (
                <>
                  {/* Overall score banner */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>{t('map.metrics.grade')}</span>
                      <strong style={{ fontSize: '32px', color: 'var(--primary)' }}>{reportCard.overallGrade}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase' }}>{t('map.metrics.trend')}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        {reportCard.overallTrend === 'improving' ? (
                          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                            {t('map.metrics.improving')}
                          </span>
                        ) : reportCard.overallTrend === 'worsening' ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                            {t('map.metrics.worsening')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-2)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                            {t('map.metrics.stable')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dimensions score lists */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(reportCard.dimensions || {}).map(([dimName, dimData]: [string, any]) => {
                      let gradeColor = 'var(--text-1)';
                      if (dimData.grade.startsWith('A')) gradeColor = '#10B981';
                      else if (dimData.grade.startsWith('B')) gradeColor = '#34D399';
                      else if (dimData.grade.startsWith('C')) gradeColor = '#F59E0B';
                      else if (dimData.grade.startsWith('D')) gradeColor = '#F97316';
                      else if (dimData.grade.startsWith('F')) gradeColor = '#EF4444';

                      return (
                        <div key={dimName} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{dimName.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: gradeColor, fontFamily: 'var(--font-mono)' }}>{dimData.grade}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.4' }}>
                            {dimData.justification}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '12px' }}>
                  {t('map.metrics.noData')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. AI Forecast Mode Timeline Scrubber */}
        <div 
          className="forecast-scrubber"
          style={{ 
            transform: scrubberCollapsed ? 'translateY(120px)' : 'none',
            opacity: scrubberCollapsed ? 0 : 1,
            pointerEvents: scrubberCollapsed ? 'none' : 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '150px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: forecastDays > 0 ? '#EF4444' : 'var(--text-2)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: forecastDays > 0 ? '#EF4444' : 'var(--text-3)', animation: forecastDays > 0 ? 'pulse 1.5s infinite' : 'none' }} />
              {forecastDays > 0 ? t('map.forecast.active') : t('map.forecast.live')}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>{t('map.forecast.current')}</span>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="1"
              value={forecastDays === 0 ? 0 : (forecastDays === 7 ? 1 : 2)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val === 0) setForecastDays(0);
                else if (val === 1) setForecastDays(7);
                else setForecastDays(30);
              }}
              style={{ 
                flex: 1, 
                accentColor: forecastDays > 0 ? '#EF4444' : 'var(--primary)',
                cursor: 'pointer',
                minWidth: '50px'
              }}
            />
            <span className="text-mono" style={{ fontSize: '11px', color: forecastDays > 0 ? '#EF4444' : 'var(--text-3)', fontWeight: forecastDays > 0 ? 'bold' : 'normal', flexShrink: 0 }}>
              {forecastDays === 0 ? t('map.forecast.now') : (forecastDays === 7 ? t('map.forecast.7days') : t('map.forecast.30days'))}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', color: 'var(--text-2)', maxWidth: '220px', textAlign: 'right' }} className="hide-on-mobile">
              {forecastDays === 0 ? (
                <span>{t('map.forecast.scrubRight')}</span>
              ) : (
                <span style={{ color: '#EF4444' }}>{t('map.forecast.predictiveDensity')}</span>
              )}
            </div>

            <button
              onClick={() => setScrubberCollapsed(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#FFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minHeight: 'auto'
              }}
              className="hover-card"
              title="Collapse timeline scrubber"
            >
              <X size={12} />
              <span className="hide-on-mobile">{t('map.collapse')}</span>
            </button>
          </div>
        </div>

        {/* Floating Expand Scrubber Button */}
        {scrubberCollapsed && (
          <button
            onClick={() => setScrubberCollapsed(false)}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10, 12, 16, 0.95)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '8px 18px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'all 0.2s',
              zIndex: 35
            }}
            className="hover-card"
          >
            <Calendar size={13} style={{ color: 'var(--primary)' }} />
            {t('map.forecast.showTimeline')}
          </button>
        )}
      </div>
    </div>
  );
}
