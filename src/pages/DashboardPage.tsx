import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, onSnapshot, updateDoc, query, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import {
  Award, ShieldAlert, CloudSun, Camera, Mic, Map as MapIcon,
  HelpCircle, ThumbsUp, Bell, Settings, MapPin, FileText, Droplets, Trees,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LocalitySelect from '../components/LocalitySelect';
import { encodeGeohash } from '../utils/geohash';
import { Locality } from '../utils/localities';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Helper: get time-based greeting key ──────────────────────────────────
function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.greeting.morning';
  if (h < 17) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Location & Weather
  const [locality, setLocality] = useState<Locality | null>(null);
  const [geohash, setGeohash] = useState<string>('');
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [weatherAlert, setWeatherAlert] = useState<any | null>(null);
  const [activeHazards, setActiveHazards] = useState<any[]>([]);
  const [showLocalityModal, setShowLocalityModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, open: 0, resolved: 0, verified: 0, avgSeverity: 3 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [resolutions, setResolutions] = useState<any[]>([]);

  // Achievements
  const achievements = [
    { id: 'bench', title: t('dashboard.achievement.bench'), icon: 'park', likes: 24, liked: false },
    { id: 'pipe',  title: t('dashboard.achievement.pipe'),  icon: 'water', likes: 11, liked: false },
  ];

  // ── Fetch weather ───────────────────────────────────────────────────────
  const fetchWeatherData = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );
      if (res.ok) setWeatherData(await res.json());
    } catch (err) { console.error('Weather fetch failed:', err); }
  };

  // ── Init location + load data ──────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }

    const initLocation = async () => {
      const profileAny = profile as any;

      if (profileAny?.lat && profileAny?.lng) {
        const name = profileAny.localityName || 'Registered Location';
        const loc: Locality = { name, lat: profileAny.lat, lng: profileAny.lng, city: 'Detected' };
        setLocality(loc);
        const hash = encodeGeohash(profileAny.lat, profileAny.lng, 5);
        setGeohash(hash);
        localStorage.setItem('civicpulse_locality', JSON.stringify(loc));
        fetchWeatherData(profileAny.lat, profileAny.lng);
        return;
      }

      const saved = localStorage.getItem('civicpulse_locality');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLocality(parsed);
          setGeohash(encodeGeohash(parsed.lat, parsed.lng, 5));
          fetchWeatherData(parsed.lat, parsed.lng);
        } catch { /* ignore */ }
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const hash = encodeGeohash(lat, lng, 5);
            let name = 'Detected Location';
            try {
              const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.address) name = geoData.address.split(',')[0] || name;
              }
            } catch { /* ignore */ }
            const loc: Locality = { name, lat, lng, city: 'Detected' };
            setLocality(loc);
            setGeohash(hash);
            localStorage.setItem('civicpulse_locality', JSON.stringify(loc));
            fetchWeatherData(lat, lng);
            if (user?.uid) {
              try { await updateDoc(doc(db, 'users', user.uid), { lat, lng, geohash: hash, localityName: name }); }
              catch { /* ignore */ }
            }
          },
          () => setShowLocalityModal(true),
          { timeout: 4000 }
        );
      } else {
        setShowLocalityModal(true);
      }
    };

    initLocation();

    const loadData = async () => {
      try {
        // Area summary
        const cached = sessionStorage.getItem('civicpulse_area_summary');
        const cachedT = sessionStorage.getItem('civicpulse_area_summary_time');
        const now = Date.now();
        if (!cached || !cachedT || now - parseInt(cachedT) > 600_000) {
          const snap = await getDoc(doc(db, 'analytics', 'summary'));
          if (snap.exists()) {
            const txt = snap.data().summaryText;
            sessionStorage.setItem('civicpulse_area_summary', txt);
            sessionStorage.setItem('civicpulse_area_summary_time', now.toString());
          }
        }

        // Health score
        const hSnap = await getDoc(doc(db, 'analytics', 'healthScore'));
        if (hSnap.exists()) {
          const d = hSnap.data();
          setStats({ total: d.totalIssues || 0, open: d.openCount || 0, resolved: d.resolvedCount || 0, verified: d.verifiedCount || 0, avgSeverity: d.avgSeverity || 3 });
        }

        // Issues
        const iSnap = await getDocs(collection(db, 'issues'));
        const active: any[] = [], resolved: any[] = [];
        iSnap.docs.forEach(d => {
          const iss = d.data();
          if (iss.status === 'duplicate') return;
          const obj = { id: d.id, ...iss };
          iss.status === 'resolved' ? resolved.push(obj) : active.push(obj);
        });
        resolved.sort((a, b) => (b.resolvedAt?.seconds || 0) - (a.resolvedAt?.seconds || 0));
        active.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setResolutions(resolved.slice(0, 3));
        setActiveIssues(active.slice(0, 2));

        // Leaderboard
        const uSnap = await getDocs(collection(db, 'users'));
        const users = uSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        users.sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
        setLeaderboard(users.slice(0, 5));
      } catch (err) { console.error('Dashboard data load error:', err); }
      finally { setLoading(false); }
    };

    loadData();
  }, [user, profile]);

  // Real-time weather alert
  useEffect(() => {
    if (!geohash || !isFirebaseConfigured) return;
    const ref = doc(db, 'weather_alerts', geohash);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const d = snap.data();
        setWeatherAlert(d);
        if ((d.severity === 'high' || d.severity === 'critical') && Notification.permission === 'granted') {
          new Notification('CRITICAL FLOOD WARNING', { body: d.advisoryText, icon: '/favicon.ico' });
        }
      } else { setWeatherAlert(null); }
    }, () => { /* ignore */ });
    return () => unsub();
  }, [geohash]);

  // Real-time geofenced active hazard alerts
  useEffect(() => {
    if (!geohash || !isFirebaseConfigured) return;
    const q = query(
      collection(db, 'issues'),
      where('geohash', '==', geohash)
    );
    const unsub = onSnapshot(q, snap => {
      const hazards: any[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        const isActive = data.status !== 'resolved' && data.status !== 'duplicate' && data.status !== 'rejected';
        const isCritical = Number(data.severity) >= 4;
        if (isActive && isCritical) {
          hazards.push({ id: doc.id, ...data });
        }
      });
      
      // Notify the user via toast on new critical hazard detection
      if (hazards.length > activeHazards.length) {
        const newHazards = hazards.filter(h => !activeHazards.some(ah => ah.id === h.id));
        newHazards.forEach(h => {
          toast.error(`⚠️ HAZARD ALERT: ${h.title || 'Critical Issue'} detected nearby!`, {
            duration: 6000
          });
        });
      }
      setActiveHazards(hazards);
    }, err => {
      console.error('Error listening to geofenced hazards:', err);
    });
    return () => unsub();
  }, [geohash, activeHazards.length]);

  const handleUpvote = (id: string) => {
    toast.success(t('dashboard.news.supported'));
  };

  const handleLocalitySelect = async (loc: Locality) => {
    setLocality(loc);
    const hash = encodeGeohash(loc.lat, loc.lng, 5);
    setGeohash(hash);
    localStorage.setItem('civicpulse_locality', JSON.stringify(loc));
    fetchWeatherData(loc.lat, loc.lng);
    setShowLocalityModal(false);
    if (user?.uid && isFirebaseConfigured) {
      try { await updateDoc(doc(db, 'users', user.uid), { lat: loc.lat, lng: loc.lng, geohash: hash, localityName: loc.name }); }
      catch { /* ignore */ }
    }
  };

  // Derived values
  const userPoints   = profile?.points ?? 450;
  const userLevel    = Math.floor(userPoints / 100) + 1;
  const reportsCount = stats.total || 14;
  const resolvedCount= stats.resolved || 12;

  // SVG ring
  const R = 58;
  const C = 2 * Math.PI * R;
  const rate = reportsCount > 0 ? resolvedCount / reportsCount : 0.8;
  const offset = C - rate * C;

  // ── Inline style tokens ─────────────────────────────────────────────────
  const css = {
    page: { minHeight: '100vh', padding: '24px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', backgroundColor: 'var(--bg)', color: 'var(--text-1)' } as React.CSSProperties,
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: 16, marginBottom: 32 },
    h1: { fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0 },
    locRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--text-2)', fontSize: 13 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    weatherPill: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)', fontSize: 12, fontWeight: 500 },
    iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer' },
    // Alert
    alertBox: (sev: string) => ({ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16, marginBottom: 24, borderRadius: 10, border: `1px solid ${sev === 'critical' || sev === 'high' ? 'var(--danger)' : 'var(--warning)'}`, backgroundColor: 'var(--surface-2)' }),
    alertIcon: (sev: string) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', backgroundColor: sev === 'critical' || sev === 'high' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0, color: '#fff' }),
    // Grid (moved to CSS classes)
    grid: {},
    span8: {},
    span4: {},
    span12: {},
    // Impact card
    impactCard: { borderRadius: 14, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 24, position: 'relative' as const, overflow: 'hidden', backgroundColor: 'var(--primary)' },
    impactLeft: { flex: 1, minWidth: 200 },
    impactH2: { fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 8px' },
    impactP: { fontSize: 13, color: 'rgba(255,255,255,0.85)', maxWidth: 380, margin: '0 0 16px', lineHeight: 1.6 },
    statsRow: { display: 'flex', gap: 0, alignItems: 'center' },
    statNum: { fontSize: 40, fontWeight: 800, color: '#fff', margin: '0 0 2px' },
    statLabel: { fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', margin: 0 },
    statDivider: { width: 1, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 24px' },
    ringWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 12 },
    ringAbsolute: { position: 'absolute' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' },
    ringPoints: { fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 },
    ringLabel: { fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#fff', fontWeight: 600 },
    levelBadge: { fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 999, color: '#fff' },
    // Report panel
    reportPanel: { borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 16, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', height: '100%', boxSizing: 'border-box' as const },
    reportBtn: { width: '100%', borderRadius: 12, padding: '24px 16px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, backgroundColor: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' },
    voiceRow: { textAlign: 'center' as const },
    voiceBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' },
    // Nav grid
    navGrid: {},
    navCard: { borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', transition: 'transform 0.15s', textAlign: 'left' as const },
    navIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 10, backgroundColor: 'var(--primary)', flexShrink: 0 },
    navLabel: { fontWeight: 600, fontSize: 14, color: 'var(--text-1)' },
    // Active reports
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: 0 },
    viewAll: { fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' },
    reportsGrid: {},
    issueCard: { borderRadius: 14, padding: 20, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', transition: 'transform 0.15s' },
    issueTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusBadge: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 999, backgroundColor: 'var(--primary)', color: '#fff' },
    issueDate: { fontSize: 12, color: 'var(--text-3)' },
    issueTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    issueDesc: { fontSize: 12, color: 'var(--text-2)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' },
    slaRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, marginTop: 12 },
    slaTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'var(--surface-2)', overflow: 'hidden' },
    slaFill: (w: string) => ({ height: '100%', borderRadius: 3, backgroundColor: 'var(--primary)', width: w }),
    emptyCard: { gridColumn: 'span 2', borderRadius: 14, padding: 32, border: '1px dashed var(--border)', backgroundColor: 'var(--surface)', textAlign: 'center' as const, color: 'var(--text-3)', fontSize: 13 },
    // Ward / Local news
    wardCard: { borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 16, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', height: '100%', boxSizing: 'border-box' as const },
    wardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 },
    wardImg: { borderRadius: 8, overflow: 'hidden', height: 160, border: '1px solid var(--border)' },
    happeningLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: 'var(--text-3)', margin: '4px 0 8px' },
    achRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', transition: 'background 0.15s', marginBottom: 8 },
    achLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    achTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-1)' },
    likeBtn: (liked: boolean) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--primary)', backgroundColor: liked ? 'var(--primary)' : 'transparent', color: liked ? 'var(--bg)' : 'var(--primary)', cursor: 'pointer', transition: 'all 0.15s' }),
    // Success stories
    storiesGrid: {},
    storyCard: { borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' },
    storyImgRow: { display: 'flex', height: 192 },
    storyHalf: { flex: 1, position: 'relative' as const, overflow: 'hidden' },
    storyLabel: (variant: 'before' | 'after') => ({ position: 'absolute' as const, top: 8, left: 8, padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#fff', backgroundColor: variant === 'before' ? 'rgba(0,0,0,0.55)' : 'var(--primary)' }),
    storyInfo: { padding: 16 },
    storyTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' },
    storyDesc: { fontSize: 12, color: 'var(--text-2)', margin: 0 },
    // Leaderboard
    lbCard: { borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 16, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', height: '100%', boxSizing: 'border-box' as const },
    lbHeader: { display: 'flex', alignItems: 'center', gap: 8 },
    lbTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 },
    lbSub: { fontSize: 12, color: 'var(--text-3)', margin: 0 },
    lbRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' },
    lbLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    lbRank: { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', width: 16, textAlign: 'center' as const },
    lbAvatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' as const, border: '1px solid var(--border)' },
    lbName: { fontSize: 12, fontWeight: 700, color: 'var(--text-1)' },
    lbBadge: { fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: 'var(--text-3)' },
    lbPts: { fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <span style={{ color: 'var(--text-3)' }}>{t('dashboard.loading')}</span>
      </div>
    );
  }

  return (
    <div style={css.page}>
      <style>{`
        .dash-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
        .dash-span8 { grid-column: span 8; }
        .dash-span4 { grid-column: span 4; }
        .dash-span12 { grid-column: span 12; }
        .dash-nav-grid { grid-column: span 12; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .dash-reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .dash-stories-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        
        @media (max-width: 900px) {
          .dash-grid { display: flex; flex-direction: column; gap: 24px; }
          .dash-span8, .dash-span4, .dash-span12 { grid-column: span 12; width: 100%; box-sizing: border-box; }
          .dash-nav-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-reports-grid { grid-template-columns: 1fr; }
          .dash-stories-grid { grid-template-columns: 1fr; }
          .dash-impact-card { flex-direction: column !important; align-items: stretch !important; }
          .dash-impact-ring { margin-top: 24px; align-self: center; }
          .dash-stat-divider { display: none !important; }
          .dash-stats-row { gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .dash-nav-grid { grid-template-columns: 1fr; }
          .dash-header-left { flex-direction: column; align-items: flex-start; }
          .dash-header-right { margin-top: 16px; width: 100%; justify-content: flex-start; }
        }
      `}</style>
      {/* Locality Select Modal */}
      {showLocalityModal && (
        <LocalitySelect
          onSelect={handleLocalitySelect}
          onClose={() => setShowLocalityModal(false)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header style={css.header}>
        <div className="dash-header-left">
          <h1 style={css.h1}>
            {t(getGreetingKey())}, {profile?.displayName || user?.displayName || 'Citizen'}
          </h1>
          <div style={css.locRow}>
            <MapPin size={15} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
            <span>{locality?.name || 'Ward 17 — Bistupur, City Hall District'}</span>
            {locality && (
              <button onClick={() => setShowLocalityModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                {t('dashboard.location.change')}
              </button>
            )}
          </div>
        </div>

        <div className="dash-header-right" style={css.headerRight}>
          {weatherData && (
            <div style={css.weatherPill}>
              <CloudSun size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-1)' }}>{weatherData.current?.temperature_2m}°C</span>
              <span style={{ color: 'var(--text-3)', opacity: 0.7 }}>| {t('dashboard.weather.feels')} {weatherData.current?.apparent_temperature}°C</span>
            </div>
          )}
          <button onClick={() => navigate('/profile')} style={css.iconBtn}>
            <Bell size={16} style={{ color: 'var(--text-2)' }} />
          </button>
          <button onClick={() => setShowLocalityModal(true)} style={css.iconBtn}>
            <Settings size={16} style={{ color: 'var(--text-2)' }} />
          </button>
        </div>
      </header>

      {/* ── Geofenced Hazard Alerts ──────────────────────────────────── */}
      {activeHazards.map(hazard => (
        <div 
          key={hazard.id} 
          style={{ ...css.alertBox('critical'), cursor: 'pointer', transition: 'transform 0.15s' }}
          onClick={() => navigate(`/issues/${hazard.id}`)}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.005)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
        >
          <div style={css.alertIcon('critical')}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--danger)', fontWeight: 800 }}>⚠️ CRITICAL HAZARD NEARBY</span>
              <span style={{ fontSize: 9, backgroundColor: 'var(--danger)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>Severity {hazard.severity}/5</span>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-1)' }}>
              {hazard.title || 'Civic Hazard'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              {hazard.description || 'An active, unresolved critical hazard has been reported in your immediate vicinity. Click for location and details.'}
            </p>
          </div>
        </div>
      ))}

      {/* ── Weather Alert ───────────────────────────────────────────── */}
      {weatherAlert && weatherAlert.severity !== 'low' && (
        <div style={css.alertBox(weatherAlert.severity)}>
          <div style={css.alertIcon(weatherAlert.severity)}>
            <ShieldAlert size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-1)', marginBottom: 4 }}>
              {weatherAlert.severity.toUpperCase()} ALERT: {t('dashboard.weather.alert')}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              {weatherAlert.advisoryText}
            </p>
          </div>
        </div>
      )}

      {/* ── Bento Grid ─────────────────────────────────────────────── */}
      <div className="dash-grid" style={css.grid}>

        {/* Hero: Impact Card (8 cols) */}
        <section className="dash-span8 dash-impact-card" style={{ ...css.span8, ...css.impactCard }}>
          <div style={css.impactLeft}>
            <h2 style={css.impactH2}>{t('dashboard.impact.title')}</h2>
            <p style={css.impactP}>
              {t('dashboard.impact.desc')}
            </p>
            <div className="dash-stats-row" style={css.statsRow}>
              <div>
                <p style={css.statNum}>{reportsCount}</p>
                <p style={css.statLabel}>{t('dashboard.impact.reports')}</p>
              </div>
              <div className="dash-stat-divider" style={css.statDivider} />
              <div>
                <p style={css.statNum}>{resolvedCount}</p>
                <p style={css.statLabel}>{t('dashboard.impact.resolved')}</p>
              </div>
            </div>
          </div>

          <div className="dash-impact-ring" style={css.ringWrap}>
            <div style={{ position: 'relative', width: 128, height: 128 }}>
              <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="64" cy="64" r={R} fill="transparent" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                <circle
                  cx="64" cy="64" r={R} fill="transparent" stroke="rgba(255,255,255,0.95)"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
              </svg>
              <div style={css.ringAbsolute}>
                <span style={css.ringPoints}>{userPoints}</span>
                <span style={css.ringLabel}>{t('dashboard.impact.points')}</span>
              </div>
            </div>
            <span style={css.levelBadge}>{t('dashboard.impact.level').replace('{level}', String(userLevel))}</span>
          </div>

          {/* Decorative blob */}
          <div style={{ position: 'absolute', right: -64, top: -64, width: 256, height: 256, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />
        </section>

        {/* Report Panel (4 cols) */}
        <section className="dash-span4" style={{ ...css.span4, ...css.reportPanel }}>
          <button style={css.reportBtn} onClick={() => navigate('/report')}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Camera size={32} style={{ color: '#fff' }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{t('dashboard.report.button')}</span>
          </button>
          <div style={css.voiceRow}>
            <button style={css.voiceBtn} onClick={() => navigate('/report')}>
              <Mic size={14} />
              <span>{t('dashboard.report.voice')}</span>
            </button>
          </div>
        </section>

        {/* Quick Nav (all 12 cols, inner 4-col grid) */}
        <nav className="dash-nav-grid" style={css.navGrid}>
          {[
            { label: t('dashboard.nav.map'),   Icon: MapIcon,   path: '/map' },
            { label: t('dashboard.nav.reports'), Icon: FileText,   path: '/profile' },
            { label: t('dashboard.nav.rewards'),    Icon: Award,      path: '/profile' },
            { label: t('dashboard.nav.help'),Icon: HelpCircle, path: '/profile' },
          ].map(({ label, Icon, path }) => (
            <button key={label} onClick={() => navigate(path)} style={css.navCard}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.015)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <div style={css.navIcon}>
                <Icon size={18} style={{ color: 'var(--bg)' }} />
              </div>
              <span style={css.navLabel}>{label}</span>
            </button>
          ))}
        </nav>

        {/* Active Reports (8 cols) */}
        <section className="dash-span8" style={css.span8}>
          <div style={css.sectionHeader}>
            <h2 style={css.sectionTitle}>{t('dashboard.reports.activeTitle')}</h2>
            <button style={css.viewAll} onClick={() => navigate('/profile')}>{t('dashboard.reports.viewAll')}</button>
          </div>

          <div className="dash-reports-grid" style={css.reportsGrid}>
            {activeIssues.length > 0 ? activeIssues.map(issue => {
              const daysAgo = issue.createdAt?.seconds
                ? Math.max(0, Math.floor((Date.now() / 1000 - issue.createdAt.seconds) / 86400))
                : 0;
              return (
                <div key={issue.id} style={css.issueCard} onClick={() => navigate(`/issue/${issue.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.005)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                  <div style={css.issueTop}>
                    <span style={css.statusBadge}>{issue.status?.replace('_', ' ') || 'Pending'}</span>
                    <span style={css.issueDate}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
                  </div>
                  <h3 style={css.issueTitle}>{issue.title}</h3>
                  <p style={css.issueDesc}>{issue.description}</p>
                  <div style={css.slaRow}>
                    <span>{t('dashboard.reports.sla')}</span>
                    <span>{issue.status === 'in_progress' ? '24h / 48h' : '4h / 72h'}</span>
                  </div>
                  <div style={css.slaTrack}>
                    <div style={css.slaFill(issue.status === 'in_progress' ? '50%' : '15%')} />
                  </div>
                </div>
              );
            }) : (
              <div style={css.emptyCard}>
                {t('dashboard.reports.empty')}
              </div>
            )}
          </div>
        </section>

        {/* Ward / Local News (4 cols) */}
        <section className="dash-span4" style={css.span4}>
          <div style={css.wardCard}>
            <h2 style={css.wardTitle}>{locality?.name.split(',')[0] || 'Bistupur'} {t('dashboard.news.title')}</h2>
            <div style={css.wardImg}>
              <img
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN4hrQuKc-Kes59dVCIlXC-z7N1k1eSIXi4ySzt4uYwsEFmm40v9qQziESbiRa8A8QvfVeoRhkzU20hxzZXU1CqeLWHbnJXQa0dY13gzmJmd9OypoLDwzlEUXTSzU8JcrpXHqflnz2fLR79wJHrdVS797aS8hq5KY7lRHMKvcQSSO2EJ5FdkX7Oat2vztHVAMqMj6CWGUb3XQT8R64E32Tmk_nLkAzgbiwbCty9VjxapVX5h5-s693TA"
                alt="Ward map"
              />
            </div>
            <div>
              <p style={css.happeningLabel}>{t('dashboard.news.happening')}</p>
              {achievements.map(ach => (
                <div key={ach.id} style={css.achRow}>
                  <div style={css.achLeft}>
                    {ach.icon === 'park'
                      ? <Trees size={16} style={{ color: 'var(--text-2)' }} />
                      : <Droplets size={16} style={{ color: 'var(--text-2)' }} />}
                    <span style={css.achTitle}>{ach.title}</span>
                  </div>
                  <button style={css.likeBtn(ach.liked)} onClick={() => handleUpvote(ach.id)}>
                    <ThumbsUp size={12} />
                    <span>{ach.likes}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories (8 cols) */}
        <section className="dash-span8" style={css.span8}>
          <h2 style={{ ...css.sectionTitle, marginBottom: 16 }}>{t('dashboard.stories.title')}</h2>
          <div className="dash-stories-grid" style={css.storiesGrid}>
            {[
              {
                title: t('dashboard.story1.title'),
                desc: t('dashboard.story1.desc'),
                before: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwHeLq_TTKsaMf2u_oekcOb5Nbr3Ql8FkiJkuAtO8qUgpAfuiV0vifkzErxJHD3pfcQXny46r4yql4IzHuy1DTUIXx3GZYq2N2-K0xNeETqpYuiCfrDgW9Td-wbZUgHWRP4YmywfYKWT6tbN4YDqhHlDzkglN0a63B_AjXLKs5OliyEQ7TepC2qbkIRbihHyZBEe6Z2Q7S3GVO4lm8U_xZj9RGNn1Ie2RmunAO4QSsJlSh-FlFEHHDlg',
                after:  'https://lh3.googleusercontent.com/aida-public/AB6AXuA-t-hOQpZrY2N7Lt4UsubtE5b8ravkhEtuNV8dXbLhbqN3G5HDC_ufDegTLqXTXVACxElFz3tjhQdl64C8QtkJdo-lU9eIMuC1apSDOKTESO5EhjVZlYp10gxqbBVG3ODmxnGteEWW40iIiwNbmJzc5PDBKvuxj7qQh8CRJfEq5M8bXUAQwwHSvcHuAv4dh-B3r3IzklNxLEk6YpMcLyXfkKb8HRDnt5ielLB0Uy7BNYxsO0Gd-LDXqA',
              },
              {
                title: t('dashboard.story2.title'),
                desc: t('dashboard.story2.desc'),
                before: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc7GLItbMgMOn9WMoQojV3_OTjuiYh9947KPI52DSwS0Gsopgw_8mAt6RZgDdol4alhbtfOqQWB0JiojnHBuIDozS-dZSSezvovRHLY2H7feoS24tlBjcgk_lo3L0ocw6iFoB68s5-C3jU0_ws8GAJd4nyBYUrVVlgPupY9A6ofU7FsMe4xTZb81wZK1ygz3LCGvUQRs7zPDvICNKiP2Y5n3M-0dVMtcKZYJFoGx58j7PyFCoNprkFnw',
                after:  'https://lh3.googleusercontent.com/aida-public/AB6AXuBBLBAth7XjrG86SV22-7CQ1OfdzoH-fC1Ou2VHDSj7e2BIAuluxtqxGYhBleEqkRCuCK6v1WaXtxkqb4ufzqv6xSlA3FcbE0dNrV4NrIXhOR24k7Bh_ZTZyUjyTKl8_EtB75tlr7vnC3TdDPGCAm68UxPbYf-802E3THDt3f3LejH1vmcBbEG3-CFsjuL4y6Tlae6qCQhdkvVsqHy7MxGq1Ng0x0iPoQNJygoBwn_7GGImhELKfRfYIw',
              },
            ].map(story => (
              <div key={story.title} style={css.storyCard}>
                <div style={css.storyImgRow}>
                  <div style={css.storyHalf}>
                    <img src={story.before} alt="Before" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={css.storyLabel('before')}>{t('dashboard.stories.before')}</span>
                  </div>
                  <div style={{ ...css.storyHalf, borderLeft: '2px solid var(--border)' }}>
                    <img src={story.after} alt="After" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={css.storyLabel('after')}>{t('dashboard.stories.after')}</span>
                  </div>
                </div>
                <div style={css.storyInfo}>
                  <h4 style={css.storyTitle}>{story.title}</h4>
                  <p style={css.storyDesc}>{story.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Citizen Leaderboard (4 cols) */}
        <section className="dash-span4" style={css.span4}>
          <div style={css.lbCard}>
            <div style={css.lbHeader}>
              <Award size={18} style={{ color: 'var(--primary)' }} />
              <h2 style={css.lbTitle}>{t('dashboard.leaderboard.title')}</h2>
            </div>
            <p style={css.lbSub}>{t('dashboard.leaderboard.subtitle')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leaderboard.length > 0 ? leaderboard.map((u, i) => (
                <div key={u.uid} style={css.lbRow}>
                  <div style={css.lbLeft}>
                    <span style={css.lbRank}>{i + 1}</span>
                    <img
                      style={css.lbAvatar}
                      src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.displayName}`}
                      alt={u.displayName}
                      loading="lazy"
                    />
                    <div>
                      <div style={css.lbName}>{u.displayName || 'Anonymous Citizen'}</div>
                      <div style={css.lbBadge}>{(u.badges || []).slice(0, 1).join('') || '🏆 Active Advocate'}</div>
                    </div>
                  </div>
                  <span style={css.lbPts}>{u.points || 0} pts</span>
                </div>
              )) : (
                <p style={{ fontSize: 12, textAlign: 'center', padding: '16px 0', color: 'var(--text-3)' }}>{t('dashboard.leaderboard.loading')}</p>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
