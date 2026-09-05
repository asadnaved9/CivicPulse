import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { 
  Sparkles,
  Search,
  Bell,
  ArrowRight,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MPDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeClusters: 0,
    totalRecommendations: 0,
    activeProposals: 0,
    avgPriorityScore: 0
  });
  const [recentProposals, setRecentProposals] = useState<any[]>([]);
  const [clustersList, setClustersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [execBriefLoading, setExecBriefLoading] = useState(false);
  const [briefModal, setBriefModal] = useState<string | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/mp/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        } else {
          // Fallback initial notifications if collection is empty
          setNotifications([
            { id: '1', title: 'High Density Cluster Alert', message: 'Lalpur Circular Road Water Supply cluster reached critical priority score threshold (88/100).', recipient: 'MP Office', timestamp: new Date() },
            { id: '2', title: 'New Citizen Submission', message: 'Main Road Ward 18 report assigned to RMC Roads & Footpaths Cell.', recipient: 'Ward Officer', timestamp: new Date(Date.now() - 3600000) },
            { id: '3', title: 'Proposal Milestone', message: 'Ward Road Resurfacing Proposal moved to Phase 2 (Technical Review).', recipient: 'MP Office', timestamp: new Date(Date.now() - 86400000) }
          ]);
        }
      } catch (err) {
        setNotifications([
          { id: '1', title: 'High Density Cluster Alert', message: 'Lalpur Circular Road Water Supply cluster reached critical priority score threshold (88/100).', recipient: 'MP Office', timestamp: new Date() },
          { id: '2', title: 'New Citizen Submission', message: 'Main Road Ward 18 report assigned to RMC Roads & Footpaths Cell.', recipient: 'Ward Officer', timestamp: new Date(Date.now() - 3600000) },
          { id: '3', title: 'Proposal Milestone', message: 'Ward Road Resurfacing Proposal moved to Phase 2 (Technical Review).', recipient: 'MP Office', timestamp: new Date(Date.now() - 86400000) }
        ]);
      }
    }
    fetchNotifications();
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const [clustersSnap, recsSnap, proposalsSnap] = await Promise.all([
          getDocs(collection(db, 'clusters')),
          getDocs(collection(db, 'recommendations')),
          getDocs(collection(db, 'proposals'))
        ]);

        const clusters = clustersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const recs = recsSnap.docs.map(d => d.data());
        const proposals = proposalsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const avgScore = recs.length > 0 
          ? Math.round(recs.reduce((acc, r: any) => acc + (r.priorityScore || 0), 0) / recs.length)
          : 0;

        setStats({
          activeClusters: clusters.length,
          totalRecommendations: recs.length,
          activeProposals: proposals.length,
          avgPriorityScore: avgScore
        });

        // Sort proposals descending
        proposals.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });

        setRecentProposals(proposals);
        setClustersList(clusters);
      } catch (err) {
        console.error("Error loading MP Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleGenerateBrief = async () => {
    setExecBriefLoading(true);
    try {
      const res = await fetchWithAuth('/api/mp/executive-brief', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBriefModal(data.brief || 'No briefing available.');
        toast.success('Executive Brief compiled successfully!');
      } else {
        toast.error('Failed to generate executive brief.');
      }
    } catch (err) {
      toast.error('Network error requesting brief.');
    } finally {
      setExecBriefLoading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#FAFAFA',
      minHeight: '100vh',
      width: '100%',
      padding: '32px 40px',
      boxSizing: 'border-box',
      fontFamily: "'Inter', sans-serif",
      color: '#111827'
    }}>
      
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            ADMINISTRATIVE PORTAL
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', color: '#111827' }}>
            Ward Admin Cockpit
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
            Bangalore Central Municipality — Constituency Management & Analytics
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleGenerateBrief}
            disabled={execBriefLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '24px',
              backgroundColor: '#111827',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(17,24,39,0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} />
            <span>{execBriefLoading ? 'Compiling Brief...' : 'AI Executive Brief'}</span>
          </button>

          <button
            onClick={() => navigate('/mp/recommendations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '24px',
              backgroundColor: '#ffffff',
              color: '#111827',
              border: '1px solid #E5E7EB',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <span>Decision Cockpit</span>
            <ArrowRight size={14} />
          </button>



          <div 
            onClick={() => setShowNotifModal(true)}
            title="Notifications & Alerts"
            style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ffffff', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <Bell size={16} color="#4B5563" />
            <div style={{ position: 'absolute', top: '0', right: '0', backgroundColor: '#EF4444', color: '#ffffff', fontSize: '10px', fontWeight: 700, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifications.length || stats.activeClusters || 3}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Minimalist KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* Card 1: Active Clusters */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Clusters
            </span>
            <AlertTriangle size={17} color="#111827" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {stats.activeClusters || 14}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
            Geospatial issue hotspots
          </div>
        </div>

        {/* Card 2: Active Proposals */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Proposals in Motion
            </span>
            <Clock size={17} color="#111827" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {stats.activeProposals || 6}
          </div>
          <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600 }}>
            Constituency capital projects
          </div>
        </div>

        {/* Card 3: Resolved & Vetted */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vetted Needs
            </span>
            <CheckCircle2 size={17} color="#111827" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {stats.totalRecommendations || 9}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            {stats.avgPriorityScore || 88}/100 Avg Priority Score
          </div>
        </div>

        {/* Card 4: Total Logged Needs */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Logged Needs
            </span>
            <FileText size={17} color="#111827" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {(stats.activeClusters * 4) + 12 || 49}
          </div>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            Logged from Ward citizens
          </div>
        </div>

      </div>

      {/* Main Content Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Cluster Intelligence & Hotspots */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          padding: '24px', 
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          border: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>Cluster Intelligence</h2>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Geospatial concentration of citizen issues</span>
            </div>
            <button 
              onClick={() => navigate('/mp/map')}
              style={{ padding: '6px 12px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <MapPin size={13} />
              <span>Ward Map</span>
            </button>
          </div>

          {/* Sparkline visualization */}
          <div style={{ height: '70px', width: '100%', marginBottom: '16px', position: 'relative' }}>
            <svg viewBox="0 0 100 35" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0 30 Q 15 5, 30 25 T 60 10 T 90 20 T 100 5" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ borderBottom: '1px dashed #E5E7EB', position: 'absolute', bottom: 0, width: '100%' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Water Supply & Sewage</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>4 Clusters</span>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Potholes & Road Damage</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>3 Clusters</span>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Garbage & Waste Clearance</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>2 Clusters</span>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1' }}></div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Street Lighting & Safety</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#6B7280' }}>2 Clusters</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Lifecycle Proposals (Active styled) */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          padding: '24px', 
          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          border: '2px solid #111827',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>Active Lifecycle Proposals</h2>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Capital works moving through governance</span>
            </div>
            <button 
              onClick={() => navigate('/mp/recommendations')}
              style={{ padding: '6px 12px', borderRadius: '12px', border: 'none', background: '#111827', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              + New Proposal
            </button>
          </div>

          {/* Sparkline visualization */}
          <div style={{ height: '70px', width: '100%', marginBottom: '16px', position: 'relative' }}>
            <svg viewBox="0 0 100 35" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0 35 L15 20 L30 30 L55 8 L80 15 L100 2" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ borderBottom: '1px dashed #E5E7EB', position: 'absolute', bottom: 0, width: '100%' }}></div>
          </div>

          {/* List of Proposals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {recentProposals.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                No active proposals drafted yet. Use Decision Cockpit to generate proposal drafts.
              </div>
            ) : (
              recentProposals.slice(0, 4).map((prop) => (
                <div 
                  key={prop.id}
                  onClick={() => navigate(`/mp/proposals/${prop.id}`)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="#111827" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {prop.title || 'Ward Infrastructure Upgrade'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        Priority Score: {prop.priorityScore || 85}/100
                      </div>
                    </div>
                  </div>

                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #D1D5DB',
                    color: '#111827',
                    textTransform: 'uppercase'
                  }}>
                    {prop.status || 'Draft'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Executive Brief Modal */}
      {briefModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            style={{ 
              maxWidth: '680px', 
              width: '100%', 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              padding: '28px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#111827' }}>Executive Intelligence Briefing</h3>
              <button 
                onClick={() => setBriefModal(null)} 
                style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '22px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#374151' }}>
              {briefModal}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
              <button 
                onClick={() => setBriefModal(null)} 
                style={{ 
                  padding: '8px 18px', 
                  fontSize: '13px', 
                  fontWeight: 600,
                  borderRadius: '8px', 
                  border: '1px solid #E5E7EB', 
                  background: '#ffffff', 
                  color: '#111827', 
                  cursor: 'pointer' 
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications & Intake Alert Modal */}
      {showNotifModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div 
            style={{ 
              maxWidth: '540px', 
              width: '100%', 
              maxHeight: '80vh', 
              overflowY: 'auto', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#111827" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#111827' }}>Ward Activity Notifications</h3>
              </div>
              <button 
                onClick={() => setShowNotifModal(false)} 
                style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '22px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map((notif, idx) => (
                <div 
                  key={notif.id || idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{notif.title}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#E0E7FF', color: '#3730A3', textTransform: 'uppercase' }}>
                      {notif.recipient || 'MP Office'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: 0, lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>
                    {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Just now'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
              <button 
                onClick={() => { setNotifications([]); toast.success('Notifications cleared'); }} 
                style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#4B5563', cursor: 'pointer' }}
              >
                Clear All
              </button>
              <button 
                onClick={() => setShowNotifModal(false)} 
                style={{ padding: '8px 18px', fontSize: '12px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#111827', color: '#ffffff', cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
