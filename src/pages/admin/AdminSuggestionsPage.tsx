import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Lightbulb, Search, Filter, RefreshCw, ThumbsUp, MapPin,
  Building2, Calendar, User, Eye, X, Check, Clock, AlertTriangle,
  Flame, CheckCircle2, XCircle, ArrowRight, ExternalLink, Sparkles,
  Layers, ChevronRight, MessageSquare, Volume2, Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminSuggestionsKanban } from './AdminSuggestionsKanban';
import { RANCHI_DEVELOPMENT_SUGGESTIONS, forceSyncSuggestionsToFirestore } from '../../utils/seedData';

export interface DevelopmentSuggestion {
  id: string;
  type?: 'DEVELOPMENT_NEED';
  title: string;
  description: string;
  description_original?: string;
  description_english?: string;
  category: string;
  subCategory?: string;
  infrastructureType?: string;
  intent?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  priority?: number;
  status: 'suggested' | 'under_review' | 'in_planning' | 'approved' | 'rejected' | 'completed';
  address: string;
  ward?: string;
  lat?: number;
  lng?: number;
  location?: { lat: number; lng: number; address: string };
  upvotes?: string[];
  imageUrl?: string;
  images?: string[];
  reportedBy?: string;
  reporterName?: string;
  userId?: string;
  department?: string;
  assignedDepartment?: string;
  source?: 'web' | 'voice' | 'ivr';
  language?: string;
  confidence?: number;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: any;
  createdAt: any;
  updatedAt?: any;
}

const DEPARTMENTS = [
  'Road Construction Department (RCD)',
  'Health & Family Welfare Department, Jharkhand',
  'RMC Urban Mobility & Transport Cell',
  'Department of School Education & Literacy',
  'Drinking Water & Sanitation Department (DWSD)',
  'RMC Parks & Beautification Wing',
  'RMC Solid Waste Management Cell',
  'Jharkhand Renewable Energy Development Agency (JREDA)',
  'RMC Electrical & Streetlighting Cell',
  'Jharkhand Bijli Vitran Nigam Limited (JBVNL)',
  'RMC Town Planning & Engineering Cell',
];

export default function AdminSuggestionsPage() {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<DevelopmentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Selected Suggestion for Slide-Over Inspector Drawer
  const [selectedSuggestion, setSelectedSuggestion] = useState<DevelopmentSuggestion | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);

  // Sync / Seed Firestore suggestions
  const handleSyncSuggestionsData = async () => {
    setSyncing(true);
    try {
      const result = await forceSyncSuggestionsToFirestore(true);
      if (result.success) {
        toast.success(`Synced ${result.count || 8} municipal development suggestions!`);
      } else {
        toast.success('Municipal development suggestions updated!');
      }
    } catch (err: any) {
      console.error('Failed to sync suggestions:', err);
      toast.error('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSyncing(false);
    }
  };

  // Real-time Firestore Listener
  useEffect(() => {
    const fallbackList = RANCHI_DEVELOPMENT_SUGGESTIONS as DevelopmentSuggestion[];

    if (!isFirebaseConfigured) {
      setSuggestions(fallbackList);
      setLoading(false);
      return;
    }

    const suggestionsRef = collection(db, 'suggestions');
    const unsubscribe = onSnapshot(
      suggestionsRef,
      (snapshot) => {
        let list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as DevelopmentSuggestion[];

        if (list.length === 0) {
          list = fallbackList;
        }

        // Sort newest first
        list.sort((a, b) => {
          const timeA =
            a.createdAt?.seconds ||
            (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : 0);
          const timeB =
            b.createdAt?.seconds ||
            (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : 0);
          return timeB - timeA;
        });

        setSuggestions(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Failed to listen to suggestions, loading fallback:', err);
        setSuggestions(fallbackList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync selected suggestion's notes when selected
  useEffect(() => {
    if (selectedSuggestion) {
      setAdminNotesInput(selectedSuggestion.adminNotes || '');
    }
  }, [selectedSuggestion?.id]);

  // Update Status in Firestore
  const handleUpdateStatus = async (
    newStatus: DevelopmentSuggestion['status'],
    notesOverride?: string
  ) => {
    if (!selectedSuggestion) return;
    setUpdatingStatus(true);
    try {
      const updates: any = {
        status: newStatus,
        adminNotes: notesOverride !== undefined ? notesOverride : adminNotesInput,
        reviewedBy: auth.currentUser?.email || 'Ward Urban Planner',
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (isFirebaseConfigured && auth.currentUser) {
        const docRef = doc(db, 'suggestions', selectedSuggestion.id);
        await updateDoc(docRef, updates);
      } else {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === selectedSuggestion.id ? { ...s, ...updates } : s))
        );
      }

      setSelectedSuggestion((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success(`Proposal status updated to ${newStatus.toUpperCase().replace('_', ' ')}!`);
    } catch (err) {
      console.error('Failed to update suggestion status:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Update Assigned Department
  const handleAssignDepartment = async (dept: string) => {
    if (!selectedSuggestion) return;
    try {
      const updates: any = {
        assignedDepartment: dept,
        department: dept,
        updatedAt: serverTimestamp(),
      };

      if (isFirebaseConfigured && auth.currentUser) {
        const docRef = doc(db, 'suggestions', selectedSuggestion.id);
        await updateDoc(docRef, updates);
      } else {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === selectedSuggestion.id ? { ...s, ...updates } : s))
        );
      }

      setSelectedSuggestion((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success(`Assigned to ${dept}`);
    } catch (err) {
      console.error('Failed to reassign department:', err);
      toast.error('Failed to assign department');
    }
  };

  // AI Auto-Route Department
  const handleAutoRoute = async () => {
    if (!selectedSuggestion) return;
    setRoutingLoading(true);
    try {
      const res = await fetchWithAuth('/api/agents/route-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedSuggestion.title,
          description: selectedSuggestion.description_english || selectedSuggestion.description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.department) {
          await handleAssignDepartment(data.department);
          toast.success(`AI routed to: ${data.department}`);
          return;
        }
      }

      // Fallback heuristic based on category
      let targetDept = 'RMC Town Planning & Engineering Cell';
      const cat = (selectedSuggestion.category || '').toLowerCase();
      if (cat.includes('road') || cat.includes('footpath') || cat.includes('traffic')) {
        targetDept = 'Road Construction Department (RCD)';
      } else if (cat.includes('health') || cat.includes('clinic') || cat.includes('hospital')) {
        targetDept = 'Health & Family Welfare Department, Jharkhand';
      } else if (cat.includes('transport') || cat.includes('bus') || cat.includes('transit')) {
        targetDept = 'RMC Urban Mobility & Transport Cell';
      } else if (cat.includes('education') || cat.includes('school') || cat.includes('lab')) {
        targetDept = 'Department of School Education & Literacy';
      } else if (cat.includes('water') || cat.includes('drain') || cat.includes('flood')) {
        targetDept = 'Drinking Water & Sanitation Department (DWSD)';
      } else if (cat.includes('park') || cat.includes('tree') || cat.includes('green')) {
        targetDept = 'RMC Parks & Beautification Wing';
      } else if (cat.includes('waste') || cat.includes('sanitation') || cat.includes('garbage')) {
        targetDept = 'RMC Solid Waste Management Cell';
      } else if (cat.includes('solar') || cat.includes('electric') || cat.includes('power')) {
        targetDept = 'Jharkhand Renewable Energy Development Agency (JREDA)';
      }

      await handleAssignDepartment(targetDept);
      toast.success(`AI routed to: ${targetDept}`);
    } catch (err) {
      console.warn('Auto route failed, applied heuristic:', err);
      toast.error('AI routing encountered network error');
    } finally {
      setRoutingLoading(false);
    }
  };

  // Save Notes Only
  const handleSaveNotes = async () => {
    if (!selectedSuggestion) return;
    setUpdatingStatus(true);
    try {
      const updates = {
        adminNotes: adminNotesInput,
        updatedAt: serverTimestamp(),
      };

      if (isFirebaseConfigured && auth.currentUser) {
        const docRef = doc(db, 'suggestions', selectedSuggestion.id);
        await updateDoc(docRef, updates);
      } else {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === selectedSuggestion.id ? { ...s, ...updates } : s))
        );
      }

      setSelectedSuggestion((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success('Admin review notes saved!');
    } catch (err) {
      console.error('Failed to save notes:', err);
      toast.error('Failed to save notes.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'suggested':
        return { label: 'Suggested', bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' };
      case 'under_review':
        return { label: 'Under Review', bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' };
      case 'in_planning':
        return { label: 'In Planning', bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' };
      case 'approved':
        return { label: 'Approved', bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
      case 'completed':
        return { label: 'Completed', bg: 'rgba(5, 150, 105, 0.15)', color: '#059669' };
      case 'rejected':
        return { label: 'Rejected', bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      default:
        return { label: status, bg: 'var(--surface-2)', color: 'var(--text-2)' };
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'critical':
        return { label: 'CRITICAL', bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' };
      case 'high':
        return { label: 'HIGH', bg: 'rgba(249, 115, 22, 0.12)', color: '#F97316' };
      case 'medium':
        return { label: 'MEDIUM', bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' };
      default:
        return { label: 'LOW', bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' };
    }
  };

  // Filtering
  const filteredSuggestions = suggestions.filter((sug) => {
    const matchesSearch =
      sug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sug.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sug.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sug.reporterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sug.ward || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      sug.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sug.status === statusFilter;
    const matchesCategory =
      categoryFilter === 'all' ||
      (sug.category || '').toLowerCase() === categoryFilter.toLowerCase();
    const matchesUrgency = urgencyFilter === 'all' || sug.urgency === urgencyFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesUrgency;
  });

  // KPI Metrics Calculation
  const totalCount = suggestions.length;
  const underReviewCount = suggestions.filter((s) => s.status === 'under_review').length;
  const inPlanningCount = suggestions.filter((s) => s.status === 'in_planning').length;
  const approvedCount = suggestions.filter((s) => s.status === 'approved' || s.status === 'completed').length;
  const highPriorityCount = suggestions.filter(
    (s) => s.urgency === 'critical' || s.urgency === 'high' || (s.priority && s.priority >= 4)
  ).length;
  const totalUpvotes = suggestions.reduce(
    (acc, s) => acc + (s.upvotes?.length || (s as any).citizenCount || 0),
    0
  );

  return (
    <div style={{ display: 'flex', gap: '24px', position: 'relative', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              MUNICIPAL URBAN PLANNING & CIVIC DEMAND
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Lightbulb size={24} style={{ color: 'var(--primary)' }} />
              Citizen Development Suggestions
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: 4 }}>
              Structured intake, participatory budgeting evaluation, and municipal triage for citizen infrastructure proposals.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleSyncSuggestionsData}
              disabled={syncing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-1)',
                fontSize: 12,
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease',
              }}
              title="Synchronize Ranchi civic development proposals in Firestore"
            >
              <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{syncing ? 'Syncing...' : 'Sync Suggestions'}</span>
            </button>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--surface-2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  background: viewMode === 'table' ? 'var(--bg)' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: viewMode === 'table' ? 'var(--text-1)' : 'var(--text-3)',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  background: viewMode === 'kanban' ? 'var(--bg)' : 'transparent',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: viewMode === 'kanban' ? 'var(--text-1)' : 'var(--text-3)',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Kanban Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid var(--primary)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Proposals
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' }}>{totalCount}</span>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid #F59E0B',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              Under Review
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B' }}>{underReviewCount}</span>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid #8B5CF6',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              In Planning / LDP
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#8B5CF6' }}>{inPlanningCount}</span>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid #10B981',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              Approved / Funded
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>{approvedCount}</span>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid #EF4444',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              High / Critical
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#EF4444' }}>{highPriorityCount}</span>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderRadius: '8px',
              borderLeft: '4px solid #EC4899',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>
              Citizen Upvotes
            </span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#EC4899' }}>{totalUpvotes}</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3)',
              }}
            />
            <input
              type="text"
              placeholder="Search proposals, ward, citizen, ID or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={12} color="var(--text-3)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="suggested">Suggested</option>
              <option value="under_review">Under Review</option>
              <option value="in_planning">In Planning</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              <option value="Roads">Roads & Footpaths</option>
              <option value="Public Transport">Public Transport</option>
              <option value="Healthcare">Healthcare & Clinics</option>
              <option value="Education">Education & Labs</option>
              <option value="Water">Water & Drainage</option>
              <option value="Sanitation">Sanitation & Bio-Waste</option>
              <option value="Parks">Parks & Greenery</option>
              <option value="Electricity">Electricity & Solar</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Urgencies</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Content Container (Table or Kanban) */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
              <div>Loading citizen development proposals...</div>
            </div>
          ) : viewMode === 'kanban' ? (
            <AdminSuggestionsKanban
              suggestions={filteredSuggestions}
              onSelectSuggestion={(sug) => setSelectedSuggestion(sug)}
            />
          ) : (
            /* Table View */
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-3)',
                      textTransform: 'uppercase',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '12px 14px' }}>ID & Title</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Urgency</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Ward / Location</th>
                    <th style={{ padding: '12px 14px' }}>Upvotes</th>
                    <th style={{ padding: '12px 14px' }}>Assigned Dept</th>
                    <th style={{ padding: '12px 14px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuggestions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--text-3)' }}>
                        No development suggestions match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSuggestions.map((sug) => {
                      const statusStyle = getStatusBadge(sug.status || 'suggested');
                      const urgencyStyle = getUrgencyBadge(sug.urgency);
                      const upvoteCount = sug.upvotes?.length || (sug as any).citizenCount || 0;
                      const isSelected = selectedSuggestion?.id === sug.id;

                      return (
                        <tr
                          key={sug.id}
                          onClick={() => setSelectedSuggestion(sug)}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* ID & Title */}
                          <td style={{ padding: '12px 14px', maxWidth: '300px' }}>
                            <div
                              style={{
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-3)',
                                marginBottom: '2px',
                              }}
                            >
                              {sug.id}
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-1)', lineHeight: '1.3' }}>
                              {sug.title}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                              By {sug.reporterName || 'Citizen'} • {sug.source ? sug.source.toUpperCase() : 'WEB'}
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: 'var(--surface-2)',
                                border: '1px solid var(--border)',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--text-2)',
                              }}
                            >
                              {sug.category || 'General'}
                            </span>
                            {sug.subCategory && (
                              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                                {sug.subCategory}
                              </div>
                            )}
                          </td>

                          {/* Urgency */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: urgencyStyle.bg,
                                color: urgencyStyle.color,
                                fontSize: '10px',
                                fontWeight: 700,
                              }}
                            >
                              {sug.urgency === 'critical' && <Flame size={10} />}
                              {urgencyStyle.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {statusStyle.label}
                            </span>
                          </td>

                          {/* Location / Ward */}
                          <td style={{ padding: '12px 14px', maxWidth: '180px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--text-2)',
                                fontSize: '11px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={sug.address}
                            >
                              <MapPin size={12} style={{ flexShrink: 0, color: 'var(--text-3)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sug.ward || sug.address}
                              </span>
                            </div>
                          </td>

                          {/* Upvotes */}
                          <td style={{ padding: '12px 14px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                color: upvoteCount > 0 ? 'var(--primary)' : 'var(--text-3)',
                                background: upvoteCount > 0 ? 'var(--primary-subtle)' : 'transparent',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <ThumbsUp size={12} />
                              <span>{upvoteCount}</span>
                            </div>
                          </td>

                          {/* Department */}
                          <td style={{ padding: '12px 14px', maxWidth: '180px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--text-2)',
                                fontSize: '11px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={sug.assignedDepartment || sug.department}
                            >
                              <Building2 size={12} style={{ flexShrink: 0, color: 'var(--primary)' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sug.assignedDepartment || sug.department || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* Action Button */}
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSuggestion(sug);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid var(--border)',
                                background: 'var(--surface-2)',
                                color: 'var(--text-1)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-Over Suggestion Inspector / Triage Drawer */}
      {selectedSuggestion && (
        <div
          style={{
            width: '440px',
            flexShrink: 0,
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            zIndex: 40,
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-3)',
                  }}
                >
                  {selectedSuggestion.id}
                </span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                  Proposal Details & Review
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSuggestion(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)',
                padding: '4px',
                display: 'flex',
              }}
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Title & Status Pills */}
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    ...getStatusBadge(selectedSuggestion.status || 'suggested'),
                  }}
                >
                  {getStatusBadge(selectedSuggestion.status || 'suggested').label.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    ...getUrgencyBadge(selectedSuggestion.urgency),
                  }}
                >
                  {getUrgencyBadge(selectedSuggestion.urgency).label} URGENCY
                </span>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    background: 'var(--surface-2)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {selectedSuggestion.category || 'General'}
                </span>
              </div>

              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 6px 0', lineHeight: '1.35' }}>
                {selectedSuggestion.title}
              </h2>
            </div>

            {/* Visual Attachment Photo Preview (if present) */}
            {(selectedSuggestion.imageUrl || (selectedSuggestion.images && selectedSuggestion.images[0])) && (
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', maxHeight: '200px' }}>
                <img
                  src={selectedSuggestion.imageUrl || selectedSuggestion.images![0]}
                  alt={selectedSuggestion.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Citizen Input vs Refined Description */}
            <div
              style={{
                background: 'var(--surface-2)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MessageSquare size={11} />
                  <span>Citizen Submission ({selectedSuggestion.language || 'Original'})</span>
                  {selectedSuggestion.source && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        background: 'var(--surface)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {selectedSuggestion.source.toUpperCase()}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-1)', lineHeight: '1.5' }}>
                  {selectedSuggestion.description_original || selectedSuggestion.description}
                </p>
              </div>

              {selectedSuggestion.description_english &&
                selectedSuggestion.description_english !== selectedSuggestion.description_original && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Sparkles size={11} />
                      <span>AI-Refined Technical Description</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-2)', lineHeight: '1.45' }}>
                      {selectedSuggestion.description_english}
                    </p>
                  </div>
                )}
            </div>

            {/* Citizen Reporter & Demographics Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Reporter</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: '2px' }}>
                  {selectedSuggestion.reporterName || 'Citizen'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                  ID: {selectedSuggestion.userId || selectedSuggestion.reportedBy || 'N/A'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Demand Signal</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px',
                  }}
                >
                  <ThumbsUp size={13} />
                  <span>{selectedSuggestion.upvotes?.length || (selectedSuggestion as any).citizenCount || 0} Citizens</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Community Endorsement</div>
              </div>
            </div>

            {/* Spatial Location */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} />
                <span>Location & Ward Demarcation</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>
                {selectedSuggestion.address}
              </div>
              {selectedSuggestion.ward && (
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 500 }}>
                  Ward: {selectedSuggestion.ward}
                </div>
              )}
              {selectedSuggestion.lat && selectedSuggestion.lng && (
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                  GPS: {selectedSuggestion.lat.toFixed(4)}, {selectedSuggestion.lng.toFixed(4)}
                </div>
              )}
            </div>

            {/* Municipal Department Assignment */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase' }}>
                  Assigned Authority
                </div>
                <button
                  onClick={handleAutoRoute}
                  disabled={routingLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: 'var(--primary)',
                    background: 'var(--primary-subtle)',
                    border: 'none',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: routingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Sparkles size={11} />
                  <span>{routingLoading ? 'Routing...' : 'AI Auto-Route'}</span>
                </button>
              </div>

              <select
                value={selectedSuggestion.assignedDepartment || selectedSuggestion.department || ''}
                onChange={(e) => handleAssignDepartment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Workflow Status Transition Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase' }}>
                Lifecycle Phase Transition
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  disabled={updatingStatus || selectedSuggestion.status === 'under_review'}
                  onClick={() => handleUpdateStatus('under_review')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #F59E0B',
                    background: selectedSuggestion.status === 'under_review' ? '#F59E0B' : 'rgba(245, 158, 11, 0.08)',
                    color: selectedSuggestion.status === 'under_review' ? '#FFF' : '#F59E0B',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🔍 Mark Under Review
                </button>

                <button
                  disabled={updatingStatus || selectedSuggestion.status === 'in_planning'}
                  onClick={() => handleUpdateStatus('in_planning')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #8B5CF6',
                    background: selectedSuggestion.status === 'in_planning' ? '#8B5CF6' : 'rgba(139, 92, 246, 0.08)',
                    color: selectedSuggestion.status === 'in_planning' ? '#FFF' : '#8B5CF6',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📋 Move to Planning
                </button>

                <button
                  disabled={updatingStatus || selectedSuggestion.status === 'approved'}
                  onClick={() => handleUpdateStatus('approved')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #10B981',
                    background: selectedSuggestion.status === 'approved' ? '#10B981' : 'rgba(16, 185, 129, 0.08)',
                    color: selectedSuggestion.status === 'approved' ? '#FFF' : '#10B981',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ✅ Sanction / Approve
                </button>

                <button
                  disabled={updatingStatus || selectedSuggestion.status === 'completed'}
                  onClick={() => handleUpdateStatus('completed')}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #059669',
                    background: selectedSuggestion.status === 'completed' ? '#059669' : 'rgba(5, 150, 105, 0.08)',
                    color: selectedSuggestion.status === 'completed' ? '#FFF' : '#059669',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🏁 Mark Delivered
                </button>
              </div>

              <button
                disabled={updatingStatus || selectedSuggestion.status === 'rejected'}
                onClick={() => handleUpdateStatus('rejected')}
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: '6px',
                  border: '1px solid #EF4444',
                  background: selectedSuggestion.status === 'rejected' ? '#EF4444' : 'transparent',
                  color: selectedSuggestion.status === 'rejected' ? '#FFF' : '#EF4444',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ❌ Decline / Reject Proposal
              </button>
            </div>

            {/* Official Administrative Notes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase' }}>
                Municipal Review Notes & Decisions
              </div>

              <textarea
                rows={3}
                placeholder="Enter urban planning assessment, budgetary grant allocations, or rejection reason..."
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />

              <button
                disabled={updatingStatus}
                onClick={handleSaveNotes}
                style={{
                  alignSelf: 'flex-end',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: '#FFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {updatingStatus ? 'Saving...' : 'Save Official Notes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
