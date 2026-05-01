// lib/permissions/cache.ts
// In-memory permission cache with TTL.
//
// ┌──────────────────────────────────────────────────────────────────┐
// │ STALE PERMISSION WINDOW                                         │
// │                                                                  │
// │ Maximum time a user can operate with outdated permissions:       │
// │                                                                  │
// │   Server cache TTL ......... 60 seconds (this file)              │
// │   TanStack Query staleTime .. 60 seconds (hooks/use-permissions) │
// │   ──────────────────────────────────────────                      │
// │   Worst-case total ......... ~120 seconds                        │
// │                                                                  │
// │ This is acceptable for an ERP with ~10 concurrent users where    │
// │ permission changes are infrequent (1-2 times per month).         │
// │                                                                  │
// │ Critical operations (user deactivation) bypass this cache        │
// │ entirely — requireAuth() always reads isActive from the DB.      │
// │                                                                  │
// │ When an admin changes permissions via the API, the handler       │
// │ calls invalidatePermissions() to clear the server-side cache     │
// │ for that user immediately.                                       │
// └──────────────────────────────────────────────────────────────────┘

import type { ResolvedPermissions } from "./types"

interface CacheEntry {
  data: ResolvedPermissions
  expiresAt: number
}

/**
 * Server-side TTL in milliseconds.
 * After this window, the next `resolvePermissions()` call will
 * re-fetch the user's role + overrides from the database.
 */
const SERVER_CACHE_TTL_MS = 60_000

/**
 * In-memory store. Each serverless instance has its own Map.
 * In Vercel, instances are recycled after ~5-15 min of inactivity,
 * which naturally limits memory growth.
 */
const store = new Map<string, CacheEntry>()

/**
 * Retrieve cached permissions for a user.
 * Returns `null` if not cached or expired.
 */
export function getCachedPermissions(
  userId: string
): ResolvedPermissions | null {
  const entry = store.get(userId)

  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    store.delete(userId)
    return null
  }

  return entry.data
}

/**
 * Store resolved permissions in cache.
 */
export function setCachedPermissions(
  userId: string,
  data: ResolvedPermissions
): void {
  store.set(userId, {
    data,
    expiresAt: Date.now() + SERVER_CACHE_TTL_MS,
  })
}

/**
 * Immediately remove cached permissions for a specific user.
 * Called when an admin updates that user's role or overrides.
 */
export function invalidatePermissions(userId: string): void {
  store.delete(userId)
}

/**
 * Clear ALL cached permissions. Used for bulk operations
 * (e.g. changing default permissions for an entire role).
 */
export function invalidateAllPermissions(): void {
  store.clear()
}
