import React, { useState } from 'react';
import { Layers, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ConfigSetting {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'number' | 'select' | 'text';
  value: any;
  options?: string[];
  section: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

const INITIAL_CONFIG: ConfigSetting[] = [
  // AI settings
  { key: 'ai_enabled', label: 'AI Auto-Classification', description: 'Automatically classify new issues using Gemini AI. Disabling this requires manual categorization.', type: 'boolean', value: true, section: 'AI & Intelligence', impact: 'high' },
  { key: 'ai_confidence_threshold', label: 'AI Confidence Threshold', description: 'Minimum confidence score (0–1) required before AI classification is applied to an issue.', type: 'number', value: 0.85, section: 'AI & Intelligence', impact: 'medium' },
  { key: 'ai_model', label: 'Gemini Model', description: 'Which Gemini model to use for issue classification and tag generation.', type: 'select', value: 'gemini-2.0-flash-exp', options: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-2.0-flash'], section: 'AI & Intelligence', impact: 'high' },
  { key: 'zone_predictions', label: 'Zone Risk Predictions', description: 'Enable AI-powered zone risk scoring based on historical issue density and severity.', type: 'boolean', value: true, section: 'AI & Intelligence', impact: 'medium' },
  { key: 'ai_tag_generation', label: 'Auto Tag Generation', description: 'Automatically generate descriptive tags for each new issue using AI.', type: 'boolean', value: true, section: 'AI & Intelligence', impact: 'low' },

  // Issue workflow
  { key: 'allow_anonymous_reports', label: 'Allow Anonymous Reports', description: 'Allow users without an account to submit civic issue reports.', type: 'boolean', value: true, section: 'Issue Workflow', impact: 'medium' },
  { key: 'default_sla_days', label: 'Default SLA Days', description: 'Default number of days before an issue is flagged as an SLA breach when no custom estimate is set.', type: 'number', value: 7, section: 'Issue Workflow', impact: 'medium' },
  { key: 'max_image_size_mb', label: 'Max Image Upload (MB)', description: 'Maximum file size in megabytes for issue photo uploads and resolution proof images.', type: 'number', value: 10, section: 'Issue Workflow', impact: 'low' },
  { key: 'enable_upvotes', label: 'Community Upvotes', description: 'Allow citizens to upvote issues to signal community priority. Upvotes influence issue ranking.', type: 'boolean', value: true, section: 'Issue Workflow', impact: 'low' },
  { key: 'issue_retention_days', label: 'Resolved Issue Retention (days)', description: 'Number of days to retain resolved issues in the active index before archiving.', type: 'number', value: 90, section: 'Issue Workflow', impact: 'medium' },

  // Gamification
  { key: 'gamification_enabled', label: 'Gamification System', description: 'Enable points, badges and leaderboards for citizen engagement.', type: 'boolean', value: true, section: 'Gamification', impact: 'medium' },
  { key: 'points_per_report', label: 'Points per Report', description: 'Points awarded to a citizen when they submit a new civic issue report.', type: 'number', value: 10, section: 'Gamification', impact: 'low' },
  { key: 'points_per_upvote', label: 'Points per Upvote Received', description: 'Points awarded to the issue reporter when their issue receives an upvote.', type: 'number', value: 2, section: 'Gamification', impact: 'low' },

  // Notifications
  { key: 'email_notifications', label: 'Email Notifications', description: 'Send email notifications to citizens when their reported issue status changes.', type: 'boolean', value: false, section: 'Notifications', impact: 'low' },
  { key: 'sms_notifications', label: 'SMS Notifications', description: 'Send SMS alerts for critical status updates. Requires SMS gateway configuration.', type: 'boolean', value: false, section: 'Notifications', impact: 'medium' },
  { key: 'in_app_notifications', label: 'In-App Notifications', description: 'Show in-app notification banners when issue status changes.', type: 'boolean', value: true, section: 'Notifications', impact: 'low' },
];

const impactConfig = {
  low: { color: '#10B981', label: 'Low Impact' },
  medium: { color: '#F59E0B', label: 'Medium Impact' },
  high: { color: 'var(--primary)', label: 'High Impact' },
  critical: { color: '#EF4444', label: 'Critical' },
};

const ConfigurationPage: React.FC = () => {
  const [config, setConfig] = useState<ConfigSetting[]>(INITIAL_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('AI & Intelligence');

  const sections = Array.from(new Set(INITIAL_CONFIG.map(c => c.section)));

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate save
    setSaving(false);
    setSaved(true);
    toast.success('Platform configuration saved');
    setTimeout(() => setSaved(false), 3000);
  };

  const sectionConfig = config.filter(c => c.section === activeSection);
  const changedCount = config.filter((c, i) => c.value !== INITIAL_CONFIG[i].value).length;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>SYSTEM</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Configuration</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Platform-wide configuration controls — changes apply immediately after save</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {changedCount > 0 && (
            <span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>{changedCount} unsaved change{changedCount > 1 ? 's' : ''}</span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />Saving…</> : saved ? <><CheckCircle size={14} />Saved</> : <><Save size={14} />Save Changes</>}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div style={{ marginBottom: 24, padding: '12px 16px', background: 'var(--warning-subtle)', border: '1px solid #F59E0B', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
          <strong>Changes to High/Critical impact settings may affect platform behaviour for all users.</strong> Review each setting carefully before saving.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Section sidebar */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', borderRadius: 6,
              fontSize: 13, cursor: 'pointer', marginBottom: 2, border: 'none',
              background: activeSection === s ? 'var(--primary-subtle)' : 'transparent',
              color: activeSection === s ? 'var(--primary)' : 'var(--text-2)',
              fontWeight: activeSection === s ? 600 : 400,
              borderLeft: activeSection === s ? '2px solid var(--primary)' : '2px solid transparent',
            }}>{s}</button>
          ))}
        </div>

        {/* Settings */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sectionConfig.map((setting, idx) => {
              const impCfg = impactConfig[setting.impact];
              return (
                <div key={setting.key} style={{
                  padding: '18px 20px',
                  border: '1px solid var(--border)',
                  borderRadius: idx === 0 ? '10px 10px 0 0' : idx === sectionConfig.length - 1 ? '0 0 10px 10px' : '0',
                  marginTop: idx === 0 ? 0 : -1,
                  background: 'var(--surface)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{setting.label}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${impCfg.color}18`, color: impCfg.color, border: `1px solid ${impCfg.color}`, fontFamily: 'var(--font-mono)' }}>
                        {impCfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, maxWidth: 480 }}>{setting.description}</div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginTop: 4 }}>Key: {setting.key}</div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {setting.type === 'boolean' && (
                      <button
                        onClick={() => updateConfig(setting.key, !setting.value)}
                        style={{
                          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: setting.value ? 'var(--primary)' : 'var(--border)',
                          position: 'relative', transition: 'background 0.2s',
                        }}
                        aria-label={setting.label}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 3, left: setting.value ? 23 : 3,
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </button>
                    )}
                    {setting.type === 'number' && (
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 100, padding: '7px 10px', fontSize: 13, textAlign: 'right' }}
                        value={setting.value}
                        onChange={e => updateConfig(setting.key, parseFloat(e.target.value))}
                        step={setting.key.includes('threshold') ? 0.01 : 1}
                        min={0}
                      />
                    )}
                    {setting.type === 'select' && (
                      <select
                        className="form-select"
                        style={{ width: 200, padding: '7px 10px', fontSize: 12 }}
                        value={setting.value}
                        onChange={e => updateConfig(setting.key, e.target.value)}
                      >
                        {setting.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {setting.type === 'text' && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: 200, padding: '7px 10px', fontSize: 13 }}
                        value={setting.value}
                        onChange={e => updateConfig(setting.key, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;
