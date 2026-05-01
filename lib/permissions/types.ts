// lib/permissions/types.ts
// Core type definitions for the granular permission system.

/**
 * Every module in the system that can have access controls.
 * Each key maps to a sidebar section and a set of API routes.
 */
export const MODULE_KEYS = [
  "dashboard",
  "inventory",
  "production",
  "sales",
  "orders",
  "customers",
  "catalog",
  "expenses",
  "payroll",
  "reports",
  "settings",
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

/**
 * Granular actions that can be controlled per module.
 * - view: read list and detail
 * - create: insert new records
 * - edit: update existing records
 * - delete: remove or deactivate records
 * - export: download data as PDF/Excel
 */
export const ACTION_KEYS = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
] as const

export type ActionKey = (typeof ACTION_KEYS)[number]

/**
 * Permission flags for a single module.
 */
export type ModulePermissions = Record<ActionKey, boolean>

/**
 * Resolved permissions for all modules for a given user.
 */
export type ResolvedPermissions = Record<ModuleKey, ModulePermissions>

/**
 * A single permission override row from the database.
 * Matches the `user_module_permissions` table shape.
 */
export interface PermissionOverride {
  module: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}
