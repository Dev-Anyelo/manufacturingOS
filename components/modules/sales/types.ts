import { Currency, SaleChannel, PaymentMethod } from "@prisma/client"

export interface PosCatalogItem {
  id: string
  name: string
  garmentType: string | null
  salePrice: number
  salePriceCurrency: Currency
  imageUrl: string | null
  stock?: number | null
  finishedGoods?: Array<{
    id: string
    size: string
    color: string | null
    stock: number
    minimumStock: number
  }>
}

export interface PosCustomer {
  id: string
  fullName: string
  phone?: string | null
  email?: string | null
}

export interface PosCartItem {
  rowId: string
  catalogItemId: string | null
  finishedGoodStockId: string | null
  variantLabel?: string | null
  maxQuantity?: number | null
  name: string
  garmentType: string | null
  unitPrice: number
  quantity: number
  size: string
  color: string | null
  discount: number
  imageUrl: string | null
}

export interface SaleReceiptData {
  id: string
  createdAt: Date
  customerName: string
  paymentMethod: PaymentMethod
  channel: SaleChannel
  subtotal: number
  discount: number
  total: number
  totalCurrency: Currency
  amountPaid: number
  changeGiven: number
  notes?: string | null
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    unitPriceCurrency: Currency
    size: string
    color: string | null
    subtotal: number
  }>
}
