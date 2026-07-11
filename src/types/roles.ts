/**
 * The three platform roles arranged in a strict hierarchy.
 * Level gap at 1 is intentional — allows future roles (e.g. 'inspector') to be inserted.
 */
export type UserRole = 'citizen' | 'admin' | 'super_admin';

export interface RoleDefinition {
  label: string;
  level: number;
  description: string;
}

export const ROLES: Record<UserRole, RoleDefinition> = {
  citizen: {
    label: 'Citizen',
    level: 0,
    description: 'Public community member who reports civic issues',
  },
  admin: {
    label: 'Municipality Admin',
    level: 2,
    description: 'Local government officer managing a specific municipality',
  },
  super_admin: {
    label: 'Super Admin',
    level: 3,
    description: 'Platform owner with full system access',
  },
};

/** Ordered from lowest to highest privilege */
export const ROLE_HIERARCHY: UserRole[] = ['citizen', 'admin', 'super_admin'];

/**
 * Returns true if the user's role meets or exceeds the required role level.
 * Use sparingly — prefer strict `allowedRoles.includes(role)` for portal guards.
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLES[userRole].level >= ROLES[requiredRole].level;
}
