import { Currency } from "@prisma/client"

export interface PosCatalogItem {
  id: string
  name: string
  garmentType: string | null
  salePrice: number
  salePriceCurrency: Currency
  imageUrl: string | null
  /** Optional stock indicator (if/when the backend provides it). */
  stock?: number | null
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
  name: string
  garmentType: string | null
  unitPrice: number
  quantity: number
  size: string
  discount: number
  imageUrl: string | null
}

export interface SaleReceiptData {
  id: string
  createdAt: Date
  customerName: string
  paymentMethod: string
  channel: string
  subtotal: number
  discount: number
  total: number
  totalCurrency: string
  amountPaid: number
  changeGiven: number
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    unitPriceCurrency: string
    size: string
    subtotal: number
  }>
}
