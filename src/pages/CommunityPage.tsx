import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Award, 
  MessageSquare, 
  ThumbsUp, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Flame, 
  Send,
  Heart,
  Share2,
  Clock,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WardenLeader {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  ward: string;
  reported: number;
  resolved: number;
  badge: string;
}

interface ForumPost {
  id: string;
  author: string;
  authorAvatar: string;
  ward: string;
  timeAgo: string;
  category: 'Proposal' | 'Spotlight' | 'Announcement' | 'Discussion';
  title: string;
  content: string;
  upvotes: number;
  comments: number;
  userUpvoted?: boolean;
}

interface VolunteerEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  attendees: number;
  joined?: boolean;
}

const mockWardens: WardenLeader[] = [
  { rank: 1, name: 'Deepak Oraon', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepak', points: 1540, ward: 'Ward 18 - Main Road / Hindpiri', reported: 18, resolved: 14, badge: 'Civic Champion' },
  { rank: 2, name: 'Anjali Gupta', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=anjali', points: 1320, ward: 'Ward 14 - Lalpur / Circular Road', reported: 15, resolved: 12, badge: 'Truth Teller' },
  { rank: 3, name: 'Sanjay Tirkey', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sanjay', points: 1180, ward: 'Ward 26 - Doranda / Hinoo', reported: 12, resolved: 10, badge: 'Community Guardian' },
  { rank: 4, name: 'Pooja Verma', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=pooja', points: 950, ward: 'Ward 21 - Harmu Housing Colony', reported: 9, resolved: 8, badge: 'First Report' },
  { rank: 5, name: 'Manish Sinha', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=manish', points: 890, ward: 'Ward 3 - Morabadi / Kanke Road', reported: 8, resolved: 6, badge: 'Civic Warden' },
];

const initialPosts: ForumPost[] = [
  {
    id: 'post-1',
    author: 'Deepak Oraon',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepak',
    ward: 'Ward 18 - Main Road / Hindpiri',
    timeAgo: '2 hours ago',
    category: 'Proposal',
    title: 'Proposal: Solar Streetlight Canopy for Main Road Commercial Lane',
    content: 'Our ward has several dim stretches behind Albert Ekka Chowk and GEL Church. Adding 12 solar lighting poles will enhance night safety for evening workers and shoppers. Let us upvote this for municipal budget priority!',
    upvotes: 48,
    comments: 14
  },
  {
    id: 'post-2',
    author: 'Anjali Gupta',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=anjali',
    ward: 'Ward 14 - Lalpur / Circular Road',
    timeAgo: '5 hours ago',
    category: 'Spotlight',
    title: '✅ Verified Repair Spotlight: Circular Road Water Pipeline Sealed',
    content: 'Huge shoutout to the DWSD water division and fellow citizen wardens! The major water leak reported yesterday near Burdwan Compound was verified and sealed within 18 hours. Great teamwork!',
    upvotes: 76,
    comments: 9
  },
  {
    id: 'post-3',
    author: 'RMC Municipal Warden Office',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=rmc',
    ward: 'Ranchi Central',
    timeAgo: '1 day ago',
    category: 'Announcement',
    title: '📢 Special Ward Committee Public Meeting & Monsoon Preparedness Audit',
    content: 'All registered Wardens are invited to attend the quarterly Ward Committee Review at RMC Kutchery Road Headquarters this Saturday at 10 AM. Agenda includes drain desilting and emergency response.',
    upvotes: 112,
    comments: 23
  }
];

const initialEvents: VolunteerEvent[] = [
  { id: 'evt-1', title: 'Main Road Footpath Greenery & Plantation Drive', date: 'Sat, Sep 12 • 08:30 AM', location: 'Shaheed Chowk Park', organizer: 'Green Ranchi Wardens', attendees: 34 },
  { id: 'evt-2', title: 'Lalpur Night Streetlight Audit Walk', date: 'Sun, Sep 13 • 07:00 PM', location: 'Nucleus Mall Crossing', organizer: 'Safety First Ward 14', attendees: 28 },
  { id: 'evt-3', title: 'Doranda Waste Segregation & Plastic Cleanup Workshop', date: 'Sat, Sep 19 • 10:00 AM', location: 'Doranda Community Hall', organizer: 'Eco Wardens Alliance', attendees: 45 }
];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'Proposal' | 'Spotlight' | 'Announcement'>('ALL');
  const [posts, setPosts] = useState<ForumPost[]>(initialPosts);
  const [events, setEvents] = useState<VolunteerEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New discussion modal state
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Proposal' | 'Spotlight' | 'Announcement' | 'Discussion'>('Proposal');

  const handleUpvotePost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const currentlyUpvoted = p.userUpvoted;
        return {
          ...p,
          upvotes: p.upvotes + (currentlyUpvoted ? -1 : 1),
          userUpvoted: !currentlyUpvoted
        };
      }
      return p;
    }));
  };

  const handleJoinEvent = (id: string) => {
    setEvents(prev => prev.map(e => {
      if (e.id === id) {
        const isJoined = e.joined;
        toast.success(isJoined ? 'RSVP Cancelled' : 'Successfully RSVP\'d for Volunteer Drive!');
        return {
          ...e,
          attendees: e.attendees + (isJoined ? -1 : 1),
          joined: !isJoined
        };
      }
      return e;
    }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please enter a title and discussion content.');
      return;
    }

    const created: ForumPost = {
      id: `post-${Date.now()}`,
      author: 'You (Citizen Warden)',
      authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
      ward: 'Ward 151 - Koramangala',
      timeAgo: 'Just now',
      category: newCategory,
      title: newTitle,
      content: newContent,
      upvotes: 1,
      comments: 0,
      userUpvoted: true
    };

    setPosts([created, ...posts]);
    setShowModal(false);
    setNewTitle('');
    setNewContent('');
    toast.success('Community discussion published successfully!');
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab !== 'ALL' && p.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.ward.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', minHeight: '100vh', padding: '36px 20px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* HERO HEADER SECTION */}
        <div style={{ 
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 14px', 
            borderRadius: '20px', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)',
            color: 'var(--text-1)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}>
            <Users size={15} style={{ color: 'var(--success)' }} />
            NEIGHBORHOOD CITIZEN WARDEN COMMUNITY
          </div>

          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 46px)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Civic Pulse Community Hub
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0, maxWidth: '720px' }}>
            Collaborate with local ward guardians, upvote civic infrastructure proposals, participate in ground-level volunteer drives, and compete on the Ward Warden Leaderboard.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} /> Start a Discussion
            </button>
            <button 
              className="btn btn-secondary"
              style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}
              onClick={() => navigate('/report')}
            >
              <Sparkles size={16} /> Propose Development
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN COMMUNITY LAYOUT */}
        <div className="community-main-layout">
          
          {/* LEFT MAIN FEED COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
            
            {/* SECTION 1: FORUM & PROPOSAL DEBATES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Community Forum & Proposals</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0 }}>Join active ward discussions and upvote community proposals.</p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search discussions..." 
                    style={{ paddingLeft: '34px', fontSize: '12px', borderRadius: '20px', height: '36px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  onClick={() => setActiveTab('ALL')}
                  style={{
                    background: activeTab === 'ALL' ? 'var(--primary)' : 'var(--surface-2)',
                    color: activeTab === 'ALL' ? 'var(--bg)' : 'var(--text-2)',
                    border: '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔥 All Threads ({posts.length})
                </button>
                <button
                  onClick={() => setActiveTab('Proposal')}
                  style={{
                    background: activeTab === 'Proposal' ? 'var(--badge-warning-bg)' : 'var(--surface-2)',
                    color: activeTab === 'Proposal' ? 'var(--badge-warning-text)' : 'var(--text-2)',
                    border: activeTab === 'Proposal' ? '1px solid var(--badge-warning-border)' : '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  💡 Proposals ({posts.filter(p=>p.category==='Proposal').length})
                </button>
                <button
                  onClick={() => setActiveTab('Spotlight')}
                  style={{
                    background: activeTab === 'Spotlight' ? 'var(--badge-success-bg)' : 'var(--surface-2)',
                    color: activeTab === 'Spotlight' ? 'var(--badge-success-text)' : 'var(--text-2)',
                    border: activeTab === 'Spotlight' ? '1px solid var(--badge-success-border)' : '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✅ Spotlights ({posts.filter(p=>p.category==='Spotlight').length})
                </button>
                <button
                  onClick={() => setActiveTab('Announcement')}
                  style={{
                    background: activeTab === 'Announcement' ? 'var(--badge-info-bg)' : 'var(--surface-2)',
                    color: activeTab === 'Announcement' ? 'var(--badge-info-text)' : 'var(--text-2)',
                    border: activeTab === 'Announcement' ? '1px solid var(--badge-info-border)' : '1px solid var(--border)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📢 Announcements ({posts.filter(p=>p.category==='Announcement').length})
                </button>
              </div>

              {/* Forum Feed Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map((post) => (
                  <div 
                    key={post.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '20px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}
                    className="hover-card"
                  >
                    {/* Left Vertical Upvote Widget */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      background: post.userUpvoted ? 'var(--badge-success-bg)' : 'var(--surface-2)',
                      border: post.userUpvoted ? '1px solid var(--badge-success-border)' : '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    onClick={() => handleUpvotePost(post.id)}
                    >
                      <ChevronUp size={18} style={{ color: post.userUpvoted ? 'var(--success)' : 'var(--text-3)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: post.userUpvoted ? 'var(--success)' : 'var(--text-1)' }}>
                        {post.upvotes}
                      </span>
                    </div>

                    {/* Main Post Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src={post.authorAvatar} alt={post.author} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>{post.author}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>• {post.ward} • {post.timeAgo}</span>
                        </div>

                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          padding: '3px 8px', 
                          borderRadius: '10px',
                          background: post.category === 'Proposal' ? 'var(--badge-warning-bg)' : (post.category === 'Spotlight' ? 'var(--badge-success-bg)' : 'var(--badge-info-bg)'),
                          color: post.category === 'Proposal' ? 'var(--badge-warning-text)' : (post.category === 'Spotlight' ? 'var(--badge-success-text)' : 'var(--badge-info-text)'),
                          border: '1px solid var(--border)'
                        }}>
                          {post.category}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-1)', lineHeight: 1.35 }}>
                        {post.title}
                      </h3>

                      <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
                        {post.content}
                      </p>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', paddingTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={14} /> {post.comments} Comments
                        </span>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => toast.success('Discussion link copied to clipboard!')}
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          <Share2 size={12} /> Share
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: VOLUNTEER DRIVES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Upcoming Volunteer Drives</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0 }}>Participate in ground-level civic action events across your ward.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {events.map((evt) => (
                  <div 
                    key={evt.id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                    className="hover-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '12px', fontWeight: 700 }}>
                      <Calendar size={15} /> {evt.date}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-1)', lineHeight: 1.35 }}>
                      {evt.title}
                    </h3>

                    <span style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} style={{ color: 'var(--danger)' }} /> {evt.location}
                    </span>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>
                        <strong>{evt.attendees}</strong> Wardens RSVP'd
                      </span>

                      <button
                        onClick={() => handleJoinEvent(evt.id)}
                        className={`btn ${evt.joined ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        {evt.joined ? 'RSVP\'d ✅' : 'Join Drive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR COLUMN: LEADERBOARD PINNED AT TOP-RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* TOP CITIZEN WARDENS LEADERBOARD CARD */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} style={{ color: 'var(--warning)' }} />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                    Top Citizen Wardens
                  </h3>
                </div>
                <span className="badge" style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', border: '1px solid var(--badge-warning-border)', fontWeight: 800 }}>
                  TOP 5
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
                Recognizing top residents with highest proof-of-work contributions & verified resolves.
              </p>

              {/* Ranked Wardens List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mockWardens.map((warden) => (
                  <div 
                    key={warden.rank}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: warden.rank === 1 ? 'var(--badge-success-bg)' : 'var(--surface-2)',
                      border: warden.rank === 1 ? '1px solid var(--badge-success-border)' : '1px solid var(--border)',
                      gap: '10px'
                    }}
                    className="hover-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: warden.rank === 1 ? 'var(--success)' : (warden.rank === 2 ? 'var(--warning)' : 'var(--surface-3)'),
                        color: warden.rank === 1 || warden.rank === 2 ? '#ffffff' : 'var(--text-1)',
                        flexShrink: 0
                      }}>
                        {warden.rank === 1 ? '🥇' : (warden.rank === 2 ? '🥈' : (warden.rank === 3 ? '🥉' : warden.rank))}
                      </span>

                      <img 
                        src={warden.avatar} 
                        alt={warden.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', flexShrink: 0 }} 
                      />

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {warden.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {warden.badge} • {warden.resolved} resolved
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: warden.rank === 1 ? 'var(--success)' : 'var(--text-1)', display: 'block' }}>
                        {warden.points}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700 }}>PTS</span>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-secondary text-sm" 
                style={{ width: '100%', fontSize: '12px', padding: '9px', justifyContent: 'center', borderRadius: '8px' }}
                onClick={() => navigate('/settings')}
              >
                <Sparkles size={14} style={{ color: 'var(--warning)' }} /> View My Points & Badges
              </button>
            </div>

            {/* USER CIVIC STATUS CARD */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=user" 
                  alt="You" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-2)', border: '2px solid var(--success)' }} 
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-1)' }}>You (Citizen Warden)</h4>
                    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', background: 'var(--badge-success-bg)', color: 'var(--badge-success-text)' }}>
                      LVL 4
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ward 151 • Koramangala</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>Civic Karma</span>
                  <span style={{ color: 'var(--success)', fontWeight: 800 }}>850 / 1,000 PTS</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '85%', background: 'var(--success)', borderRadius: '3px' }} />
                </div>
              </div>
            </div>

            {/* WARDEN GUIDELINES CARD */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} /> Warden Guidelines
              </h4>

              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
                <li><strong>Verified Ground Facts:</strong> Attach photos with exact GPS coordinate data for quick AI triage.</li>
                <li><strong>Upvote Proposals:</strong> Upvote priority neighborhood issues to boost municipal budget allocation.</li>
                <li><strong>Earn Karma Points:</strong> Resolved issues grant 100+ points toward civic rank badges.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* CREATE NEW DISCUSSION MODAL */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
          }}
          onClick={() => setShowModal(false)}
        >
          <form 
            className="card" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePost}
          >
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Start a Community Discussion</h3>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Discussion Category</label>
              <select 
                className="form-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
              >
                <option value="Proposal">Proposal (Infrastructure Improvement)</option>
                <option value="Spotlight">Spotlight (Verified Fix Appreciation)</option>
                <option value="Announcement">Announcement (Public Meeting / Event)</option>
                <option value="Discussion">General Ward Discussion</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Title / Headline</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="e.g. Proposal for Solar Streetlights along Main Avenue"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Discussion Content</label>
              <textarea 
                className="form-textarea"
                placeholder="Describe your proposal or idea in detail for local neighborhood residents to discuss and upvote..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Publish Discussion
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
