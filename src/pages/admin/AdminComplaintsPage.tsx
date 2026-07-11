import React, { useEffect, useState } from 'react';
import { AdminKanbanBoard } from './AdminKanbanBoard';
import { AdminEscalationDetails } from './AdminEscalationDetails';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { TranslationKey } from '../../i18n';
import { 
  AlertTriangle, Lightbulb, Droplet, Trash2, HelpCircle, 
  Search, Check, Clock, Shield, Filter, Eye, AlertOctagon, X, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: number;
  severityReason?: string;
  status: 'reported' | 'verified' | 'in_progress' | 'resolved';
  address: string;
  imageUrl?: string;
  resolvedImageUrl?: string;
  reportedBy: string;
  reporterName: string;
  createdAt: any;
  updatedAt: any;
  resolvedAt?: any;
  estimatedResolutionDays?: number;
  verificationReason?: string;
  assignedDepartment?: string;
  routingReason?: string;
}

const AdminComplaintsPage: React.FC = () => {
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [showEscalation, setShowEscalation] = useState(false);
  
  // Selected Issue for Sidebar/Detail view
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [estDays, setEstDays] = useState<number>(3);
  
  // Resolution Proof Upload State
  const [resolvedImage, setResolvedImage] = useState<string | null>(null);

  const handleResolvedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setResolvedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [routingLoading, setRoutingLoading] = useState(false);

  const handleAutoRoute = async (issue: Issue) => {
    setRoutingLoading(true);
    try {
      const res = await fetchWithAuth('/api/agents/route-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: issue.title, description: issue.description })
      });
      const data = await res.json();
      if (data.department) {
        if (isFirebaseConfigured && auth.currentUser) {
          const docRef = doc(db, 'issues', issue.id);
          await updateDoc(docRef, {
            assignedDepartment: data.department,
            routingReason: data.reasoning
          });
        }
        
        const updated = { 
          assignedDepartment: data.department, 
          routingReason: data.reasoning 
        };
        setSelectedIssue(prev => prev ? { ...prev, ...updated } : null);
        setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, ...updated } : i));
        toast.success(`Automatically routed to ${data.department}!`);
      } else {
        toast.error('Failed to get routing decision');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to run Routing Agent');
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleManualRoute = async (issueId: string, dept: string) => {
    try {
      if (isFirebaseConfigured && auth.currentUser) {
        const docRef = doc(db, 'issues', issueId);
        await updateDoc(docRef, {
          assignedDepartment: dept,
          routingReason: 'Manually updated by Administrator.'
        });
      }
      
      const updated = { 
        assignedDepartment: dept, 
        routingReason: 'Manually updated by Administrator.' 
      };
      setSelectedIssue(prev => prev ? { ...prev, ...updated } : null);
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updated } : i));
      toast.success(`Manually routed to ${dept}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to manually update routing');
    }
  };

  useEffect(() => {
    const dummyIssue: Issue = {
      id: 'CP-1045',
      title: 'Severe Road Damage & Fallen Tree',
      description: 'Massive fallen tree entangling power lines blocking the main road. Immediate multi-department coordination required.',
      category: 'other',
      severity: 5,
      status: 'blocked' as any,
      address: 'Mango Chowk',
      reportedBy: 'user-001',
      reporterName: 'Rahul Kumar',
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
      updatedAt: { seconds: Math.floor(Date.now() / 1000) },
      assignedDepartment: 'Road Department',
      imageUrl: 'https://images.unsplash.com/photo-1598285514605-643f820c7416?q=80&w=600&auto=format&fit=crop'
    };

    if (!isFirebaseConfigured) {
      setIssues([dummyIssue]);
      setLoading(false);
      return;
    }

    const issuesRef = collection(db, 'issues');
    const unsubscribe = onSnapshot(issuesRef, (snapshot) => {
      let list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Issue));
      list.push(dummyIssue);
      // Sort: most recent first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setIssues(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to listen to issues:', err);
      setIssues([dummyIssue]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pothole': return <AlertTriangle size={15} color="var(--danger)" />;
      case 'streetlight': return <Lightbulb size={15} color="var(--warning)" />;
      case 'water': return <Droplet size={15} color="var(--primary)" />;
      case 'waste': return <Trash2 size={15} color="var(--success)" />;
      default: return <HelpCircle size={15} color="var(--text-3)" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'reported':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', label: 'Reported' };
      case 'verified':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', label: 'Verified' };
      case 'in_progress':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', label: 'In Progress' };
      case 'resolved':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', label: 'Resolved' };
      default:
        return { bg: 'var(--surface-2)', color: 'var(--text-3)', label: status };
    }
  };

  const getSeverityStyle = (severity: number) => {
    if (severity >= 4) return { borderLeft: '4px solid #EF4444', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.05)' };
    if (severity >= 3) return { borderLeft: '4px solid #F59E0B', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.05)' };
    return { borderLeft: '4px solid #10B981', color: '#10B981', bg: 'rgba(16, 185, 129, 0.05)' };
  };

  const handleUpdateStatus = async (issueId: string, newStatus: 'verified' | 'in_progress' | 'resolved') => {
    setUpdatingStatus(true);
    try {
      const docRef = doc(db, 'issues', issueId);
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'resolved') {
        if (!resolvedImage) {
          toast.error("Proof-of-work image is mandatory to mark the issue resolved.");
          setUpdatingStatus(false);
          return;
        }

        toast.loading("Uploading resolution proof...", { id: 'resolved-upload' });

        // Upload photo to Firebase Storage
        let resolvedImageUrlStr = "https://picsum.photos/seed/resolved/800/600";
        try {
          if (resolvedImage.startsWith('data:')) {
            const imageId = `resolved_${Date.now()}`;
            const storageRef = ref(storage, `resolutions/${imageId}.jpg`);
            
            // Upload with a 5-second timeout to prevent getting stuck
            const uploadPromise = uploadString(storageRef, resolvedImage, 'data_url')
              .then(() => getDownloadURL(storageRef));
              
            const timeoutPromise = new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error("Resolution proof upload timed out")), 5000)
            );

            resolvedImageUrlStr = await Promise.race([uploadPromise, timeoutPromise]);
          } else {
            resolvedImageUrlStr = resolvedImage;
          }
        } catch (uploadErr) {
          console.warn("Storage upload bypassed or timed out for resolution proof:", uploadErr);
          resolvedImageUrlStr = resolvedImage; // fallback
        }

        updates.resolvedImageUrl = resolvedImageUrlStr;
        updates.resolvedAt = serverTimestamp();
        updates.verificationReason = closingNotes || 'Resolved by Ward Administrator.';
        toast.success("Resolution proof uploaded!", { id: 'resolved-upload' });
      }
      if (newStatus === 'in_progress') {
        updates.estimatedResolutionDays = estDays;
      }

      if (isFirebaseConfigured && auth.currentUser) {
        await updateDoc(docRef, updates);
      } else {
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, ...updates } : i));
      }
      
      // Update local selection state
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(prev => prev ? { ...prev, ...updates } : null);
      }

      toast.success(`Complaint status updated to ${newStatus.toUpperCase()}`);
      setClosingNotes('');
      setResolvedImage(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter lists
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || issue.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      
      {/* List Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Header & Toggle */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {t('admin.portal')}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-1)', marginTop: 4 }}>
              {t('admin.complaints.title')}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
              {t('admin.complaints.subtitle')}
            </p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setViewMode('table')} 
              style={{ background: viewMode === 'table' ? 'var(--bg)' : 'transparent', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: viewMode === 'table' ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Table View
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              style={{ background: viewMode === 'kanban' ? 'var(--bg)' : 'transparent', border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: viewMode === 'kanban' ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              Kanban Board
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 16, 
          padding: 12, 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 8,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder={t('admin.complaints.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={12} color="var(--text-3)" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">{t('admin.complaints.filterAllStatus')}</option>
              <option value="reported">{t('admin.dashboard.reported')}</option>
              <option value="verified">{t('home.stats.verified')}</option>
              <option value="in_progress">{t('admin.dashboard.inProgress')}</option>
              <option value="resolved">{t('admin.dashboard.resolved')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">{t('admin.complaints.filterAllCategory')}</option>
            <option value="pothole">{t('report.category.pothole')}</option>
            <option value="streetlight">{t('report.category.streetlight')}</option>
            <option value="water">{t('report.category.water')}</option>
            <option value="waste">{t('report.category.waste')}</option>
          </select>
        </div>

        {/* Complaints Table/List */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-3)', fontSize: '13px' }}>
              Syncing live ward database...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: 'var(--text-3)', fontSize: '13px' }}>
              No active complaints matching the criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredIssues.map(issue => {
                const statusStyle = getStatusStyle(issue.status);
                const severityStyle = getSeverityStyle(issue.severity);
                const dateStr = issue.createdAt?.seconds 
                  ? new Date(issue.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Just now';

                return (
                  <div 
                    key={issue.id}
                    onClick={() => {
                      setSelectedIssue(issue);
                      setEstDays(issue.estimatedResolutionDays || 3);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      background: selectedIssue?.id === issue.id ? 'var(--primary-subtle)' : 'transparent',
                      transition: 'background 0.15s',
                      ...severityStyle
                    }}
                  >
                    {/* Category Icon */}
                    <div style={{ marginRight: 14 }}>
                      {getCategoryIcon(issue.category)}
                    </div>

                    {/* Title & Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {issue.title}
                        </span>
                        <span style={{ fontSize: '10px', background: 'var(--surface-2)', color: 'var(--text-2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                          Sev {issue.severity}
                        </span>
                        {issue.assignedDepartment && (
                          <span style={{ fontSize: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}>
                            🏢 {issue.assignedDepartment}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>
                        {issue.address}
                      </div>
                    </div>

                    {/* Time */}
                    <div style={{ width: 120, fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {dateStr}
                    </div>

                    {/* Status Pill */}
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '11px',
                      fontWeight: 600,
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      textAlign: 'center',
                      minWidth: 85
                    }}>
                      {statusStyle.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Side Detail Panel */}
      {selectedIssue && (
        <div style={{
          width: '380px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 10px -5px rgba(0,0,0,0.05)',
          animation: 'slideIn 0.2s ease'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="var(--primary)" /> Detail Inspection
            </span>
            <button 
              onClick={() => setSelectedIssue(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Details Scroll */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedIssue.imageUrl && (
              <img 
                src={selectedIssue.imageUrl} 
                alt="Distress location" 
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
              />
            )}

            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>{selectedIssue.title}</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginTop: 2 }}>{selectedIssue.address}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Category</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {getCategoryIcon(selectedIssue.category)} {selectedIssue.category.toUpperCase()}
                </span>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Severity Assessment</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: getSeverityStyle(selectedIssue.severity).color, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <AlertOctagon size={12} /> LEVEL {selectedIssue.severity}/5
                </span>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', background: 'var(--surface-2)' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{t('map.hazard.description')}</span>
              <p style={{ fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{selectedIssue.description}</p>
            </div>

            {selectedIssue.status === 'blocked' && (
              <div style={{ border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: 6, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.05)' }}>
                <span style={{ fontSize: '9px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6, fontWeight: 700 }}>
                  <AlertTriangle size={10} /> Blocking Reason & Estimated Delay
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>
                  {selectedIssue.id === 'CP-1045' 
                    ? "Blocked by Forest Dept (Fallen Tree) & Electricity Dept (Live Wires). Requires Traffic Police for road closure. Expected delay: 4 hours." 
                    : "Task is blocked pending external dependencies."}
                </p>
              </div>
            )}

            {selectedIssue.severityReason && (
              <div style={{ padding: '4px 0' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>{t('report.ai.success')}</span>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.4, margin: '4px 0 0 0' }}>{selectedIssue.severityReason}</p>
              </div>
            )}

            {/* Department Routing Section */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-2)' }}>
              <span style={{ fontSize: '9px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{t('admin.complaints.assignedDept')}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                {selectedIssue.assignedDepartment ? (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🏢 {selectedIssue.assignedDepartment}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>
                    {t('report.location.notDetected')}
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={() => handleAutoRoute(selectedIssue)}
                  disabled={routingLoading}
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {routingLoading ? t('admin.complaints.routing') : t('admin.complaints.routeAgent')}
                </button>
              </div>

              {selectedIssue.routingReason && (
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  <strong>{t('admin.complaints.reasoning')}:</strong> {selectedIssue.routingReason}
                </p>
              )}

              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '10px', color: 'var(--text-3)' }}>{t('admin.complaints.manualRoute')}</label>
                <select
                  value={selectedIssue.assignedDepartment || ''}
                  onChange={(e) => handleManualRoute(selectedIssue.id, e.target.value)}
                  style={{
                    padding: '6px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-1)',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <option value="" disabled>{t('admin.complaints.selectDept')}</option>
                  <option value="KMC">KMC (Municipal Corp)</option>
                  <option value="PWD">PWD (Roads & Light)</option>
                  <option value="Police">Police (Traffic/Safety)</option>
                  <option value="Water Board">Water Board (Sewerage/Leaks)</option>
                </select>
              </div>
            </div>

            {/* Actions Panel */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 12 }}>{t('admin.complaints.updateStatus')}</span>

              {selectedIssue.status !== 'resolved' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  
                  {/* Worker Complaint & Auto-escalation (Only for blocked issues) */}
                  {selectedIssue.status === 'blocked' && (
                    <div style={{ border: '1px solid #f59e0b', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(245, 158, 11, 0.05)' }}>
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} /> Worker Ground Report
                      </span>
                      <p style={{ fontSize: '11px', color: 'var(--text-1)', margin: 0, fontStyle: 'italic', background: 'var(--surface)', padding: 8, borderRadius: 4, borderLeft: '2px solid #f59e0b' }}>
                        "Heavy live wires scattered. Can't proceed safely without power cut and traffic diversion." — Rahul Kumar (On Site)
                      </p>
                      
                      <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Auto-Escalation Suggestion</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-1)' }}>Alert: Electricity & Traffic Dept</span>
                          <button style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}>
                            ESCALATE NOW
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mark In Progress controls */}
                  {(selectedIssue.status === 'reported' || selectedIssue.status === 'verified' || selectedIssue.status === 'blocked') && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}>
                        {t('dashboard.reports.sla')} (Days)
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input 
                          type="number"
                          min={1}
                          max={30}
                          value={estDays}
                          onChange={e => setEstDays(parseInt(e.target.value) || 1)}
                          style={{
                            width: '60px',
                            padding: '6px',
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text-1)',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleUpdateStatus(selectedIssue.id, 'in_progress')}
                          disabled={updatingStatus}
                          style={{
                            flex: 1,
                            background: 'var(--primary)',
                            color: 'var(--bg)',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '6px 12px'
                          }}
                        >
                          {updatingStatus ? t('app.loading') : t('admin.dashboard.inProgress')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mark Resolved controls */}
                  {(selectedIssue.status === 'in_progress' || selectedIssue.status === 'blocked') && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500 }}>
                        {t('admin.complaints.closingNotes')}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={t('detail.resolve.placeholder')}
                        value={closingNotes}
                        onChange={e => setClosingNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text-1)',
                          fontSize: '11px',
                          resize: 'none',
                          outline: 'none'
                        }}
                      />

                      <label style={{ fontSize: '11px', color: 'var(--text-2)', fontWeight: 500, marginTop: 4 }}>
                        {t('admin.complaints.proofImage')}
                      </label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleResolvedImageChange}
                        style={{ display: 'none' }}
                        id="resolution-proof-file"
                      />
                      
                      {resolvedImage ? (
                        <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                          <img src={resolvedImage} alt="Resolved proof preview" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setResolvedImage(null)}
                            style={{
                              position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#FFF', 
                              border: 'none', borderRadius: '50%', cursor: 'pointer', width: 20, height: 20,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label 
                          htmlFor="resolution-proof-file"
                          style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 6,
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: 'var(--surface-2)',
                            color: 'var(--text-3)',
                            fontSize: '11px',
                            textAlign: 'center',
                            gap: 4
                          }}
                        >
                          <Camera size={16} />
                          <span>{t('admin.complaints.selectFile')}</span>
                        </label>
                      )}

                      <button
                        onClick={() => handleUpdateStatus(selectedIssue.id, 'resolved')}
                        disabled={updatingStatus || !closingNotes.trim() || !resolvedImage}
                        style={{
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: (closingNotes.trim() && resolvedImage) ? 'pointer' : 'not-allowed',
                          padding: '8px 12px',
                          opacity: (closingNotes.trim() && resolvedImage) ? 1 : 0.6,
                          marginTop: 8
                        }}
                      >
                        {updatingStatus ? t('app.loading') : t('admin.complaints.submitResolution')}
                      </button>
                    </div>
                  )}

                  {/* Manual verified toggle */}
                  {selectedIssue.status === 'reported' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedIssue.id, 'verified')}
                      disabled={updatingStatus}
                      style={{
                        background: 'transparent',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary)',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '8px 12px',
                        transition: 'background 0.15s'
                      }}
                    >
                      {t('home.stats.verified')}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: 6, 
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> Completed & Closed
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: 4 }}>
                    <strong>Closing Note:</strong> {selectedIssue.verificationReason || 'No notes left.'}
                  </span>
                  {selectedIssue.resolvedAt && (
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      Closed on {new Date(selectedIssue.resolvedAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  )}
                  {selectedIssue.resolvedImageUrl && (
                    <img 
                      src={selectedIssue.resolvedImageUrl} 
                      alt="Resolution proof" 
                      style={{ 
                        width: '100%', 
                        height: '140px', 
                        objectFit: 'cover', 
                        borderRadius: 6, 
                        border: '1px solid rgba(16, 185, 129, 0.2)', 
                        marginTop: 8 
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Escalation Details Modal */}
      {showEscalation && (
        <AdminEscalationDetails onClose={() => setShowEscalation(false)} />
      )}
    </div>
  );
};

export default AdminComplaintsPage;
