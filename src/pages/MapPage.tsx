import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  AlertTriangle, Lightbulb, Droplet, Trash2, HelpCircle, 
  Layers, MapPin, Eye, Calendar, ArrowRight, X, ShieldAlert,
  PlusCircle, Loader, Map as MapIcon, Grid, BookOpen, Heart, Compass, 
  Zap, Briefcase, Award, Trees, Search, Filter, Share2, CheckCircle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Type definitions for GIS data structures
interface HotspotItem {
  id: string;
  theme: string;
  category: string;
  location: string;
  demandScore: number;
  priorityScore: number;
  populationImpact: string;
  count: number;
  aiRecommendation: string;
  confidence: string;
  department: string;
  governmentScheme: string;
  nearestSchoolHospital: string;
  lat: number;
  lng: number;
  supportingIssues: Array<{ title: string; address: string; status: string }>;
  isHotspot?: boolean;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core Data States
  const [issues, setIssues] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Layer States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [activeLayer, setActiveLayer] = useState<'demand' | 'signals' | 'hotspots' | 'infrastructure' | 'ldp' | 'completed'>('demand');
  const [mapMode, setMapMode] = useState<'openfreemap' | 'grid'>('openfreemap');

  // Selected Target state for Intelligence Side Panel
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);

  // Map Instance Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [hoveredSvgElement, setHoveredSvgElement] = useState<{ item: any; x: number; y: number } | null>(null);

  // Bangalore coordinate boundaries for SVG coordinate transformation
  const latMin = 12.9200;
  const latMax = 12.9950;
  const lngMin = 77.6000;
  const lngMax = 77.7700;

  // Convert GPS Coordinates to SVG Workspace (800x500)
  const convertToCoords = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 800;
    const y = 500 - (((lat - latMin) / (latMax - latMin)) * 500);
    return { x, y };
  };

  // Convert SVG Coordinates back to GPS Coordinates
  const convertToLatLng = (svgX: number, svgY: number) => {
    const lng = lngMin + (svgX / 800) * (lngMax - lngMin);
    const lat = latMin + ((500 - svgY) / 500) * (latMax - latMin);
    return { lat, lng };
  };

  // Fallback high-fidelity structured intelligence hotspots (Development Demands)
  const fallbackHotspots: HotspotItem[] = [
    {
      id: 'h1',
      theme: 'Primary Health Centre Ward 8',
      category: 'healthcare',
      location: 'Ward 8 - Southeast Transit Link',
      demandScore: 94,
      priorityScore: 96,
      populationImpact: '18,200 citizens',
      count: 482,
      aiRecommendation: 'Construct a Primary Health Centre to relieve pressure on the regional hospital located 14km away.',
      confidence: '94%',
      department: 'Ministry of Health & Family Welfare',
      governmentScheme: 'National Urban Health Mission (NUHM)',
      nearestSchoolHospital: 'St. John\'s Medical College Hospital (14.2 km)',
      lat: 12.9450,
      lng: 77.6350,
      supportingIssues: [
        { title: 'Sub-centre water pipeline leak', address: 'Southeast Ring road', status: 'reported' },
        { title: 'Emergency dispatch road blocked', address: 'Ward 8 Lane 4', status: 'investigating' }
      ]
    },
    {
      id: 'h2',
      theme: 'Central Smart Streetlighting Expansion',
      category: 'streetlight',
      location: 'Ward 8 Commercial Ring',
      demandScore: 88,
      priorityScore: 85,
      populationImpact: '12,500 residents',
      count: 124,
      aiRecommendation: 'Retrofit existing sodium-vapor lamps with dynamic smart LEDs to reduce nocturnal pedestrian risk zones.',
      confidence: '91%',
      department: 'Municipal Corporation Lighting Division',
      governmentScheme: 'Street Lighting National Programme (SLNP)',
      nearestSchoolHospital: 'Koramangala Public School (0.6 km)',
      lat: 12.9344,
      lng: 77.6255,
      supportingIssues: [
        { title: 'Dark lane behind central market', address: 'Commercial Ave', status: 'reported' },
        { title: 'Streetlight pole 42 broken wire', address: 'Block 3 Crossing', status: 'in-progress' }
      ]
    },
    {
      id: 'h3',
      theme: 'High-Stress Asphalt Pothole Corridor',
      category: 'pothole',
      location: 'Metro Main Highway corridor',
      demandScore: 85,
      priorityScore: 88,
      populationImpact: '24,000 daily commuters',
      count: 256,
      aiRecommendation: 'Re-surface high-stress asphalt segments using carbon-reinforced polymer composites to withstand monsoons.',
      confidence: '89%',
      department: 'Public Works Department (Roads Section)',
      governmentScheme: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
      nearestSchoolHospital: 'Whitefield Global School (1.8 km)',
      lat: 12.9620,
      lng: 77.7150,
      supportingIssues: [
        { title: 'Multiple deep craters near flyover descent', address: 'Highway Exit 4', status: 'reported' }
      ]
    },
    {
      id: 'h4',
      theme: 'Clean Solar Grid & Power Redundancy',
      category: 'electricity',
      location: 'Northeast Ward Center',
      demandScore: 78,
      priorityScore: 72,
      populationImpact: '6,800 residents',
      count: 82,
      aiRecommendation: 'Deploy secondary grid lines and install a centralized grid-tied 120kW solar canopy for power security.',
      confidence: '85%',
      department: 'State Power Distribution Corporation (BESCOM)',
      governmentScheme: 'Solar Rooftop Subsidy Scheme',
      nearestSchoolHospital: 'Columbia Asia Hospital (3.1 km)',
      lat: 12.9550,
      lng: 77.7400,
      supportingIssues: [
        { title: 'Frequent power cuts in Sector B', address: 'Avenue 2', status: 'reported' }
      ]
    }
  ];

  // Static Infrastructure assets
  const infrastructureAssets = [
    { id: 'i1', name: 'Ward 8 Government High School', category: 'education', location: 'Ward 8 West', lat: 12.9280, lng: 77.6150, description: 'Serves 620 local students. High structural rating.' },
    { id: 'i2', name: 'Metro South Transit Exchange', category: 'public transport', location: 'Commercial Ring Axis', lat: 12.9320, lng: 77.6220, description: 'Primary intermodal transfer node. 45k daily boardings.' },
    { id: 'i3', name: 'Vani Vilas Maternity Wing CA', category: 'healthcare', location: 'North Ward Ring', lat: 12.9600, lng: 77.7200, description: 'Affiliated civic outpatient clinic with neonatal coverage.' }
  ];

  // Static Local Development Plans (LDP)
  const ldpPlans = [
    { id: 'l1', name: 'Commercial Ring Road Expansion', budget: '₹4.2 Cr', status: 'Approved Planning', lat: 12.9360, lng: 77.6320, details: 'Widening of core arterial lane to alleviate commute bottle-necks.' },
    { id: 'l2', name: 'Northeast Stormwater Drainage Grid', budget: '₹1.8 Cr', status: 'Tendering Active', lat: 12.9692, lng: 77.7490, details: 'Construct concrete silt traps along low-elevation catchment areas.' }
  ];

  // Static Completed Projects
  const completedProjects = [
    { id: 'c1', name: 'Ward 8 Water Filtration Plant', date: 'May 2026', budget: '₹75 Lakhs', lat: 12.9390, lng: 77.6300, impact: '4,500 local residents supplied with clean reverse osmosis drinking water.' },
    { id: 'c2', name: 'Outer Ring Road Pothole Overhaul', date: 'June 2026', budget: '₹1.2 Cr', lat: 12.9620, lng: 77.7220, impact: '12,000 daily transiting commuters benefited from micro-surfaced asphalt repair.' }
  ];

  // Real-time synchronization from Firebase
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribeIssues = onSnapshot(collection(db, 'issues'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setIssues(list);
      setLoading(false);
    }, (err) => {
      console.error("Firestore loading issues failed:", err);
      setLoading(false);
    });

    const unsubscribeSuggestions = onSnapshot(collection(db, 'suggestions'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSuggestions(list);
    }, (err) => {
      console.error("Firestore loading suggestions failed:", err);
    });

    const unsubscribePredict = onSnapshot(collection(db, 'zonePredictions'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPredictions(list);
    }, (err) => {
      console.error("Firestore loading predictions failed:", err);
    });

    const unsubscribeClusters = onSnapshot(collection(db, 'clusters'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setClusters(list);
    }, (err) => {
      console.error("Firestore loading clusters failed:", err);
    });

    return () => {
      unsubscribeIssues();
      unsubscribeSuggestions();
      unsubscribePredict();
      unsubscribeClusters();
    };
  }, []);

  // Compute live mapped hotspots combining fallback items and dynamic Firestore clusters
  const getMappedHotspots = (): HotspotItem[] => {
    const liveMapped: HotspotItem[] = clusters.map((cl, index) => {
      // Find closest category icon matching themes
      const category = cl.category || 'infrastructure';
      return {
        id: cl.id || `live-${index}`,
        theme: cl.theme || `Cluster: ${cl.category || 'Infrastructure'} Demand`,
        category,
        location: cl.location || 'Multiple sectors mapped',
        demandScore: cl.priorityScore || 75,
        priorityScore: cl.priorityScore || 75,
        populationImpact: `${(cl.count || 2) * 1200} affected residents`,
        count: cl.count || 2,
        aiRecommendation: cl.aiSummary || 'Verify localized public proposals and schedule departmental engineering audit.',
        confidence: `${Math.min(99, 82 + (cl.count || 1))}%`,
        department: cl.category === 'streetlight' ? 'Lighting Division' : 'Public Works Department',
        governmentScheme: 'Municipal Capital Improvements Fund',
        nearestSchoolHospital: 'Local Community Health Centre (2.4 km)',
        lat: cl.lat || (12.93 + (index * 0.01)),
        lng: cl.lng || (77.62 + (index * 0.015)),
        supportingIssues: issues.filter(i => i.category === cl.category).slice(0, 3).map(i => ({
          title: i.title || 'Unresolved complaint',
          address: i.address || 'Street level',
          status: i.status || 'reported'
        })),
        isHotspot: true
      };
    });

    // Merge static GIS hotspots to ensure rich visualization by default
    return [...fallbackHotspots, ...liveMapped];
  };

  const allHotspots = getMappedHotspots();

  // Filter GIS Layers based on selection criteria
  const getFilteredItems = (layer: typeof activeLayer) => {
    const filterQueryLower = searchQuery.toLowerCase();

    const matchesFilter = (title: string, location: string, category: string) => {
      const matchesSearch = !searchQuery || 
        title.toLowerCase().includes(filterQueryLower) || 
        location.toLowerCase().includes(filterQueryLower);
      const matchesCategory = selectedCategory === 'all' || category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    };

    switch (layer) {
      case 'demand':
        return allHotspots.filter(h => matchesFilter(h.theme, h.location, h.category));
      case 'signals':
        return issues.filter(i => matchesFilter(i.title || i.description || 'Citizen Signal', i.address || '', i.category || ''));
      case 'hotspots':
        // Map Firestore predictions as AI Hotspots
        return predictions.filter(p => matchesFilter(p.sector || p.reason || 'AI Hotspot', p.sector || '', p.category || ''));
      case 'infrastructure':
        return infrastructureAssets.filter(i => matchesFilter(i.name, i.location, i.category));
      case 'ldp':
        return ldpPlans.filter(l => matchesFilter(l.name, l.details, 'general'));
      case 'completed':
        return completedProjects.filter(c => matchesFilter(c.name, c.impact, 'general'));
      default:
        return [];
    }
  };

  const filteredLayerItems = getFilteredItems(activeLayer);

  // Initialize MapLibre Map Canvas
  useEffect(() => {
    if (mapMode !== 'openfreemap') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const container = document.getElementById('openfreemap-canvas');
    if (!container) return;

    const mapInstance = new maplibregl.Map({
      container: 'openfreemap-canvas',
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      } as any,
      center: [77.6255, 12.9362], // Koramangala Bangalore
      zoom: 12.2,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = mapInstance;
    mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    mapInstance.on('click', () => {
      setContextMenu(null);
    });

    mapInstance.on('contextmenu', (e) => {
      e.preventDefault();
      setContextMenu({
        x: e.point.x,
        y: e.point.y,
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

  // Synchronize dynamic MapLibre Markers based on the selected Active Layer
  useEffect(() => {
    if (mapMode !== 'openfreemap' || !mapRef.current) return;

    const mapInstance = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Render Markers for Active Layer
    filteredLayerItems.forEach((item: any) => {
      if (!item.lat || !item.lng) return;

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.position = 'relative';

      let markerHTML = '';
      const isSelected = selectedHotspot?.id === item.id;

      if (activeLayer === 'demand') {
        const priorityColor = item.priorityScore >= 90 ? '#E11D48' : '#000000';
        markerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: ${28 + item.priorityScore * 0.2}px; height: ${28 + item.priorityScore * 0.2}px; background: ${priorityColor}; opacity: 0.15; border-radius: 50%; border: 1px dashed ${priorityColor}"></div>
            <div style="width: 14px; height: 14px; background: ${priorityColor}; border-radius: 50%; border: 2px solid #FFF; box-shadow: 0 2px 4px rgba(0,0,0,0.3)"></div>
            ${isSelected ? `<div style="position: absolute; width: 22px; height: 22px; border: 1.5px solid #000; border-radius: 50%"></div>` : ''}
          </div>
        `;
      } else if (activeLayer === 'signals') {
        const isResolved = item.status === 'resolved';
        const color = isResolved ? '#10B981' : '#E11D48';
        markerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%; border: 1.5px solid #FFF; box-shadow: 0 2px 4px rgba(0,0,0,0.2)"></div>
          </div>
        `;
      } else if (activeLayer === 'hotspots') {
        markerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; background: rgba(245, 158, 11, 0.15); border-radius: 50%; border: 1px dashed #F59E0B"></div>
            <div style="width: 10px; height: 10px; background: #F59E0B; border-radius: 50%; border: 1.5px solid #FFF"></div>
          </div>
        `;
      } else if (activeLayer === 'infrastructure') {
        markerHTML = `
          <div style="width: 24px; height: 24px; background: #3B82F6; border-radius: 4px; border: 1.5px solid #FFF; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">
            🏛️
          </div>
        `;
      } else if (activeLayer === 'ldp') {
        markerHTML = `
          <div style="width: 24px; height: 24px; background: #6B7280; border-radius: 4px; border: 1.5px solid #FFF; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">
            📋
          </div>
        `;
      } else if (activeLayer === 'completed') {
        markerHTML = `
          <div style="width: 20px; height: 20px; background: #10B981; border-radius: 50%; border: 1.5px solid #FFF; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 9px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3)">
            ✓
          </div>
        `;
      }

      el.innerHTML = markerHTML;

      // Handle marker click (Select target & smoothly zoom)
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handleItemSelection(item);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .addTo(mapInstance);

      markersRef.current.push(marker);
    });

  }, [filteredLayerItems, activeLayer, mapMode, selectedHotspot]);

  // Unified Item Selection Handler (Zooms Map & Hydrates Intelligence Side Panel)
  const handleItemSelection = (item: any) => {
    // Standardize selected item as HotspotItem schema for unified side panel rendering
    let normalizedItem: HotspotItem;

    if (activeLayer === 'demand') {
      normalizedItem = item;
    } else if (activeLayer === 'signals') {
      normalizedItem = {
        id: item.id,
        theme: item.title || 'Citizen Reported Hazard',
        category: item.category || 'pothole',
        location: item.address || 'Street Level Coordinates',
        demandScore: (item.severity || 3) * 15 + 10,
        priorityScore: (item.severity || 3) * 18,
        populationImpact: 'Local street corridor residents',
        count: (item.upvotes || []).length + 1,
        aiRecommendation: `Investigate immediate reported defect. Dispatch maintenance crew to ${item.address || 'GPS zone'}.`,
        confidence: '95% (Direct Citizen Report)',
        department: 'Urban Infrastructure Repair Squad',
        governmentScheme: 'Citizen Incident Resolution Portal',
        nearestSchoolHospital: 'Verification needed',
        lat: item.lat,
        lng: item.lng,
        supportingIssues: [{ title: item.title || 'Raw Complaint', address: item.address, status: item.status || 'reported' }]
      };
    } else if (activeLayer === 'hotspots') {
      normalizedItem = {
        id: item.id,
        theme: `Predictive Risk: ${item.category?.toUpperCase() || 'CIVIC'} sector strain`,
        category: item.category || 'general',
        location: item.sector || 'District Corridor Zone',
        demandScore: item.issueCount ? Math.min(100, item.issueCount * 12) : 82,
        priorityScore: item.riskLevel === 'critical' ? 95 : 78,
        populationImpact: 'Immediate residential block quadrant',
        count: item.issueCount || 3,
        aiRecommendation: item.reason || 'AI forecasting signals upcoming municipal resource overload. Pre-emptively assign structural backup assets.',
        confidence: '88% (Telemetry Trend Model)',
        department: 'Civic Risk Management Office',
        governmentScheme: 'Preventative Disaster & Infrastructure Mitigation',
        nearestSchoolHospital: 'District Central Station (2.1 km)',
        lat: item.lat,
        lng: item.lng,
        supportingIssues: []
      };
    } else if (activeLayer === 'infrastructure') {
      normalizedItem = {
        id: item.id,
        theme: item.name,
        category: item.category,
        location: item.location,
        demandScore: 100,
        priorityScore: 100,
        populationImpact: 'Sub-ward catchment',
        count: 1,
        aiRecommendation: item.description,
        confidence: 'Verified Physical Asset',
        department: 'Municipal Registrar of Assets',
        governmentScheme: 'State Public Infrastructure Register',
        nearestSchoolHospital: 'Co-located Asset',
        lat: item.lat,
        lng: item.lng,
        supportingIssues: []
      };
    } else if (activeLayer === 'ldp') {
      normalizedItem = {
        id: item.id,
        theme: item.name,
        category: 'general',
        location: 'Designated LDP Boundaries',
        demandScore: 80,
        priorityScore: 85,
        populationImpact: 'Entire constituency zone',
        count: 1,
        aiRecommendation: `${item.details}. Budget Allocation: ${item.budget}.`,
        confidence: 'Legislative Plan Target',
        department: 'Constituency Development Planning Board',
        governmentScheme: 'Five-Year Ward Capital Allocation Scheme',
        nearestSchoolHospital: 'Strategic Central Hub',
        lat: item.lat,
        lng: item.lng,
        supportingIssues: []
      };
    } else { // completed
      normalizedItem = {
        id: item.id,
        theme: item.name,
        category: 'general',
        location: 'Resolved Ward Outpost',
        demandScore: 0,
        priorityScore: 0,
        populationImpact: item.impact,
        count: 1,
        aiRecommendation: `Project completed on: ${item.date}. Budget spent: ${item.budget}.`,
        confidence: 'Closed Audit Verified',
        department: 'Municipal Works Inspectorate',
        governmentScheme: 'Fast-Track Civic Repairs Outlay',
        nearestSchoolHospital: 'Operations Area',
        lat: item.lat,
        lng: item.lng,
        supportingIssues: []
      };
    }

    setSelectedHotspot(normalizedItem);

    // Ease map viewport smoothly if using interactive OpenFreeMap tiles
    if (mapMode === 'openfreemap' && mapRef.current && item.lat && item.lng) {
      mapRef.current.easeTo({
        center: [item.lng, item.lat],
        zoom: 14.2,
        duration: 800
      });
    }
  };

  const handleExportSnapshot = () => {
    toast.success("GeoJSON intelligence data successfully saved to client buffer!");
  };

  const handleReportAtCoordinates = () => {
    if (contextMenu) {
      navigate('/report', { state: { lat: contextMenu.lat, lng: contextMenu.lng } });
      setContextMenu(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', overflow: 'hidden', background: 'var(--surface-2)' }}>
      
      {/* 🏛️ 1. INTELLIGENCE TOOLBAR: Sticky and high density */}
      <section 
        id="gis-toolbar"
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 45, 
          background: 'var(--surface)', 
          borderBottom: '1px solid var(--border)', 
          padding: '10px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '12px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-3)' }} />
            <input 
              type="text" 
              placeholder="Search thematic demand or sector..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border)', 
                borderRadius: '4px', 
                padding: '7px 12px 7px 32px', 
                fontSize: '12.5px', 
                outline: 'none', 
                color: 'var(--text-1)' 
              }}
            />
          </div>

          {/* Ward Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>WARD:</span>
            <select 
              value={selectedWard} 
              onChange={(e) => setSelectedWard(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Wards</option>
              <option value="ward-8">Ward 8 - Koramangala Central</option>
              <option value="ward-12">Ward 12 - Indiranagar East</option>
              <option value="ward-15">Ward 15 - Whitefield IT Corridor</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <Filter size={12} style={{ color: 'var(--text-3)' }} />
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Sectors</option>
              <option value="healthcare">Healthcare</option>
              <option value="streetlight">Lighting & Power</option>
              <option value="pothole">Road restoration</option>
              <option value="water">Water Utility</option>
            </select>
          </div>

          {/* Time Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <Calendar size={12} style={{ color: 'var(--text-3)' }} />
            <select 
              value={selectedTime} 
              onChange={(e) => setSelectedTime(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Time Logs</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Export / Render Modes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Map style toggler */}
          <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px', gap: '2px' }}>
            <button
              onClick={() => setMapMode('openfreemap')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '3px',
                background: mapMode === 'openfreemap' ? 'var(--primary)' : 'transparent',
                color: mapMode === 'openfreemap' ? '#FFF' : 'var(--text-1)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <MapIcon size={12} />
              GIS Map
            </button>
            <button
              onClick={() => setMapMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '3px',
                background: mapMode === 'grid' ? 'var(--primary)' : 'transparent',
                color: mapMode === 'grid' ? '#FFF' : 'var(--text-1)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Grid size={12} />
              SVG Schematic
            </button>
          </div>

          <button 
            onClick={handleExportSnapshot}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '4px', 
              padding: '6px 12px', 
              fontSize: '12px', 
              fontWeight: 600, 
              color: 'var(--text-1)', 
              cursor: 'pointer' 
            }}
          >
            <Share2 size={13} />
            Export Snapshot
          </button>
        </div>
      </section>

      {/* 📊 6. MINI INTELLIGENCE SUMMARY: 4 compact informational cards */}
      <section 
        id="mini-intelligence-summary"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '12px', 
          padding: '12px 24px', 
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Development Hotspots</span>
            <strong style={{ fontSize: '18px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{allHotspots.length} Sectors</strong>
          </div>
          <span style={{ fontSize: '16px' }}>🔥</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Highest Priority Ward</span>
            <strong style={{ fontSize: '18px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>Ward 8 (96/100)</strong>
          </div>
          <span style={{ fontSize: '16px' }}>📍</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Emerging Trend</span>
            <strong style={{ fontSize: '18px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>Water Supply (+142%)</strong>
          </div>
          <span style={{ fontSize: '16px' }}>⚡</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Infrastructure Gap</span>
            <strong style={{ fontSize: '18px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>Healthcare sector</strong>
          </div>
          <span style={{ fontSize: '16px' }}>🏥</span>
        </div>
      </section>

      {/* 🚀 PRIMARY CONTENT DIVISION: Map (70%) + Side Panel (30%) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: Map Area (70% width) */}
        <div style={{ flex: 7, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', overflow: 'hidden', padding: '16px', gap: '16px' }}>
          
          {/* 🗺️ 2. CONSTITUENCY INTELLIGENCE MAP WRAPPER */}
          <div 
            ref={mapContainerRef}
            style={{ 
              flex: 1, 
              position: 'relative', 
              background: '#FFFFFF', 
              border: '1.5px solid var(--border)', 
              borderRadius: '6px', 
              overflow: 'hidden' 
            }}
            onClick={() => setContextMenu(null)}
          >
            {mapMode === 'openfreemap' ? (
              <div id="openfreemap-canvas" style={{ width: '100%', height: '100%' }} />
            ) : (
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 800 500" 
                preserveAspectRatio="xMidYMid slice"
                onContextMenu={(e) => {
                  e.preventDefault();
                  const rect = mapContainerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    const svgX = (clickX / rect.width) * 800;
                    const svgY = (clickY / rect.height) * 500;
                    const { lat, lng } = convertToLatLng(svgX, svgY);
                    setContextMenu({ x: clickX, y: clickY, lat, lng });
                  }
                }}
                style={{ cursor: 'crosshair', userSelect: 'none', background: '#FFFFFF' }}
              >
                {/* Schematic Background Grid */}
                <defs>
                  <pattern id="schematic-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#schematic-map-grid)" />

                {/* Sub-Sector Outline Quadrants */}
                <polygon points="50,50 300,50 300,220 50,220" fill="rgba(0,0,0,0.01)" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="60" y="70" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">SECTOR: WARD 12 (INDIRANAGAR)</text>

                <polygon points="50,250 320,250 320,450 50,450" fill="rgba(0,0,0,0.01)" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="60" y="270" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">SECTOR: WARD 8 (KORAMANGALA)</text>

                <polygon points="360,100 750,100 750,420 360,420" fill="rgba(0,0,0,0.01)" stroke="var(--text-3)" strokeWidth="1" strokeDasharray="4,4" />
                <text x="370" y="120" fill="var(--text-3)" fontSize="9" fontFamily="var(--font-mono)">SECTOR: WARD 15 (WHITEFIELD IT AXIS)</text>

                {/* Road Arteries */}
                <path d="M 120,400 Q 250,300 420,240 T 700,180" fill="none" stroke="#D4D4D4" strokeWidth="2.5" />
                <text x="440" y="225" fill="var(--text-3)" fontSize="8" transform="rotate(-15, 440, 225)">HAL ROAD TRANSIT LINK</text>

                {/* Render Schematic Elements dynamically matching active Layer */}
                {filteredLayerItems.map((item: any, idx) => {
                  if (!item.lat || !item.lng) return null;
                  const coords = convertToCoords(item.lat, item.lng);
                  const isSelected = selectedHotspot?.id === item.id;

                  // Render layer indicators
                  if (activeLayer === 'demand') {
                    const priorityColor = item.priorityScore >= 90 ? '#E11D48' : '#000000';
                    return (
                      <g 
                        key={item.id} 
                        onClick={() => handleItemSelection(item)} 
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={(e) => setHoveredSvgElement({ item, x: coords.x, y: coords.y - 10 })}
                        onMouseLeave={() => setHoveredSvgElement(null)}
                      >
                        <circle cx={coords.x} cy={coords.y} r={14 + item.priorityScore * 0.1} fill={priorityColor} opacity="0.15" />
                        <circle cx={coords.x} cy={coords.y} r="5" fill={priorityColor} stroke="#FFF" strokeWidth="1.5" />
                        {isSelected && <circle cx={coords.x} cy={coords.y} r="9" fill="none" stroke="#000" strokeWidth="1.5" />}
                        <text x={coords.x} y={coords.y - 12} fill="var(--text-1)" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="var(--font-mono)">
                          {item.priorityScore}/100
                        </text>
                      </g>
                    );
                  }

                  if (activeLayer === 'signals') {
                    const isResolved = item.status === 'resolved';
                    const color = isResolved ? '#10B981' : '#E11D48';
                    return (
                      <g key={item.id} onClick={() => handleItemSelection(item)} style={{ cursor: 'pointer' }}>
                        <circle cx={coords.x} cy={coords.y} r="4" fill={color} stroke="#FFF" strokeWidth="1" />
                        {isSelected && <circle cx={coords.x} cy={coords.y} r="8" fill="none" stroke={color} strokeWidth="1.2" />}
                      </g>
                    );
                  }

                  if (activeLayer === 'hotspots') {
                    return (
                      <g key={item.id} onClick={() => handleItemSelection(item)} style={{ cursor: 'pointer' }}>
                        <rect x={coords.x - 15} y={coords.y - 15} width="30" height="30" fill="rgba(245, 158, 11, 0.15)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3,2" />
                        <circle cx={coords.x} cy={coords.y} r="3.5" fill="#F59E0B" />
                      </g>
                    );
                  }

                  if (activeLayer === 'infrastructure') {
                    return (
                      <g key={item.id} onClick={() => handleItemSelection(item)} style={{ cursor: 'pointer' }}>
                        <rect x={coords.x - 10} y={coords.y - 10} width="20" height="20" rx="3" fill="#3B82F6" stroke="#FFF" strokeWidth="1" />
                        <text x={coords.x} y={coords.y + 3} fill="#FFF" fontSize="8" textAnchor="middle" fontWeight="bold">🏛️</text>
                      </g>
                    );
                  }

                  if (activeLayer === 'ldp') {
                    return (
                      <g key={item.id} onClick={() => handleItemSelection(item)} style={{ cursor: 'pointer' }}>
                        <rect x={coords.x - 10} y={coords.y - 10} width="20" height="20" rx="3" fill="#6B7280" stroke="#FFF" strokeWidth="1" />
                        <text x={coords.x} y={coords.y + 3} fill="#FFF" fontSize="8" textAnchor="middle" fontWeight="bold">📋</text>
                      </g>
                    );
                  }

                  if (activeLayer === 'completed') {
                    return (
                      <g key={item.id} onClick={() => handleItemSelection(item)} style={{ cursor: 'pointer' }}>
                        <circle cx={coords.x} cy={coords.y} r="8" fill="#10B981" stroke="#FFF" strokeWidth="1" />
                        <text x={coords.x} y={coords.y + 3} fill="#FFF" fontSize="8" textAnchor="middle" fontWeight="bold">✓</text>
                      </g>
                    );
                  }

                  return null;
                })}
              </svg>
            )}

            {/* Hover tooltip for SVG map */}
            {hoveredSvgElement && (
              <div 
                style={{
                  position: 'absolute',
                  top: `${hoveredSvgElement.y}px`,
                  left: `${hoveredSvgElement.x}px`,
                  transform: 'translate(-50%, -100%)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 100
                }}
              >
                <strong>{hoveredSvgElement.item.theme || hoveredSvgElement.item.name}</strong>
              </div>
            )}

            {/* Right-Click Context Menu overlay */}
            {contextMenu && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: `${contextMenu.y}px`, 
                  left: `${contextMenu.x}px`, 
                  zIndex: 100,
                  padding: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: '180px'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    GPS: {contextMenu.lat.toFixed(4)}, {contextMenu.lng.toFixed(4)}
                  </span>
                  <button 
                    onClick={handleReportAtCoordinates}
                    style={{ 
                      background: 'var(--primary)', 
                      border: 'none', 
                      borderRadius: '4px', 
                      color: '#FFF', 
                      padding: '5px 8px', 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <PlusCircle size={12} />
                    Report Hazard Here
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🗳️ 3. LAYER CONTROL: Radio check strip (Exactly one layer emphasized at a time) */}
          <div 
            id="layer-selector"
            style={{ 
              display: 'flex', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: '4px', 
              padding: '4px', 
              gap: '4px',
              overflowX: 'auto'
            }}
          >
            {[
              { id: 'demand', label: 'Development Demand', count: allHotspots.length, desc: 'Hotspots generated from clusters & suggestions' },
              { id: 'signals', label: 'Citizen Signals', count: issues.length, desc: 'Raw citizen complaints & infrastructure faults' },
              { id: 'hotspots', label: 'AI Hotspots', count: predictions.length, desc: 'AI predicted hazard and outage outbreaks' },
              { id: 'infrastructure', label: 'Infrastructure', count: infrastructureAssets.length, desc: 'Active municipal clinics, schools, and transit nodes' },
              { id: 'ldp', label: 'Local Dev Plans (LDP)', count: ldpPlans.length, desc: 'Current 5-year municipal capital outlay lines' },
              { id: 'completed', label: 'Completed Projects', count: completedProjects.length, desc: 'Audit verified resolved works' }
            ].map((layer) => {
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => {
                    setActiveLayer(layer.id as any);
                    setSelectedHotspot(null);
                  }}
                  title={layer.desc}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '3px',
                    border: '1px solid ' + (isActive ? 'var(--primary)' : 'transparent'),
                    background: isActive ? 'var(--surface-2)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out',
                    minWidth: '130px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary)' : 'var(--text-2)' }}>
                    {layer.label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {layer.count} nodes
                  </span>
                </button>
              );
            })}
          </div>

          {/* 📢 5. AI RECOMMENDATION BANNER: Display exactly one grounded intelligence proposal */}
          <div 
            id="ai-recommendation-banner"
            style={{ 
              background: 'var(--surface)', 
              border: '1.5px solid var(--border)', 
              borderRadius: '6px', 
              padding: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: '16px' 
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '320px' }}>
              <div style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>💡</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    PRIORITY 96/100
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: 'var(--primary)', color: '#FFF', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    CONFIDENCE 94%
                  </span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-1)', margin: '4px 0' }}>
                  Construct a Primary Health Centre in Ward 8
                </h4>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--text-2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
                  <li>• 482 active citizen medical/utility requests</li>
                  <li>• Nearest PHC station is 14 km away</li>
                  <li>• Regional population index: 18,200 residents</li>
                  <li>• No healthcare project listed in current LDP</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  const healthcareHotspot = allHotspots.find(h => h.id === 'h1');
                  if (healthcareHotspot) {
                    handleItemSelection(healthcareHotspot);
                  } else {
                    toast.error("Healthcare details currently unavailable.");
                  }
                }}
                style={{ 
                  background: 'var(--surface-2)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '4px', 
                  color: 'var(--text-1)', 
                  padding: '6px 12px', 
                  fontSize: '11.5px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                View Details
              </button>
              <button 
                onClick={() => toast.success("Drafting capital allocation proposal under NUHM scheme...")}
                style={{ 
                  background: 'var(--primary)', 
                  border: 'none', 
                  borderRadius: '4px', 
                  color: '#FFF', 
                  padding: '6px 12px', 
                  fontSize: '11.5px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Generate Proposal
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: 4. Intelligence Side Panel (30% width) */}
        <div 
          id="intelligence-side-panel"
          style={{ 
            flex: 3, 
            background: 'var(--surface)', 
            display: 'flex', 
            flexDirection: 'column', 
            overflowY: 'auto',
            padding: '20px',
            gap: '16px',
            boxSizing: 'border-box'
          }}
        >
          {selectedHotspot ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Profile Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    GIS PROFILE SELECTED
                  </span>
                  <button 
                    onClick={() => setSelectedHotspot(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-1)' }}>
                  {selectedHotspot.theme}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginTop: '2px' }}>
                  📍 {selectedHotspot.location}
                </span>
              </div>

              {/* Core Score Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Priority Score</span>
                  <strong style={{ fontSize: '20px', color: selectedHotspot.priorityScore >= 90 ? '#E11D48' : 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                    {selectedHotspot.priorityScore}/100
                  </strong>
                </div>

                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '10px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Demand Score</span>
                  <strong style={{ fontSize: '20px', color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                    {selectedHotspot.demandScore}/100
                  </strong>
                </div>
              </div>

              {/* GIS Specifications List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Population Impact:</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedHotspot.populationImpact}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Citizen Requests Count:</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedHotspot.count} cases</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Nearest Hub:</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-2)' }}>{selectedHotspot.nearestSchoolHospital}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Confidence Index:</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--primary)' }}>{selectedHotspot.confidence}</span>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--primary)', padding: '12px', borderRadius: '0 4px 4px 0' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--primary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  AI Recommendation & Scope
                </span>
                <p style={{ margin: 0, fontSize: '11.5px', lineHeight: '1.4', color: 'var(--text-1)' }}>
                  {selectedHotspot.aiRecommendation}
                </p>
              </div>

              {/* Governance & Scheme Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-2)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Recommended Department</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedHotspot.department}</span>
                </div>
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block' }}>Suggested Government Scheme</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--primary)' }}>{selectedHotspot.governmentScheme}</span>
                </div>
              </div>

              {/* Supporting Citizen Evidence List */}
              {selectedHotspot.supportingIssues && selectedHotspot.supportingIssues.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-2)' }}>
                    Supporting Citizen Evidence ({selectedHotspot.supportingIssues.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedHotspot.supportingIssues.map((issue, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          background: 'var(--surface-2)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '4px', 
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px'
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-1)' }}>{issue.title}</strong>
                          <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>📍 {issue.address}</span>
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '3px', textTransform: 'uppercase', color: 'var(--text-2)' }}>
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button 
                  onClick={() => toast.success(`Generated official proposal for "${selectedHotspot.theme}"`)}
                  style={{ 
                    background: 'var(--primary)', 
                    border: 'none', 
                    borderRadius: '4px', 
                    color: '#FFF', 
                    padding: '8px', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Draft Capital Allocation Proposal
                </button>
                <button 
                  onClick={() => navigate('/recommendations')}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--border)', 
                    borderRadius: '4px', 
                    color: 'var(--text-2)', 
                    padding: '8px', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Open Decision Cockpit Workspace
                </button>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-3)', textAlign: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🛰️</span>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-2)' }}>Constituency Intelligence Node</h4>
                <p style={{ fontSize: '11.5px', color: 'var(--text-3)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                  Select an intelligence hotspot on the map to query planning metrics, population reach, and recommended schemes.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
