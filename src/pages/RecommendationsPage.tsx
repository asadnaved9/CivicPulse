import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { Sparkles, Layers, Shield, ArrowRight, Lock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecommendationsPage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCitizenInsights() {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const [clustersSnap, recsSnap] = await Promise.all([
          getDocs(collection(db, 'clusters')),
          getDocs(collection(db, 'recommendations'))
        ]);

        setClusters(clustersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRecommendations(recsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCitizenInsights();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
          <Sparkles size={12} /> CITIZEN TRANSPARENCY DASHBOARD
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-1)' }}>
          Public Infrastructure Recommendations
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-3)' }}>
          View how public demand submissions are aggregated into prioritized municipal infrastructure projects.
        </p>
      </div>

      {/* Legislative Notice Banner */}
      <div 
        className="card" 
        style={{ 
          backgroundColor: 'var(--surface-2)', 
          border: '1px solid var(--border)',
          padding: '20px 24px',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
              Public Transparency View
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
              Strategic planning tools (Knapsack Budget Optimization, LDP Ingestion, and DPR Proposal drafting) are restricted to the Member of Parliament.
            </div>
          </div>
        </div>

        <Link 
          to="/mp/login" 
          className="btn btn-secondary text-xs"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}
        >
          <span>Authorized MP Portal</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Active AI Recommendations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
            Vetted Project Recommendations ({recommendations.length})
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            Ranked by 6-factor priority engine
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            Loading recommendations...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
            No recommendations generated yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: 'var(--surface-1)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                      {rec.category || 'Infrastructure'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>
                      <TrendingUp size={14} />
                      <span>{rec.priorityScore || 75}/100</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-1)' }}>
                    {rec.recommendedProject || 'Constituency Capital Project'}
                  </h3>

                  <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                    {rec.recommendationText}
                  </p>

                  <div style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <div><strong>Matching Plan Item:</strong> {rec.matchingPlanItem || 'Constituency Deficit'}</div>
                    <div><strong>Estimated Cost:</strong> ₹{rec.estimatedCost ? (rec.estimatedCost / 100000).toFixed(1) : '50.0'} Lakhs</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--success)' }}>
                  <CheckCircle2 size={13} />
                  <span>Publicly Vetted Demand Consensus</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aggregated Demand Clusters Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
          Active Geographic Demand Clusters ({clusters.length})
        </h2>

        {clusters.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
            No active spatial clusters detected.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {clusters.map((cluster) => (
              <div 
                key={cluster.id} 
                className="card"
                style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--surface-2)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                    {cluster.theme || 'Community Infrastructure Need'}
                  </span>
                  <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                    {cluster.requestCount || cluster.issueIds?.length || 1} Reports
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                  Primary Ward: {cluster.ward || 'Bangalore Central'} • Severity: {cluster.severity || 'High'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
