import React from 'react';
import { Shield, Users, UserCog, CheckCircle, Lock, Eye, Pencil } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  label: string;
  level: number;
  description: string;
  color: string;
  icon: React.ReactNode;
  permissions: string[];
  userCount: number;
}

const ROLES: Role[] = [
  {
    id: 'citizen',
    name: 'citizen',
    label: 'Citizen',
    level: 0,
    description: 'Public community members who report civic infrastructure issues and track resolution progress.',
    color: 'var(--text-3)',
    icon: <Users size={18} />,
    userCount: 2847,
    permissions: [
      'View all public issues on the map',
      'Submit new issue reports with photos',
      'Upvote existing issues',
      'Track status of own reported issues',
      'Earn points and badges for participation',
      'View the public Insights dashboard',
    ],
  },
  {
    id: 'admin',
    name: 'admin',
    label: 'Municipality Admin',
    level: 2,
    description: 'Local government officers managing a specific municipality. Can update issue status, upload resolution proof, and manage ward-specific workflows.',
    color: 'var(--primary)',
    icon: <Shield size={18} />,
    userCount: 14,
    permissions: [
      'All Citizen permissions',
      'View Admin Portal (/admin/*)',
      'Update issue status (Open → In Progress → Resolved)',
      'Upload proof-of-work resolution photos',
      'Set estimated resolution timelines (estDays)',
      'Add verification reasons and closing notes',
      'View ward-specific complaint ledger',
      'Access ward analytics and SLA metrics',
    ],
  },
  {
    id: 'super_admin',
    name: 'super_admin',
    label: 'Super Admin',
    level: 3,
    description: 'Platform owner with full system access. Manages municipalities, provisions admins, monitors AI pipelines, and maintains system configuration.',
    color: '#F59E0B',
    icon: <UserCog size={18} />,
    userCount: 2,
    permissions: [
      'All Admin permissions',
      'Access Super Admin Portal (/super-admin/*)',
      'Provision and suspend Municipality Admins',
      'Register new municipalities and departments',
      'View national map of all civic issues',
      'Monitor Gemini AI pipeline performance',
      'Access full audit trail and system logs',
      'Manage API keys and external integrations',
      'Configure platform-wide settings',
      'Delete user profiles (high-privilege action)',
    ],
  },
];

const PERMISSION_CATEGORIES = [
  {
    category: 'Data Access',
    permissions: [
      { label: 'Read public issues', citizen: true, admin: true, super_admin: true },
      { label: 'Write own issues', citizen: true, admin: true, super_admin: true },
      { label: 'Update any issue status', citizen: false, admin: true, super_admin: true },
      { label: 'Delete issues', citizen: false, admin: false, super_admin: false },
      { label: 'Read all user profiles', citizen: false, admin: true, super_admin: true },
      { label: 'Update user roles', citizen: false, admin: false, super_admin: true },
      { label: 'Delete user profiles', citizen: false, admin: false, super_admin: true },
    ],
  },
  {
    category: 'Portal Access',
    permissions: [
      { label: 'Citizen portal', citizen: true, admin: true, super_admin: true },
      { label: 'Admin portal (/admin/*)', citizen: false, admin: true, super_admin: true },
      { label: 'Super Admin portal (/super-admin/*)', citizen: false, admin: false, super_admin: true },
    ],
  },
  {
    category: 'Analytics & Intelligence',
    permissions: [
      { label: 'Public Insights page', citizen: true, admin: true, super_admin: true },
      { label: 'Ward analytics', citizen: false, admin: true, super_admin: true },
      { label: 'National analytics', citizen: false, admin: false, super_admin: true },
      { label: 'AI monitoring dashboard', citizen: false, admin: false, super_admin: true },
      { label: 'Audit trail access', citizen: false, admin: false, super_admin: true },
    ],
  },
  {
    category: 'System',
    permissions: [
      { label: 'Manage municipalities', citizen: false, admin: false, super_admin: true },
      { label: 'Provision admins', citizen: false, admin: false, super_admin: true },
      { label: 'API key management', citizen: false, admin: false, super_admin: true },
      { label: 'System configuration', citizen: false, admin: false, super_admin: true },
      { label: 'Integration management', citizen: false, admin: false, super_admin: true },
    ],
  },
];

const Tick: React.FC<{ yes: boolean }> = ({ yes }) => (
  yes
    ? <CheckCircle size={15} color="var(--success)" />
    : <Lock size={13} color="var(--border)" />
);

const RolesPage: React.FC = () => {
  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>USER MANAGEMENT</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Roles & Permissions</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Hierarchical role definitions and permission matrix for the CivicPulse platform</p>
      </div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 36 }}>
        {ROLES.map(role => (
          <div key={role.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 22, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${role.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                  {role.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>{role.label}</div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>Level {role.level}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{role.userCount.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>users</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 14 }}>{role.description}</p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Permissions</div>
              {role.permissions.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                  <CheckCircle size={12} color={role.color} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16 }}>PERMISSION MATRIX</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Permission</th>
                <th style={{ textAlign: 'center' }}>Citizen</th>
                <th style={{ textAlign: 'center' }}>Admin</th>
                <th style={{ textAlign: 'center' }}>Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSION_CATEGORIES.map(cat => (
                <React.Fragment key={cat.category}>
                  <tr>
                    <td colSpan={4} style={{ background: 'var(--surface-2)', padding: '8px 16px' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{cat.category}</span>
                    </td>
                  </tr>
                  {cat.permissions.map(p => (
                    <tr key={p.label}>
                      <td style={{ fontSize: 13, color: 'var(--text-1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.citizen || p.admin || p.super_admin ? <Eye size={12} color="var(--text-3)" /> : <Lock size={12} color="var(--border)" />}
                          {p.label}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}><Tick yes={p.citizen} /></td>
                      <td style={{ textAlign: 'center' }}><Tick yes={p.admin} /></td>
                      <td style={{ textAlign: 'center' }}><Tick yes={p.super_admin} /></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hierarchy note */}
      <div style={{ marginTop: 24, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-1)' }}>Role Hierarchy:</strong> Citizen (L0) → Municipality Admin (L2) → Super Admin (L3).
        Higher roles inherit all lower-role permissions. Role levels have intentional gaps to allow future roles (e.g., Inspector L1, Regional Director L2.5) to be inserted without renumbering.
        Role assignments are stored in Firestore at <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4 }}>/users/{'{uid}'}/role</code> and enforced by Firestore Security Rules.
      </div>
    </div>
  );
};

export default RolesPage;
