import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured, fetchWithAuth } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import MPDecisionCockpit from '../../components/MPDecisionCockpit';

export default function MPRecommendationsPage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [ldpProjects, setLdpProjects] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [clusteringLoading, setClusteringLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  // File upload state
  const [ldpText, setLdpText] = useState('');
  const [ldpFilename, setLdpFilename] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const loadIntelligenceData = async () => {
    try {
      if (!isFirebaseConfigured) return;
      const clustersSnap = await getDocs(collection(db, 'clusters'));
      setClusters(clustersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const recsSnap = await getDocs(collection(db, 'recommendations'));
      setRecommendations(recsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ldpSnap = await getDocs(collection(db, 'developmentPlans'));
      setLdpProjects(ldpSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const sugSnap = await getDocs(collection(db, 'suggestions'));
      setSuggestions(sugSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Failed to load intelligence data:", err);
    }
  };

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const handleRebuildClusters = async () => {
    setClusteringLoading(true);
    try {
      const res = await fetchWithAuth('/api/clusters/rebuild', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'AI Cluster rebuilding completed successfully!');
        await loadIntelligenceData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to rebuild clusters.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error during clustering.');
    } finally {
      setClusteringLoading(false);
    }
  };

  const handleCompareDemandPlan = async () => {
    setCompareLoading(true);
    try {
      const res = await fetchWithAuth('/api/compare', { method: 'POST' });
      if (res.ok) {
        toast.success('AI Alignment comparison updated!');
        await loadIntelligenceData();
      } else {
        toast.error('Failed to analyze alignment.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during comparison.');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setLdpFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLdpText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLdpFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLdpText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUploadLDP = async () => {
    if (!ldpText) {
      toast.error('Please paste plan text or select a plan document.');
      return;
    }
    setUploadLoading(true);
    try {
      const res = await fetchWithAuth('/api/ldp/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ldpText, filename: ldpFilename })
      });
      if (res.ok) {
        toast.success('Local Development Plan parsed and saved!');
        setLdpText('');
        setLdpFilename('');
        await loadIntelligenceData();
      } else {
        toast.error('Failed to parse LDP text.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error uploading LDP.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top Header & Fast Action Triggers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Executive Decision Support
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-1)' }}>
            MP Decision Cockpit & Planning Suite
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
            Citizen Demand Alignment, Knapsack Budget Optimization, and Central/State Ministry Scheme Grounding
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRebuildClusters}
            disabled={clusteringLoading}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {clusteringLoading ? 'Clustering...' : '🔄 Rebuild Clusters'}
          </button>
          <button
            onClick={handleCompareDemandPlan}
            disabled={compareLoading}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: '#FFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {compareLoading ? 'Comparing...' : '⚖️ Compare Demand vs Plan'}
          </button>
        </div>
      </div>

      {/* Local Development Plan Upload Widget */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-1)' }}>
            Local Development Plan (LDP) Document Intake
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>
            Upload or paste municipal ward plan specifications to match against public citizen demand.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{
              border: '2px dashed ' + (dragActive ? '#3b82f6' : 'var(--border)'),
              borderRadius: '8px',
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface-2)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onClick={() => document.getElementById('rec-ldp-file-input')?.click()}
          >
            <input 
              id="rec-ldp-file-input"
              type="file" 
              accept=".txt,.json,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
            />
            <div style={{ fontSize: '24px' }}>📂</div>
            <p style={{ margin: '0', fontWeight: 600, fontSize: '12px' }}>
              {ldpFilename ? `Selected: 📄 ${ldpFilename}` : "Drag & Drop LDP file here or click to browse"}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-3)' }}>
              Supports plain text (.txt), structured spreadsheets (.csv), or config files (.json)
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              placeholder="Or paste ward vision text directly... (e.g. 'Project 1: Upgrade Indiranagar Primary Health Centre...')"
              value={ldpText}
              onChange={(e) => setLdpText(e.target.value)}
              style={{
                width: '100%',
                height: '75px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-1)',
                fontSize: '12px',
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
            <button
              onClick={handleUploadLDP}
              disabled={uploadLoading || (!ldpText && !ldpFilename)}
              className="btn btn-secondary"
              style={{
                alignSelf: 'flex-end',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: (uploadLoading || (!ldpText && !ldpFilename)) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploadLoading ? 'Parsing with AI...' : 'Upload & Parse LDP'}
            </button>
          </div>
        </div>
      </div>

      {/* Main MP Decision Cockpit */}
      <MPDecisionCockpit 
        clusters={clusters}
        recommendations={recommendations}
        suggestions={suggestions}
        ldpProjects={ldpProjects}
        onDataRefresh={loadIntelligenceData}
      />
    </div>
  );
}
