import { Currency, NotificationType } from "@prisma/client"

/**
 * Notification metadata structure
 * Ensures consistent shape across notification creation and rendering
 */

export interface MonetaryMetadata {
  amount: number
  currency: Currency
  convertedAmount?: number
  convertedCurrency?: Currency
  fxRate?: number
  asOfDate?: string
}

export interface EntityMetadata {
  module: string
  entityId: string
}

export interface ActionMetadata {
  actionUrl?: string
  actionLabel?: string
}

export type NotificationMetadata = {
  monetary?: MonetaryMetadata
  entity?: EntityMetadata
  action?: ActionMetadata
  [key: string]: unknown
}

/**
 * Helper to create monetary metadata
 */
export function createMonetaryMetadata(
  amount: number,
  currency: Currency,
  options?: {
    convertedAmount?: number
    convertedCurrency?: Currency
    fxRate?: number
    asOfDate?: string
  }
): MonetaryMetadata {
  return {
    amount,
    currency,
    ...options,
  }
}

/**
 * Helper to create entity metadata
 */
export function createEntityMetadata(
  module: string,
  entityId: string
): EntityMetadata {
  return { module, entityId }
}

/**
 * Helper to create action metadata
 */
export function createActionMetadata(
  actionUrl?: string,
  actionLabel?: string
): ActionMetadata {
  return { actionUrl, actionLabel }
}
