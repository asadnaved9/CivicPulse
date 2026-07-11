import React, { useState } from 'react';
import { Settings, User, Bell, Moon, Sun, Save, CheckCircle, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [darkMode, setDarkMode] = useState(document.body.classList.contains('dark'));
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? 'CTO & Platform Admin',
    email: profile?.email ?? 'superadmin@civicpulse.gov.in',
    timezone: 'Asia/Kolkata',
    language: 'en',
    emailNotifications: true,
    slaBreach: true,
    aiErrors: true,
    newAdmin: true,
    securityAlerts: true,
    weeklyDigest: false,
    sessionTimeout: '60',
    twoFactor: false,
    auditSelf: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDark = () => {
    document.body.classList.toggle('dark');
    setDarkMode(p => !p);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 3000);
  };

  const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
        <span style={{ color: 'var(--primary)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );

  const ToggleRow: React.FC<{ label: string; sub?: string; value: boolean; onChange: () => void }> = ({ label, sub, value, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={onChange} style={{
        width: 42, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: value ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>SYSTEM</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Personal preferences and account settings for the super admin console</p>
      </div>

      <form onSubmit={handleSave}>
        {/* Profile */}
        <Section title="Profile" icon={<User size={15} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <img
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.email ?? 'superadmin'}`}
              alt="Avatar"
              style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--border)' }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{profile?.displayName ?? 'Super Admin'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{profile?.email ?? 'superadmin@civicpulse.gov.in'}</div>
              <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                {(profile?.badges ?? ['Founder', 'Architect']).map(b => (
                  <span key={b} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--primary-subtle)', color: 'var(--primary)', border: '1px solid var(--border)' }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Timezone</label>
              <select className="form-select" value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Language</label>
              <select className="form-select" value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={darkMode ? <Moon size={15} /> : <Sun size={15} />}>
          <ToggleRow
            label="Dark Mode"
            sub="Switch between light and dark themes. Setting persists for this session."
            value={darkMode}
            onChange={toggleDark}
          />
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Current theme: <strong style={{ color: 'var(--text-1)' }}>{darkMode ? 'Dark' : 'Light'}</strong> —
            Dark mode is recommended for prolonged monitoring sessions.
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={<Bell size={15} />}>
          <ToggleRow label="Email Notifications" sub="Receive daily digest and critical alerts via email" value={form.emailNotifications} onChange={() => setForm(p => ({ ...p, emailNotifications: !p.emailNotifications }))} />
          <ToggleRow label="SLA Breach Alerts" sub="Notify when any issue exceeds estimated resolution days" value={form.slaBreach} onChange={() => setForm(p => ({ ...p, slaBreach: !p.slaBreach }))} />
          <ToggleRow label="AI Pipeline Errors" sub="Alert on Gemini API failures or timeouts" value={form.aiErrors} onChange={() => setForm(p => ({ ...p, aiErrors: !p.aiErrors }))} />
          <ToggleRow label="New Admin Provisioned" sub="Notify when a new municipality admin is added" value={form.newAdmin} onChange={() => setForm(p => ({ ...p, newAdmin: !p.newAdmin }))} />
          <ToggleRow label="Security Alerts" sub="Login from new device, role changes, user suspensions" value={form.securityAlerts} onChange={() => setForm(p => ({ ...p, securityAlerts: !p.securityAlerts }))} />
          <div style={{ paddingTop: 0, marginTop: -14 }}>
            <ToggleRow label="Weekly Digest" sub="Platform summary every Monday morning" value={form.weeklyDigest} onChange={() => setForm(p => ({ ...p, weeklyDigest: !p.weeklyDigest }))} />
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={<Settings size={15} />}>
          <ToggleRow label="Two-Factor Authentication" sub="Require OTP on login. Recommended for production accounts." value={form.twoFactor} onChange={() => setForm(p => ({ ...p, twoFactor: !p.twoFactor }))} />
          <ToggleRow label="Self-Audit Logging" sub="Log your own admin actions to the Audit Reports trail" value={form.auditSelf} onChange={() => setForm(p => ({ ...p, auditSelf: !p.auditSelf }))} />
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Session Timeout (minutes)</label>
            <input type="number" className="form-input" value={form.sessionTimeout} min="15" max="480"
              onChange={e => setForm(p => ({ ...p, sessionTimeout: e.target.value }))}
              style={{ maxWidth: 140 }} />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Auto-logout after inactivity. Minimum 15 min, maximum 480 min.</div>
          </div>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={() => { toast('No changes discarded'); }}>
            Discard
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'Saving…' : saved ? <><CheckCircle size={14} />Saved</> : <><Save size={14} />Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
