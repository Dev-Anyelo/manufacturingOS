// lib/permissions/constants.ts
// Default permission matrix per role and module definitions.
//
// This is the single source of truth for what each role can do by default.
// Overrides stored in `user_module_permissions` take precedence over these
// defaults when resolved by `resolvePermission()`.

import type { ModuleKey, ActionKey, ResolvedPermissions } from "./types"

/**
 * Helper to build a ModulePermissions object concisely.
 * Order: [view, create, edit, delete, export]
 */
function p(
  view: boolean,
  create: boolean,
  edit: boolean,
  del: boolean,
  exp: boolean
) {
  return { view, create, edit, delete: del, export: exp }
}

// Shorthand aliases
const ALL = p(true, true, true, true, true)
const VIEW_ONLY = p(true, false, false, false, false)
const NONE = p(false, false, false, false, false)
const CRUD = p(true, true, true, false, false)
const CRUD_EXPORT = p(true, true, true, false, true)

/**
 * ─────────────────────────────────────────────────────────────
 * DEFAULT PERMISSION MATRIX
 * ─────────────────────────────────────────────────────────────
 *
 * Corrections applied per user review:
 *
 * 1. `employee` has NO access to `/customers` list — only a
 *    narrow POS endpoint (`?for_sale=true`) is allowed via
 *    special-case logic in the sales API, not via this matrix.
 *
 * 2. `employee` CAN view `/reports/production` (own history).
 *    This is handled as a special case in the reports guard:
 *    `reports.view = true` for employee, but the API filters
 *    to only return the employee's own production data.
 *
 * 3. `readonly` can view dashboard and reports but nothing else.
 */
export const DEFAULT_PERMISSIONS: Record<string, ResolvedPermissions> = {
  // ── Admin ────────────────────────────────────────────────
  admin: {
    dashboard: ALL,
    inventory: ALL,
    production: ALL,
    sales: ALL,
    orders: ALL,
    customers: ALL,
    catalog: ALL,
    expenses: ALL,
    payroll: ALL,
    reports: ALL,
    settings: ALL,
  },

  // ── Manager ──────────────────────────────────────────────
  manager: {
    dashboard: VIEW_ONLY,
    inventory: CRUD_EXPORT,
    production: CRUD_EXPORT,
    sales: CRUD_EXPORT,
    orders: CRUD,
    customers: CRUD,
    catalog: CRUD,
    expenses: CRUD,
    payroll: NONE,
    reports: p(true, false, false, false, true),
    settings: NONE,
  },

  // ── Employee ─────────────────────────────────────────────
  // view access to production/sales is scoped to own records
  // at the API layer (not in this matrix).
  employee: {
    dashboard: VIEW_ONLY,
    inventory: VIEW_ONLY,
    production: p(true, true, true, false, false),
    sales: p(true, true, false, false, false),
    orders: NONE,
    customers: NONE,
    catalog: VIEW_ONLY,
    expenses: NONE,
    payroll: NONE,
    reports: VIEW_ONLY, // scoped to own production reports at API level
    settings: NONE,
  },

  // ── Readonly ─────────────────────────────────────────────
  readonly: {
    dashboard: VIEW_ONLY,
    inventory: VIEW_ONLY,
    production: NONE,
    sales: NONE,
    orders: NONE,
    customers: NONE,
    catalog: VIEW_ONLY,
    expenses: NONE,
    payroll: NONE,
    reports: VIEW_ONLY,
    settings: NONE,
  },
}

/**
 * Build a fully-denied permission set. Used as the fail-secure
 * fallback when a role is unknown or missing.
 */
export function buildDeniedPermissions(): ResolvedPermissions {
  const denied = {} as ResolvedPermissions
  const moduleKeys: ModuleKey[] = [
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
  ]

  for (const mod of moduleKeys) {
    denied[mod] = NONE
  }
  return denied
}

/**
 * Map an ActionKey to the corresponding Prisma column name
 * in `user_module_permissions`.
 */
export const ACTION_TO_COLUMN: Record<ActionKey, string> = {
  view: "canView",
  create: "canCreate",
  edit: "canEdit",
  delete: "canDelete",
  export: "canExport",
}
