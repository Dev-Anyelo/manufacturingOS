// lib/permissions/resolve.ts
// Central permission resolution engine.
//
// Resolution order:
//   1. Check server-side cache (60s TTL)
//   2. Load user profile (role) from DB
//   3. Load per-user overrides from `user_module_permissions`
//   4. Merge: override values take precedence over role defaults
//   5. Cache the resolved result
//   6. Return the requested permission boolean
//
// Fail-secure: if anything goes wrong (unknown role, DB error),
// all permissions default to DENIED.

import { prisma } from "@/lib/prisma"
import {
  DEFAULT_PERMISSIONS,
  buildDeniedPermissions,
} from "./constants"
import {
  getCachedPermissions,
  setCachedPermissions,
} from "./cache"
import type {
  ActionKey,
  ModuleKey,
  ModulePermissions,
  ResolvedPermissions,
  PermissionOverride,
} from "./types"

/**
 * Resolve the full permission set for a user.
 * Uses cache when available; otherwise fetches from DB.
 */
export async function resolvePermissions(
  userId: string
): Promise<ResolvedPermissions> {
  // 1. Cache hit
  const cached = getCachedPermissions(userId)
  if (cached) return cached

  // 2. Load profile role
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  })

  // Fail-secure: unknown user or inactive → deny all
  if (!profile || !profile.isActive) {
    return buildDeniedPermissions()
  }

  const roleKey = profile.role as string

  // 3. Get default permissions for this role
  const defaults = DEFAULT_PERMISSIONS[roleKey]

  if (!defaults) {
    // Unknown role → fail-secure
    const denied = buildDeniedPermissions()
    setCachedPermissions(userId, denied)
    return denied
  }

  // Deep-clone defaults so we don't mutate the constant
  const resolved = structuredClone(defaults)

  // 4. Load per-user overrides
  const overrides = await prisma.userModulePermission.findMany({
    where: { userId },
    select: {
      module: true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
    },
  })

  // 5. Apply overrides — they completely replace the module defaults
  for (const override of overrides) {
    const moduleKey = override.module as ModuleKey

    if (!(moduleKey in resolved)) continue

    resolved[moduleKey] = {
      view: override.canView,
      create: override.canCreate,
      edit: override.canEdit,
      delete: override.canDelete,
      export: override.canExport,
    }
  }

  // 6. Cache and return
  setCachedPermissions(userId, resolved)
  return resolved
}

/**
 * Check if a user has a specific permission.
 *
 * @param userId  - Profile UUID
 * @param module  - Module key (e.g. "inventory", "sales")
 * @param action  - Action key (e.g. "view", "create")
 * @returns `true` if the user has the permission, `false` otherwise
 *
 * @example
 * ```ts
 * const canCreate = await hasPermission(profile.id, "inventory", "create")
 * ```
 */
export async function hasPermission(
  userId: string,
  module: ModuleKey,
  action: ActionKey
): Promise<boolean> {
  const permissions = await resolvePermissions(userId)
  return permissions[module]?.[action] ?? false
}

/**
 * Get all permissions for a specific module for a user.
 * Useful for UI components that need to show/hide multiple elements.
 */
export async function getModulePermissions(
  userId: string,
  module: ModuleKey
): Promise<ModulePermissions> {
  const permissions = await resolvePermissions(userId)
  return (
    permissions[module] ?? {
      view: false,
      create: false,
      edit: false,
      delete: false,
      export: false,
    }
  )
}
