import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../../config/firebase';
import { useLanguage } from '../../contexts/LanguageContext';
import { MunicipalAsset, RANCHI_MUNICIPAL_ASSETS } from '../../data/assetsData';
import { 
  Building2, AlertTriangle, CheckCircle2, AlertOctagon, Wrench, 
  Search, Filter, Plus, MapPin, Eye, ArrowUpDown, Download, 
  Calendar, Layers, ShieldCheck, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminAssetsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<MunicipalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Selected Asset for Detail / Inspection Update Modal
  const [selectedAsset, setSelectedAsset] = useState<MunicipalAsset | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // New Asset Form State
  const [newAsset, setNewAsset] = useState<Partial<MunicipalAsset>>({
    name: '',
    category: 'road',
    condition: 'healthy',
    lat: 23.3650,
    lng: 85.3250,
    address: '',
    ward: 'Ward 18',
    department: 'Road Construction Department (RCD)',
    specifications: '',
    healthScore: 90
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAssets(RANCHI_MUNICIPAL_ASSETS);
      setLoading(false);
      return;
    }

    const assetsRef = collection(db, 'assets');
    const unsubscribe = onSnapshot(assetsRef, (snapshot) => {
      if (snapshot.empty) {
        // Fallback to seeded Ranchi municipal assets
        setAssets(RANCHI_MUNICIPAL_ASSETS);
      } else {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MunicipalAsset));
        setAssets(list);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Using local assets fallback:", err);
      setAssets(RANCHI_MUNICIPAL_ASSETS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered Assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || asset.condition === conditionFilter;
    const matchesWard = wardFilter === 'all' || asset.ward === wardFilter;

    return matchesSearch && matchesCategory && matchesCondition && matchesWard;
  });

  // Calculate Metrics
  const totalAssets = assets.length;
  const criticalAssets = assets.filter(a => a.condition === 'critical').length;
  const maintenanceDueAssets = assets.filter(a => a.condition === 'maintenance_due').length;
  const avgHealth = totalAssets > 0 
    ? Math.round(assets.reduce((sum, a) => sum + (a.healthScore || 70), 0) / totalAssets)
    : 100;

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'healthy':
        return { 
          bg: 'rgba(16, 185, 129, 0.1)', 
          color: '#10B981', 
          border: 'rgba(16, 185, 129, 0.3)', 
          label: 'Healthy / Operational',
          icon: <CheckCircle2 size={12} />
        };
      case 'maintenance_due':
        return { 
          bg: 'rgba(245, 158, 11, 0.1)', 
          color: '#F59E0B', 
          border: 'rgba(245, 158, 11, 0.3)', 
          label: 'Maintenance Due',
          icon: <Wrench size={12} />
        };
      case 'critical':
        return { 
          bg: 'rgba(239, 68, 68, 0.1)', 
          color: '#EF4444', 
          border: 'rgba(239, 68, 68, 0.3)', 
          label: 'Critical Distress',
          icon: <AlertOctagon size={12} />
        };
      case 'out_of_service':
        return { 
          bg: 'rgba(107, 114, 128, 0.15)', 
          color: '#4B5563', 
          border: 'rgba(107, 114, 128, 0.3)', 
          label: 'Out of Service',
          icon: <AlertTriangle size={12} />
        };
      default:
        return { 
          bg: 'var(--surface-2)', 
          color: 'var(--text-2)', 
          border: 'var(--border)', 
          label: condition,
          icon: <Building2 size={12} />
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'road': return '🛣️';
      case 'streetlight': return '💡';
      case 'water': return '🚰';
      case 'electricity': return '⚡';
      case 'waste': return '🗑️';
      case 'facility': return '🏥';
      default: return '🏛️';
    }
  };

  const handleUpdateCondition = async (newCondition: MunicipalAsset['condition'], newScore: number) => {
    if (!selectedAsset) return;
    setIsUpdating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const updates = {
        condition: newCondition,
        healthScore: newScore,
        lastInspectionDate: today,
        updatedAt: serverTimestamp()
      };

      if (isFirebaseConfigured && auth.currentUser) {
        await updateDoc(doc(db, 'assets', selectedAsset.id), updates);
      }

      setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, ...updates } : a));
      setSelectedAsset(prev => prev ? { ...prev, ...updates } : null);
      toast.success(`Asset ${selectedAsset.id} condition updated!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update asset status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.address) {
      toast.error('Asset Name and Address are required');
      return;
    }

    const assetId = `AST-${newAsset.category?.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];
    const assetToSave: MunicipalAsset = {
      id: assetId,
      name: newAsset.name!,
      category: (newAsset.category as any) || 'road',
      condition: (newAsset.condition as any) || 'healthy',
      lat: Number(newAsset.lat) || 23.3650,
      lng: Number(newAsset.lng) || 85.3250,
      address: newAsset.address!,
      ward: newAsset.ward || 'Ward 18',
      department: newAsset.department || 'Road Construction Department (RCD)',
      installDate: today,
      lastInspectionDate: today,
      activeComplaintsCount: 0,
      healthScore: Number(newAsset.healthScore) || 90,
      specifications: newAsset.specifications || 'Standard municipal engineering specifications'
    };

    try {
      if (isFirebaseConfigured && auth.currentUser) {
        await setDoc(doc(db, 'assets', assetId), {
          ...assetToSave,
          createdAt: serverTimestamp()
        });
      }
      setAssets(prev => [assetToSave, ...prev]);
      toast.success(`Asset ${assetId} registered successfully!`);
      setShowAddModal(false);
      setNewAsset({
        name: '',
        category: 'road',
        condition: 'healthy',
        lat: 23.3650,
        lng: 85.3250,
        address: '',
        ward: 'Ward 18',
        department: 'Road Construction Department (RCD)',
        specifications: '',
        healthScore: 90
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to register asset');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID,Name,Category,Condition,HealthScore,Ward,Department,Latitude,Longitude,Address,ActiveComplaints'];
    const rows = filteredAssets.map(a => 
      `"${a.id}","${a.name}","${a.category}","${a.condition}",${a.healthScore},"${a.ward}","${a.department}",${a.lat},${a.lng},"${a.address}",${a.activeComplaintsCount}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ranchi_Municipal_Asset_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Asset registry exported to CSV');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
            INFRASTRUCTURE LIFECYCLE & CONDITION
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
            Municipal Asset Inventory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
            Track physical infrastructure condition, maintenance schedules, and cross-reference citizen hazard reports.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-1)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export Registry</span>
          </button>

          <button
            onClick={() => navigate('/admin/map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-1)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <MapPin size={14} />
            <span>View Radar Map</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={15} />
            <span>Register Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Total Assets Tracked
            </span>
            <Building2 size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
            {totalAssets}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            Across 53 Ranchi wards
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Critical Distress
            </span>
            <AlertOctagon size={16} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
            {criticalAssets}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', fontWeight: 500 }}>
            Immediate intervention required
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Maintenance Due
            </span>
            <Wrench size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
            {maintenanceDueAssets}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            Inspection cycle overdue
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              Avg Infrastructure Health
            </span>
            <ShieldCheck size={16} color={avgHealth >= 70 ? 'var(--success)' : 'var(--warning)'} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: avgHealth >= 70 ? 'var(--success)' : 'var(--warning)' }}>
            {avgHealth}/100
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
            Weighted durability index
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        padding: '14px 16px', 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Search by asset ID, name, location or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            <option value="road">🛣️ Roads & Bridges</option>
            <option value="streetlight">💡 Streetlighting</option>
            <option value="water">🚰 Water & Drainage</option>
            <option value="electricity">⚡ Electrical Grid</option>
            <option value="waste">🗑️ Solid Waste</option>
            <option value="facility">🏥 Public Facilities</option>
          </select>
        </div>

        {/* Condition Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Conditions</option>
            <option value="healthy">🟢 Healthy</option>
            <option value="maintenance_due">🟡 Maintenance Due</option>
            <option value="critical">🔴 Critical Distress</option>
            <option value="out_of_service">⚪ Out of Service</option>
          </select>
        </div>

        {/* Ward Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Wards</option>
            <option value="Ward 18">Ward 18 (Main Road / Shaheed Chowk)</option>
            <option value="Ward 17">Ward 17 (Hindpiri / Daily Market)</option>
            <option value="Ward 14">Ward 14 (Church Road / Purulia Rd)</option>
            <option value="Ward 12">Ward 12 (Kadru / Overbridge)</option>
            <option value="Ward 10">Ward 10 (Lalpur / Circular Road)</option>
            <option value="Ward 26">Ward 26 (Harmu Bypass)</option>
          </select>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('table')}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              background: viewMode === 'table' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'table' ? 'var(--text-1)' : 'var(--text-3)',
              cursor: 'pointer'
            }}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              background: viewMode === 'cards' ? 'var(--surface)' : 'transparent',
              color: viewMode === 'cards' ? 'var(--text-1)' : 'var(--text-3)',
              cursor: 'pointer'
            }}
          >
            Cards
          </button>
        </div>
      </div>

      {/* Main Asset Display */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          Syncing municipal asset database...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          No municipal assets found matching current criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Asset ID</th>
                  <th style={{ padding: '12px 16px' }}>Asset Name & Specs</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Condition & Score</th>
                  <th style={{ padding: '12px 16px' }}>Ward & Location</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Active Hazards</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const badge = getConditionBadge(asset.condition);
                  return (
                    <tr 
                      key={asset.id} 
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      className="hover-card"
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-1)' }}>
                        {asset.id}
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: '3px' }}>
                          {asset.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asset.specifications}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                          <span>{getCategoryIcon(asset.category)}</span>
                          <span>{asset.category}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            width: 'fit-content'
                          }}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                            Health Score: {asset.healthScore}/100
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '11px' }}>
                          {asset.ward}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asset.address}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '11px', color: 'var(--text-2)' }}>
                        {asset.department}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {asset.activeComplaintsCount > 0 ? (
                          <span 
                            onClick={() => navigate('/admin/complaints')}
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              color: '#EF4444', 
                              fontWeight: 700, 
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            <AlertTriangle size={11} />
                            {asset.activeComplaintsCount} Linked
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>0 reports</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            title="Inspect & Update Condition"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: 'var(--surface-2)',
                              color: 'var(--text-1)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredAssets.map(asset => {
            const badge = getConditionBadge(asset.condition);
            return (
              <div 
                key={asset.id} 
                style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getCategoryIcon(asset.category)}</span>
                    <div>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                        {asset.id} • {asset.ward}
                      </span>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-1)' }}>
                        {asset.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>
                  {asset.specifications}
                </p>

                <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {asset.address}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingTop: '12px', 
                  borderTop: '1px solid var(--border)' 
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

                  <button
                    onClick={() => setSelectedAsset(asset)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text-1)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Manage
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Inspection / Condition Update Modal */}
      {selectedAsset && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  {selectedAsset.id} • {selectedAsset.ward}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-1)' }}>
                  {selectedAsset.name}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>GPS Location</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: '2px' }}>
                  {selectedAsset.lat.toFixed(4)}, {selectedAsset.lng.toFixed(4)}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Department</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedAsset.department}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Last Inspection</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)', marginTop: '2px' }}>
                  {selectedAsset.lastInspectionDate}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Current Health Score</span>
                <div style={{ fontSize: '12px', fontWeight: 700, color: selectedAsset.healthScore >= 70 ? 'var(--success)' : 'var(--danger)', marginTop: '2px' }}>
                  {selectedAsset.healthScore}/100
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>
                Technical Specifications & Structure
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-1)', margin: 0, lineHeight: 1.5 }}>
                {selectedAsset.specifications}
              </p>
            </div>

            {/* Condition Override & Audit */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)', display: 'block', marginBottom: '10px' }}>
                Update Asset Maintenance Status
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateCondition('healthy', 92)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🟢 Mark Healthy (92%)
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateCondition('maintenance_due', 55)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#F59E0B',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🟡 Schedule Service (55%)
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateCondition('critical', 25)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔴 Flag Critical (25%)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                onClick={() => {
                  setSelectedAsset(null);
                  navigate('/admin/map');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <MapPin size={14} /> Locate on Ward Radar Map
              </button>

              <button
                onClick={() => setSelectedAsset(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Asset Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <form 
            onSubmit={handleCreateAsset}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
                Register Municipal Infrastructure Asset
              </h2>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Asset Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Circular Road LED Light Tower Pole #12"
                value={newAsset.name}
                onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Category</label>
                <select
                  value={newAsset.category}
                  onChange={e => setNewAsset({ ...newAsset, category: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px' }}
                >
                  <option value="road">Road & Transit</option>
                  <option value="streetlight">Streetlighting</option>
                  <option value="water">Water & Drainage</option>
                  <option value="electricity">Electrical Grid</option>
                  <option value="waste">Solid Waste Facility</option>
                  <option value="facility">Public Facility</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Ward</label>
                <select
                  value={newAsset.ward}
                  onChange={e => setNewAsset({ ...newAsset, ward: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px' }}
                >
                  <option value="Ward 18">Ward 18 (Main Road)</option>
                  <option value="Ward 17">Ward 17 (Hindpiri)</option>
                  <option value="Ward 14">Ward 14 (Church Road)</option>
                  <option value="Ward 12">Ward 12 (Kadru)</option>
                  <option value="Ward 10">Ward 10 (Lalpur)</option>
                  <option value="Ward 26">Ward 26 (Harmu)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Physical Address / Landmark *</label>
              <input
                required
                type="text"
                placeholder="e.g. Opposite Nucleus Mall, Circular Road, Ranchi"
                value={newAsset.address}
                onChange={e => setNewAsset({ ...newAsset, address: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Latitude (GIS)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newAsset.lat}
                  onChange={e => setNewAsset({ ...newAsset, lat: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Longitude (GIS)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newAsset.lng}
                  onChange={e => setNewAsset({ ...newAsset, lng: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Assigned Department</label>
              <select
                value={newAsset.department}
                onChange={e => setNewAsset({ ...newAsset, department: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px' }}
              >
                <option value="Road Construction Department (RCD)">Road Construction Department (RCD)</option>
                <option value="RMC Electrical Cell">RMC Electrical Cell</option>
                <option value="Drinking Water & Sanitation Department (DWSD)">Drinking Water & Sanitation Department (DWSD)</option>
                <option value="Jharkhand Bijli Vitran Nigam Limited (JBVNL)">Jharkhand Bijli Vitran Nigam Limited (JBVNL)</option>
                <option value="RMC Solid Waste Management Cell">RMC Solid Waste Management Cell</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Specifications & Materials</label>
              <textarea
                rows={3}
                placeholder="Technical material specs, capacity, or warranty details..."
                value={newAsset.specifications}
                onChange={e => setNewAsset({ ...newAsset, specifications: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#ffffff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
              >
                Save Asset to Registry
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default AdminAssetsPage;
