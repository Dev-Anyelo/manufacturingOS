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
