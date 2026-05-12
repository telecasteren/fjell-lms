import { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "learning:access"
  | "author:access"
  | "admin:access"
  | "reports:view"
  | "users:read"
  | "users:invite"
  | "users:manage"
  | "users:reassign"
  | "courses:read"
  | "courses:manage"
  | "content:edit"
  | "branding:manage"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.AUTHOR]: [
    "dashboard:view",
    "learning:access",
    "author:access",
    "admin:access",
    "reports:view",
    "users:read",
    "users:invite",
    "users:manage",
    "users:reassign",
    "courses:read",
    "courses:manage",
    "content:edit",
    "branding:manage",
    "settings:manage",
  ],
  [Role.ADMIN]: [
    "dashboard:view",
    "learning:access",
    "admin:access",
    "reports:view",
    "users:read",
    "users:invite",
    "users:manage",
    "users:reassign",
    "courses:read",
    "courses:manage",
    "settings:manage",
  ],
  [Role.WRITER]: [
    "dashboard:view",
    "learning:access",
    "courses:read",
    "content:edit",
    "settings:manage",
  ],
  [Role.BASIC]: ["dashboard:view", "learning:access", "courses:read"],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
