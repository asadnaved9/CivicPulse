import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import type { UserRole } from '../../types/roles';
import { ROLES } from '../../types/roles';

interface AccessDeniedProps {
  currentRole: UserRole | null;
  requiredRoles: UserRole[];
}

/**
 * Displayed when a user navigates to a portal their role cannot access.
 * Matches the existing CivicPulse design token system.
 */
const AccessDenied: React.FC<AccessDeniedProps> = ({ currentRole, requiredRoles }) => {
  const currentLabel = currentRole ? ROLES[currentRole]?.label : 'Unauthenticated';
  const requiredLabel = requiredRoles
    .map(r => ROLES[r]?.label ?? r)
    .join(' or ');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'var(--danger-subtle)',
        marginBottom: 24,
      }}>
        <ShieldOff size={28} color="var(--danger)" />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 600,
        color: 'var(--text-1)',
        marginBottom: 8,
      }}>
        Access Denied
      </h1>

      <p style={{
        fontSize: '14px',
        color: 'var(--text-3)',
        maxWidth: 360,
        lineHeight: 1.6,
        marginBottom: 6,
      }}>
        Your current role{currentRole ? ` (${currentLabel})` : ''} does not have
        permission to access this portal.
      </p>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-3)',
        letterSpacing: '0.04em',
        marginBottom: 32,
      }}>
        REQUIRED: {requiredLabel.toUpperCase()}
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 20px',
          background: 'var(--primary)',
          color: 'var(--bg)',
          borderRadius: 6,
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          letterSpacing: '0.02em',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Return to Home
      </Link>
    </div>
  );
};

export default AccessDenied;
