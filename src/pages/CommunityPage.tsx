import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  BarChart2, 
  Repeat, 
  CheckCircle, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Smile, 
  PartyPopper,
  ArrowRight,
  Building2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type PostType = 'ngo' | 'municipality' | 'citizen';

interface Post {
  id: number;
  type: PostType;
  author: string;
  handle: string;
  time: string;
  avatar?: string;
  avatarImg?: string;
  verified?: boolean;
  content: string;
  hashtags?: string;
  image?: string;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  isLiked: boolean;
}

export default function CommunityPage() {
  const { t } = useLanguage();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'ngo' | 'municipality'>('all');
  const [newPostContent, setNewPostContent] = useState('');

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      type: 'ngo',
      author: 'Green Earth Foundation',
      handle: '@greenearth',
      time: '2h ago',
      avatar: 'GE',
      verified: true,
      content: 'Join us this Saturday for our monthly plantation drive at Central Park! We aim to plant 500 saplings. 🌳',
      hashtags: '#GreenDistrict04 #Sustainability',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKTz2M47WRUFb_0y8zyWqJ0w12eEFcfJYdhZvTwszUItAJhpvRM3UYfrZOZjp6HF_gB7ojhV7OLevYFMpXESBZe2vTFrRCdDGNcZ_LQvon1PvqwqHGMI20oYe7WVR4GKqJHzwN2IpN0UTjORFbXy2DfVAv5OLsLD4TUleTGhVmJx9soVENCdcakx0NrYW4E9-2sgsenmhyoxyDU_8-3djNMy2fv-5kLu48qnVGrTJn8N69-ZajzFPI',
      likes: 156,
      comments: 24,
      views: 2400,
      shares: 12,
      isLiked: false,
    },
    {
      id: 2,
      type: 'municipality',
      author: 'District 04 Municipality',
      handle: '@district04',
      time: '8h ago',
      verified: true,
      content: 'Starting next Monday, we are introducing mandatory waste segregation (Wet/Dry/Hazardous). Please check the portal for your new collection schedule. ♻️',
      likes: 340,
      comments: 56,
      views: 8900,
      shares: 89,
      isLiked: false,
    },
    {
      id: 3,
      type: 'citizen',
      author: 'Alex Rivera',
      handle: '@arivera',
      time: '5h ago',
      avatarImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbdHACLquG0c8H5tnOp6OnHE-3Z8PSRY33VJg9x2H9TZZJpBj0qKk4aRVJrImKjRuErsn-rcwmo9YnclaWRxrteb4ScTUa0o6LV8OEwWXBu-pBm33v6V_zoPlAmjcwCfL-x0UyAOhtMYWMqxJG6PqELmaeZv4u5ofWMe1e6ZaI7hOd2O--NWc_N7Gxm_s7uemWIchcZpnlmEgPLs8fUS08gPl9FDx745NuzECeTwJPc31zfYDxmVNE',
      content: "Spent the morning cleaning up the litter near the Sector 4 playground. It's looking much better now! Let's keep our neighborhood clean. 🧹✨",
      likes: 42,
      comments: 8,
      views: 320,
      shares: 2,
      isLiked: false,
    }
  ]);

  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      type: 'citizen',
      author: 'Current User', // Mocked user data
      handle: '@currentuser',
      time: 'Just now',
      avatarImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbdHACLquG0c8H5tnOp6OnHE-3Z8PSRY33VJg9x2H9TZZJpBj0qKk4aRVJrImKjRuErsn-rcwmo9YnclaWRxrteb4ScTUa0o6LV8OEwWXBu-pBm33v6V_zoPlAmjcwCfL-x0UyAOhtMYWMqxJG6PqELmaeZv4u5ofWMe1e6ZaI7hOd2O--NWc_N7Gxm_s7uemWIchcZpnlmEgPLs8fUS08gPl9FDx745NuzECeTwJPc31zfYDxmVNE',
      content: newPostContent,
      likes: 0,
      comments: 0,
      views: 0,
      shares: 0,
      isLiked: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setActiveTab('all'); // switch to all to see the new post
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'ngo') return post.type === 'ngo';
    if (activeTab === 'municipality') return post.type === 'municipality';
    return true; // 'all'
  });

  const getPostData = (post: Post) => {
    if (post.id === 1) {
      return {
        author: t('community.posts.post1.author'),
        content: t('community.posts.post1.content'),
        hashtags: t('community.posts.post1.hashtags'),
        time: t('community.posts.2h')
      };
    }
    if (post.id === 2) {
      return {
        author: t('community.posts.post2.author'),
        content: t('community.posts.post2.content'),
        hashtags: '',
        time: t('community.posts.8h')
      };
    }
    if (post.id === 3) {
      return {
        author: t('community.posts.post3.author'),
        content: t('community.posts.post3.content'),
        hashtags: '',
        time: t('community.posts.5h')
      };
    }
    return {
      author: post.author === 'Current User' ? t('community.posts.currentUser') : post.author,
      content: post.content,
      hashtags: post.hashtags || '',
      time: post.time === 'Just now' ? t('community.posts.justNow') : post.time
    };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px', minHeight: 'calc(100vh - 150px)' }}>
      
      {/* Header Section with Integrated Composer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end', 
        flexWrap: 'wrap', 
        gap: '24px',
        marginBottom: '40px' 
      }}>
        <div>
          <h1 style={{ marginBottom: '16px' }}>{t('community.title')}</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ borderRadius: '24px', background: activeTab !== 'all' ? 'var(--surface)' : undefined }}
              onClick={() => setActiveTab('all')}
            >
              {t('community.tab.all')}
            </button>
            <button 
              className={`btn ${activeTab === 'ngo' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ borderRadius: '24px', background: activeTab !== 'ngo' ? 'var(--surface)' : undefined }}
              onClick={() => setActiveTab('ngo')}
            >
              {t('community.tab.ngo')}
            </button>
            <button 
              className={`btn ${activeTab === 'municipality' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ borderRadius: '24px', background: activeTab !== 'municipality' ? 'var(--surface)' : undefined }}
              onClick={() => setActiveTab('municipality')}
            >
              {t('community.tab.municipality')}
            </button>
          </div>
        </div>
        
        <div className="card" style={{ flex: '1 1 400px', maxWidth: '500px', display: 'flex', gap: '16px', padding: '16px' }}>
          <img
            alt="User avatar"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbdHACLquG0c8H5tnOp6OnHE-3Z8PSRY33VJg9x2H9TZZJpBj0qKk4aRVJrImKjRuErsn-rcwmo9YnclaWRxrteb4ScTUa0o6LV8OEwWXBu-pBm33v6V_zoPlAmjcwCfL-x0UyAOhtMYWMqxJG6PqELmaeZv4u5ofWMe1e6ZaI7hOd2O--NWc_N7Gxm_s7uemWIchcZpnlmEgPLs8fUS08gPl9FDx745NuzECeTwJPc31zfYDxmVNE"
          />
          <div style={{ flex: 1 }}>
              <textarea
                className="form-textarea"
                style={{ 
                  minHeight: '40px', 
                  border: 'none', 
                  background: 'transparent', 
                  padding: '0', 
                  marginBottom: '12px',
                  resize: 'none',
                  width: '100%',
                  outline: 'none',
                  color: 'var(--text-1)'
                }}
                placeholder={t('community.composer.placeholder')}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', color: 'var(--text-3)' }}>
                  <ImageIcon size={18} style={{ cursor: 'pointer' }} className="text-muted hover-color" />
                  <BarChart2 size={18} style={{ cursor: 'pointer' }} className="text-muted hover-color" />
                  <Smile size={18} style={{ cursor: 'pointer' }} className="text-muted hover-color" />
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '6px 20px', borderRadius: '8px' }}
                  onClick={handlePost}
                  disabled={!newPostContent.trim()}
                >
                  {t('community.composer.button')}
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {filteredPosts.map(post => {
          const postData = getPostData(post);
          return (
            <div 
              key={post.id}
              className="card hover-card" 
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredCard(post.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {post.type === 'municipality' ? (
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'var(--text-1)', 
                        color: 'var(--bg)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Building2 size={20} />
                      </div>
                    ) : post.avatarImg ? (
                      <img 
                        src={post.avatarImg} 
                        alt={postData.author}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'var(--surface-2)', 
                        border: '1px solid var(--border)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--text-1)'
                      }}>
                        {post.avatar}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px' }}>{postData.author}</h3>
                        {post.verified && <CheckCircle size={14} style={{ color: 'var(--text-1)' }} />}
                      </div>
                      <span className="text-mono text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                        {post.handle} • {postData.time}
                      </span>
                    </div>
                  </div>
                  <MoreHorizontal size={18} className="text-muted" style={{ cursor: 'pointer' }} />
                </div>
                
                <div style={{ 
                  background: post.type === 'municipality' ? 'var(--surface-2)' : 'transparent',
                  padding: post.type === 'municipality' ? '16px' : '0',
                  borderRadius: post.type === 'municipality' ? '8px' : '0',
                  borderLeft: post.type === 'municipality' ? '4px solid var(--primary)' : 'none',
                  marginBottom: '16px' 
                }}>
                  <p style={{ margin: 0, color: 'var(--text-1)', fontSize: '14px', lineHeight: '1.6', fontWeight: post.type === 'municipality' ? 500 : 400 }}>
                    {postData.content} {postData.hashtags && <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{postData.hashtags}</span>}
                  </p>
                </div>
              </div>
            
            {post.image && (
              <div style={{ padding: '0 20px 20px 20px', overflow: 'hidden' }}>
                <img 
                  src={post.image} 
                  alt="Post Attachment" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px', 
                    maxHeight: '220px', 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                    transform: hoveredCard === post.id ? 'scale(1.03)' : 'scale(1)'
                  }} 
                />
              </div>
            )}
            
            {/* Engagement Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: post.type === 'ngo' ? 'var(--surface-2)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: post.isLiked ? 'var(--danger)' : 'var(--text-2)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                >
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} /> 
                  <span className="text-mono" style={{ fontSize: '12px' }}>{formatNumber(post.likes)}</span>
                </div>
                
                {post.type === 'municipality' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)', cursor: 'pointer' }}>
                    <Repeat size={16} /> <span className="text-mono" style={{ fontSize: '12px' }}>{formatNumber(post.shares)}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)', cursor: 'pointer' }}>
                    <MessageCircle size={16} /> <span className="text-mono" style={{ fontSize: '12px' }}>{formatNumber(post.comments)}</span>
                  </div>
                )}
              </div>
              
              {post.type === 'municipality' ? (
                <button style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: 'var(--text-1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}>
                  {t('community.posts.viewSchedule')} <ArrowRight size={14} />
                </button>
              ) : post.type === 'citizen' ? (
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--surface)', background: 'var(--border)', zIndex: 2 }}></div>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--surface)', background: 'var(--text-3)', marginLeft: '-10px', zIndex: 1 }}></div>
                  <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-2)', marginLeft: '6px' }}>{t('community.posts.others')}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)' }}>
                  <BarChart2 size={16} /> <span className="text-mono" style={{ fontSize: '12px' }}>{formatNumber(post.views)}</span>
                </div>
              )}
            </div>
            
            {/* Comments Preview for NGO */}
            {post.type === 'ngo' && (
              <div style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }}></div>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>@sarahj</span> {t('community.posts.comment1')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0 }}></div>
                  <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-2)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>@mwilson</span> {t('community.posts.comment2')}
                  </p>
                </div>
              </div>
            )}
          </div>
          );
        })}

        {/* Static Call to Action Card (Shows only on 'all' or 'citizen' tab) */}
        {(activeTab === 'all' || activeTab === 'citizen') && (
          <div className="card hover-card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'var(--surface-2)', 
              border: '1px solid var(--border)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <PartyPopper size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{t('community.cta.title')}</h3>
              <p className="text-muted" style={{ margin: 0 }}>
                {t('community.cta.desc')}
              </p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              {t('community.cta.button')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
