import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/roles';
import AccessDenied from './AccessDenied';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Route guard that enforces role-based access at the routing layer.
 * Wraps any protected portal layout. Uses strict equality — no implicit
 * role promotion (super_admin cannot browse admin portal by default).
 */
const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        letterSpacing: '0.05em',
      }}>
        AUTHENTICATING SESSION...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <AccessDenied currentRole={role} requiredRoles={allowedRoles} />;
  }

  return <>{children}</>;
};

export default RequireRole;
