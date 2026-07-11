import React, { useState } from 'react';
import { Plug, CheckCircle, Globe, Settings, Database, CloudLightning, ArrowUpRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

const SEED_INTEGRATIONS: Integration[] = [
  {
    id: 'i1', name: 'Google Gemini AI', category: 'Intelligence',
    description: 'Powers automated issue classification, zone prediction, and tag generation.',
    icon: <CloudLightning size={20} color="#8B5CF6" />, status: 'connected', lastSync: '2 mins ago',
  },
  {
    id: 'i2', name: 'Firebase Firestore', category: 'Database',
    description: 'Primary real-time database for users, issues, and platform state.',
    icon: <Database size={20} color="#F59E0B" />, status: 'connected', lastSync: 'Real-time',
  },
  {
    id: 'i3', name: 'Firebase Auth', category: 'Security',
    description: 'Handles user authentication, session management, and JWT issuance.',
    icon: <Settings size={20} color="var(--primary)" />, status: 'connected', lastSync: 'Real-time',
  },
  {
    id: 'i4', name: 'Google Maps Platform', category: 'Mapping',
    description: 'Provides geocoding, reverse geocoding, and map tiles.',
    icon: <Globe size={20} color="#10B981" />, status: 'connected', lastSync: '10 mins ago',
  },
  {
    id: 'i5', name: 'Twilio SMS Gateway', category: 'Notifications',
    description: 'Sends SMS alerts to citizens for critical issue updates.',
    icon: <Plug size={20} color="#EF4444" />, status: 'disconnected',
  },
  {
    id: 'i6', name: 'SendGrid Email', category: 'Notifications',
    description: 'Transactional email delivery for digests and alerts.',
    icon: <Plug size={20} color="var(--text-3)" />, status: 'disconnected',
  },
  {
    id: 'i7', name: 'OpenData Portal', category: 'Data Export',
    description: 'Synchronizes resolved issue data to the public OpenData API.',
    icon: <Database size={20} color="var(--text-3)" />, status: 'error', lastSync: '12 hours ago (Failed)',
  },
];

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(SEED_INTEGRATIONS);

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newStatus = i.status === 'connected' ? 'disconnected' : 'connected';
      toast.success(`${i.name} ${newStatus}`);
      return { ...i, status: newStatus as 'connected' | 'disconnected', lastSync: newStatus === 'connected' ? 'Just now' : undefined };
    }));
  };

  const byCategory = integrations.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = [];
    acc[i.category].push(i);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>SYSTEM</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Integrations</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Manage external services and API connections used by CivicPulse</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              {category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {(items as typeof integrations).map(item => (
                <div key={item.id} style={{
                  background: 'var(--surface)', border: `1px solid ${item.status === 'error' ? '#EF4444' : 'var(--border)'}`,
                  borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.status === 'connected' ? '#10B981' : item.status === 'error' ? '#EF4444' : 'var(--border)' }} />
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: item.status === 'connected' ? '#10B981' : item.status === 'error' ? '#EF4444' : 'var(--text-3)', textTransform: 'uppercase' }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleConnection(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.status === 'connected' ? 'var(--primary)' : 'var(--text-3)' }}
                    >
                      {item.status === 'connected' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, flex: 1, marginBottom: 16 }}>
                    {item.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      Last sync: <strong style={{ color: item.status === 'error' ? '#EF4444' : 'var(--text-2)' }}>{item.lastSync || 'Never'}</strong>
                    </span>
                    <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Configure <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
