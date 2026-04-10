import { WorkOrderStatus } from "@prisma/client"

export type WorkOrderChannel =
  | "in_person"
  | "referral"
  | "social_media"
  | "returning_customer"
  | "other"

export interface OrderSummaryItem {
  id: string
  customerId: string
  customerName: string
  receivedDate: string
  deliveryDate: string
  status: WorkOrderStatus
  channel: WorkOrderChannel
  advancePaid: number
  total: number
  balanceDue: number
  notes: string | null
  cancelledReason: string | null
  garmentCount: number
}

export interface OrderDetailLine {
  id: string
  description: string
  size: string | null
  color: string | null
  designNotes: string | null
  quantity: number
  unitPrice: number
  subtotal: number
  measurements: Record<string, unknown> | null
  catalogItemName: string | null
  inventoryItemName: string | null
}

export interface OrderStatusHistoryItem {
  id: string
  action: string
  createdAt: string
  actorName: string | null
}

export interface OrderDetailData {
  id: string
  customerId: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  receivedDate: string
  deliveryDate: string
  status: WorkOrderStatus
  channel: WorkOrderChannel
  advancePaid: number
  total: number
  balanceDue: number
  notes: string | null
  cancelledReason: string | null
  referenceImages: string[]
  items: OrderDetailLine[]
  statusHistory: OrderStatusHistoryItem[]
}

export type OrderStatusColumns = Record<WorkOrderStatus, OrderSummaryItem[]>
