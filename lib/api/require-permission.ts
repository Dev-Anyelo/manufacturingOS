// lib/api/require-permission.ts
// API route guard that replaces manual `requireRole()` calls with
// granular permission checks.
//
// Usage in a route handler:
//
//   const { profile } = await requireAuth()
//   await requirePermission(profile, "inventory", "create")
//
// Throws ApiRouteError(403) if the user lacks the permission.

import { ApiRouteError } from "@/lib/api/response"
import { hasPermission } from "@/lib/permissions"
import type { ModuleKey, ActionKey } from "@/lib/permissions"

interface ProfileLike {
  id: string
  role: string
}

/**
 * Guard that checks whether the authenticated user has a specific
 * module-level permission. Throws 403 if denied.
 *
 * This is the replacement for `requireRole(profile, [Role.admin, ...])`.
 * It checks the full permission resolution chain:
 *   role defaults → per-user overrides → cache
 *
 * @throws {ApiRouteError} with status 403 if the user lacks the permission
 */
export async function requirePermission(
  profile: ProfileLike,
  module: ModuleKey,
  action: ActionKey
): Promise<void> {
  const allowed = await hasPermission(profile.id, module, action)

  if (!allowed) {
    throw new ApiRouteError(
      "No tienes permisos para realizar esta acción.",
      403
    )
  }
}

/**
 * Check multiple permissions at once. All must be granted.
 * Useful for endpoints that span multiple modules.
 *
 * @example
 * ```ts
 * await requireAllPermissions(profile, [
 *   ["expenses", "create"],
 *   ["inventory", "edit"],
 * ])
 * ```
 */
export async function requireAllPermissions(
  profile: ProfileLike,
  checks: Array<[ModuleKey, ActionKey]>
): Promise<void> {
  for (const [module, action] of checks) {
    await requirePermission(profile, module, action)
  }
}
