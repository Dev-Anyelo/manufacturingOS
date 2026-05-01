// lib/permissions/index.ts
// Public API for the permissions system.

export type {
  ModuleKey,
  ActionKey,
  ModulePermissions,
  ResolvedPermissions,
  PermissionOverride,
} from "./types"

export { MODULE_KEYS, ACTION_KEYS } from "./types"

export {
  DEFAULT_PERMISSIONS,
  buildDeniedPermissions,
  ACTION_TO_COLUMN,
} from "./constants"

export {
  resolvePermissions,
  hasPermission,
  getModulePermissions,
} from "./resolve"

export {
  invalidatePermissions,
  invalidateAllPermissions,
} from "./cache"
