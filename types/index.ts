import type { Json } from "@/lib/supabase/types"
import type { CatalogItemInput } from "@/lib/validations/catalog"
import type { ExpenseInput } from "@/lib/validations/expenses"
import type { WorkOrderInput, WorkOrderStatusInput } from "@/lib/validations/orders"
import type {
  PayrollMarkPaidInput,
  PayrollPaymentInput,
} from "@/lib/validations/payroll"
import type { ProductionSessionInput } from "@/lib/validations/production"
import type { SaleInput } from "@/lib/validations/sales"
import type { SystemSettingsInput } from "@/lib/validations/settings"

export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  Employee = "employee",
  Readonly = "readonly",
}

export enum OrderStatus {
  Received = "received",
  Confirmed = "confirmed",
  InProduction = "in_production",
  Ready = "ready",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export enum MaterialCategory {
  Fabric = "fabric",
  Supplies = "supplies",
  Tools = "tools",
  Machinery = "machinery",
}

export enum PaymentMethod {
  Cash = "cash",
  Transfer = "transfer",
  Credit = "credit",
  Mixed = "mixed",
}

export enum SaleChannel {
  InPerson = "in_person",
  Order = "order",
  WhatsApp = "whatsapp",
  Marketplace = "marketplace",
  Other = "other",
}

export enum ContractType {
  FixedSalary = "fixed_salary",
  PerPiece = "per_piece",
  Hourly = "hourly",
}

export enum NotificationType {
  LowStock = "low_stock",
  OutOfStock = "out_of_stock",
  OrderReady = "order_ready",
  OrderOverdue = "order_overdue",
  SaleCompleted = "sale_completed",
  ProductionSaved = "production_saved",
  PaymentDue = "payment_due",
  MonthlyReport = "monthly_report",
  InventoryUpdated = "inventory_updated",
}

export const GARMENT_TYPES = {
  shirt: "Camisa",
  skirt: "Falda",
  shorts: "Short",
  leggings: "Leggings",
  pajamas: "Pijama",
  suit: "Traje",
  sheets: "Sabana",
  blankets: "Cobija",
  other: "Otro",
} as const

export const ORDER_STATUSES = {
  received: "Recibido",
  confirmed: "Confirmado",
  in_production: "En produccion",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const

export const EXPENSE_CATEGORIES = {
  fabrics: "Telas",
  supplies: "Insumos",
  tools: "Herramientas",
  machinery: "Maquinaria",
  outsourced_labor: "Mano de obra tercerizada",
  services: "Servicios",
  packaging: "Empaque",
  office: "Oficina",
  payroll: "Planilla",
  other: "Otro",
} as const

export interface Profile {
  id: string
  fullName: string | null
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  fullName: string
  documentId: string | null
  phone: string | null
  email: string | null
  hireDate: string
  contractType: ContractType
  baseSalary: number | null
  isActive: boolean
  profileId: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  category: MaterialCategory
  fabricType: string | null
  color: string | null
  quantity: number
  unit: string
  unitPrice: number
  minimumStock: number
  supplier: string | null
  notes: string | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryMovement {
  id: string
  inventoryItemId: string
  movementType: "in" | "out" | "adjustment"
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string | null
  createdBy: string | null
  createdAt: string
}

export interface Customer {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  totalPurchases: number
  createdAt: string
  updatedAt: string
}

export interface ProductionSession {
  id: string
  employeeId: string
  sessionDate: string
  totalGarments: number
  totalYardsUsed: number
  notes: string | null
  createdBy: string | null
  createdAt: string
}

export interface ProductionSessionItem {
  id: string
  sessionId: string
  inventoryItemId: string
  garmentType: keyof typeof GARMENT_TYPES
  size: string
  quantity: number
  yardsUsed: number
  notes: string | null
}

export interface Sale {
  id: string
  customerId: string | null
  saleDate: string
  channel: SaleChannel
  paymentMethod: PaymentMethod
  total: number
  discount: number
  amountPaid: number
  changeGiven: number
  balanceDue: number
  status: "paid" | "partial" | "pending" | "cancelled"
  notes: string | null
  createdBy: string | null
  createdAt: string
}

export interface SaleItem {
  id: string
  saleId: string
  catalogItemId: string | null
  description: string
  size: string | null
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

export interface WorkOrder {
  id: string
  customerId: string
  receivedDate: string
  deliveryDate: string
  status: OrderStatus
  channel: "in_person" | "referral" | "social_media" | "returning_customer" | "other"
  advancePaid: number
  total: number
  balanceDue: number
  reservedMaterials: Json | null
  referenceImages: string[]
  notes: string | null
  cancelledReason: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkOrderItem {
  id: string
  workOrderId: string
  catalogItemId: string | null
  description: string
  size: string | null
  measurements: Json | null
  inventoryItemId: string | null
  color: string | null
  designNotes: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Expense {
  id: string
  expenseDate: string
  category: keyof typeof EXPENSE_CATEGORIES
  concept: string
  supplier: string | null
  quantity: number | null
  unitPrice: number | null
  total: number
  updatesInventory: boolean
  inventoryItemId: string | null
  inventoryQuantityAdded: number | null
  receiptUrl: string | null
  notes: string | null
  payrollPaymentId: string | null
  createdBy: string | null
  createdAt: string
}

export interface PayrollPayment {
  id: string
  employeeId: string
  periodStart: string
  periodEnd: string
  piecesProduced: number | null
  hoursWorked: number | null
  baseAmount: number
  bonuses: number
  deductions: number
  total: number
  status: "pending" | "paid"
  paymentDate: string | null
  paymentMethod: "cash" | "transfer" | "other" | null
  notes: string | null
  receiptUrl: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CatalogItem {
  id: string
  name: string
  description: string | null
  garmentType: string | null
  marketPriceUnit: number | null
  marketPriceDozen: number | null
  ourPriceUnit: number | null
  ourPriceDozen: number | null
  estimatedCost: number | null
  imageUrl: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductionSessionWithItems = ProductionSession & {
  items: (ProductionSessionItem & { inventory_item: InventoryItem })[]
}

export type SaleWithItems = Sale & {
  items: SaleItem[]
  customer?: Customer
}

export type WorkOrderWithItems = WorkOrder & {
  items: WorkOrderItem[]
  customer: Customer
}

export type PayrollPaymentWithEmployee = PayrollPayment & {
  employee: Employee
}

export type CreateProductionSessionRequest = ProductionSessionInput
export type CreateSaleRequest = SaleInput
export type CreateWorkOrderRequest = WorkOrderInput
export type UpdateWorkOrderStatusRequest = WorkOrderStatusInput
export type CreateExpenseRequest = ExpenseInput
export type CreatePayrollPaymentRequest = PayrollPaymentInput
export type MarkPayrollPaidRequest = PayrollMarkPaidInput
export type CreateCatalogItemRequest = CatalogItemInput
export type UpdateSystemSettingsRequest = SystemSettingsInput
