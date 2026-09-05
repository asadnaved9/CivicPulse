import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  ThumbsUp, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  TrendingUp, 
  PlusCircle, 
  ArrowRight, 
  DollarSign,
  Filter,
  Flame,
  ShieldAlert,
  BarChart2,
  Sparkles
} from 'lucide-react';

interface IssueCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  status: 'RESOLVED' | 'IN_PROGRESS' | 'AI_TRIAGED' | 'BUDGET_APPROVED';
  upvotes: number;
  timeAgo: string;
  budget?: string;
  progress?: number;
  severity?: 'High' | 'Medium' | 'Critical';
}

const mockIssues: IssueCardData[] = [
  {
    id: '1',
    title: 'Dangerous Pothole Cluster on 5th Ave & Pine St',
    description: 'High-speed hazard for cyclists and commuters. Automated EXIF data verified.',
    category: 'Road Hazard',
    district: 'Ward 3 - Central',
    status: 'RESOLVED',
    upvotes: 42,
    timeAgo: '2 hours ago',
    progress: 100
  },
  {
    id: '2',
    title: 'Smart Streetlight Grid Retrofit Project',
    description: 'Replacing legacy sodium lamps with energy-efficient LED nodes along Main Boulevard.',
    category: 'Municipal Infrastructure',
    district: 'Ward 1 - Downtown',
    status: 'IN_PROGRESS',
    upvotes: 89,
    timeAgo: '4 hours ago',
    budget: '$65,000',
    progress: 78
  },
  {
    id: '3',
    title: 'Main Water Line Pressure Anomaly - West Park',
    description: 'AI model flagged pressure drop from 18 citizen reports within 15 minutes.',
    category: 'Water System',
    district: 'Ward 4 - Westside',
    status: 'AI_TRIAGED',
    upvotes: 124,
    timeAgo: '12 mins ago',
    severity: 'Critical'
  },
  {
    id: '4',
    title: 'Pedestrian Crossing Light & Traffic Sensor Upgrade',
    description: 'Installing smart radar crossing sensors to reduce vehicle-pedestrian near misses.',
    category: 'Traffic Safety',
    district: 'Ward 2 - North',
    status: 'BUDGET_APPROVED',
    upvotes: 56,
    timeAgo: '1 day ago',
    budget: '$120,000',
    progress: 35
  }
];

export const InteractiveCityRadar: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'RESOLVED' | 'IN_PROGRESS' | 'AI_TRIAGED'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [upvotesState, setUpvotesState] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    mockIssues.forEach(i => { initial[i.id] = i.upvotes; });
    return initial;
  });
  const [userUpvoted, setUserUpvoted] = useState<Record<string, boolean>>({});

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserUpvoted(prev => {
      const currentlyUpvoted = !!prev[id];
      setUpvotesState(curr => ({
        ...curr,
        [id]: curr[id] + (currentlyUpvoted ? -1 : 1)
      }));
      return { ...prev, [id]: !currentlyUpvoted };
    });
  };

  const filteredIssues = mockIssues.filter(issue => {
    if (activeTab !== 'ALL' && issue.status !== activeTab) return false;
    if (selectedDistrict !== 'ALL' && issue.district !== selectedDistrict) return false;
    return true;
  });

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', width: '100%', transition: 'background 0.3s ease, color 0.3s ease' }}>
      
      {/* DYNAMIC CITY HEALTH RADAR HEADER */}
      <section style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                Real-Time Civic Infrastructure Stream
              </h2>
            </div>

            {/* Quick District Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Filter size={14} style={{ color: 'var(--text-3)' }} />
              <select 
                value={selectedDistrict} 
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{ 
                  background: 'var(--surface)', 
                  color: 'var(--text-1)', 
                  border: '1px solid var(--border)', 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ALL">All City Districts</option>
                <option value="Ward 1 - Downtown">Ward 1 - Downtown</option>
                <option value="Ward 2 - North">Ward 2 - North</option>
                <option value="Ward 3 - Central">Ward 3 - Central</option>
                <option value="Ward 4 - Westside">Ward 4 - Westside</option>
              </select>
            </div>
          </div>

          {/* Interactive Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              style={{
                background: activeTab === 'ALL' ? 'var(--primary)' : 'var(--surface-2)',
                color: activeTab === 'ALL' ? 'var(--bg)' : 'var(--text-2)',
                border: activeTab === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              🔥 All Reports ({mockIssues.length})
            </button>

            <button
              onClick={() => setActiveTab('RESOLVED')}
              style={{
                background: activeTab === 'RESOLVED' ? 'var(--badge-success-bg)' : 'var(--surface-2)',
                color: activeTab === 'RESOLVED' ? 'var(--badge-success-text)' : 'var(--text-2)',
                border: activeTab === 'RESOLVED' ? '1px solid var(--badge-success-border)' : '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              ✅ Verified Fixes
            </button>

            <button
              onClick={() => setActiveTab('IN_PROGRESS')}
              style={{
                background: activeTab === 'IN_PROGRESS' ? 'var(--badge-warning-bg)' : 'var(--surface-2)',
                color: activeTab === 'IN_PROGRESS' ? 'var(--badge-warning-text)' : 'var(--text-2)',
                border: activeTab === 'IN_PROGRESS' ? '1px solid var(--badge-warning-border)' : '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ In Progress
            </button>

            <button
              onClick={() => setActiveTab('AI_TRIAGED')}
              style={{
                background: activeTab === 'AI_TRIAGED' ? 'var(--badge-info-bg)' : 'var(--surface-2)',
                color: activeTab === 'AI_TRIAGED' ? 'var(--badge-info-text)' : 'var(--text-2)',
                border: activeTab === 'AI_TRIAGED' ? '1px solid var(--badge-info-border)' : '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              🤖 AI Priority Triage
            </button>
          </div>

          {/* DYNAMIC INTERACTIVE CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
                className="hover-card"
                onClick={() => navigate('/map')}
              >
                {/* Status Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {issue.status === 'RESOLVED' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: 'var(--badge-success-bg)', color: 'var(--badge-success-text)', border: '1px solid var(--badge-success-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={11} /> VERIFIED & CLOSED
                    </span>
                  )}
                  {issue.status === 'IN_PROGRESS' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', border: '1px solid var(--badge-warning-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> IN PROGRESS ({issue.progress}%)
                    </span>
                  )}
                  {issue.status === 'AI_TRIAGED' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: 'var(--badge-danger-bg)', color: 'var(--badge-danger-text)', border: '1px solid var(--badge-danger-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={11} /> AI HIGH PRIORITY
                    </span>
                  )}
                  {issue.status === 'BUDGET_APPROVED' && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '10px', background: 'var(--badge-info-bg)', color: 'var(--badge-info-text)', border: '1px solid var(--badge-info-border)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <DollarSign size={11} /> FUND ALLOCATED
                    </span>
                  )}

                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{issue.timeAgo}</span>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', margin: 0, lineHeight: 1.3 }}>
                  {issue.title}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
                  {issue.description}
                </p>

                {/* Optional Progress Bar */}
                {issue.progress !== undefined && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)' }}>
                      <span>Completion</span>
                      <strong>{issue.progress}%</strong>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${issue.progress}%`, height: '100%', background: issue.status === 'RESOLVED' ? 'var(--success)' : 'var(--warning)', borderRadius: '2px' }} />
                    </div>
                  </div>
                )}

                {/* Footer Controls: Location & Upvote Counter */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ color: 'var(--text-2)' }} /> {issue.district}
                  </span>

                  <button
                    onClick={(e) => handleUpvote(issue.id, e)}
                    style={{
                      background: userUpvoted[issue.id] ? 'var(--primary)' : 'var(--surface-2)',
                      border: `1px solid ${userUpvoted[issue.id] ? 'var(--primary)' : 'var(--border)'}`,
                      color: userUpvoted[issue.id] ? 'var(--bg)' : 'var(--text-1)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ThumbsUp size={12} />
                    {upvotesState[issue.id]}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => navigate('/map')}
              className="btn btn-secondary"
              style={{ padding: '12px 28px', fontSize: '13px', fontWeight: 600, borderRadius: '6px' }}
            >
              Explore Full Interactive Map Radar <ArrowRight size={15} style={{ marginLeft: '6px' }} />
            </button>
          </div>

        </div>
      </section>
    </div>
  );
};
