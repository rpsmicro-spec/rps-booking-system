/**
 * User roles and permissions
 */

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.OWNER]: 3,
  [USER_ROLES.ADMIN]: 2,
  [USER_ROLES.STAFF]: 1,
}

// Permissions
export const PERMISSIONS = {
  INVITE_USERS: 'invite_users',
  MANAGE_USERS: 'manage_users',
  MANAGE_JOBS: 'manage_jobs',
  VIEW_JOBS: 'view_jobs',
} as const

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.OWNER]: [
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.VIEW_JOBS,
  ],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.INVITE_USERS,
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.VIEW_JOBS,
  ],
  [USER_ROLES.STAFF]: [
    PERMISSIONS.MANAGE_JOBS,
    PERMISSIONS.VIEW_JOBS,
  ],
}

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.OWNER]: 'Owner',
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.STAFF]: 'Staff',
}

// Check if user has permission
export function hasPermission(userRole: UserRole | null | undefined, permission: string): boolean {
  if (!userRole) return false
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

// Check if user can invite
export function canInviteUsers(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.INVITE_USERS)
}

// Check if user can manage users
export function canManageUsers(userRole: UserRole | null | undefined): boolean {
  return hasPermission(userRole, PERMISSIONS.MANAGE_USERS)
}

