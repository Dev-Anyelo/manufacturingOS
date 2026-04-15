"use client"

import * as React from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { PosCart } from "@/components/modules/sales/pos-cart"
import { SaleReceipt } from "@/components/modules/sales/sale-receipt"
import { PosCatalogPanel } from "@/components/modules/sales/pos-catalog-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type {
  PosCatalogItem,
  PosCartItem,
  PosCustomer,
  SaleReceiptData,
} from "@/components/modules/sales/types"

interface PosInterfaceProps {
  catalogItems: PosCatalogItem[]
  customers: PosCustomer[]
}

function createCartItem(catalogItem: PosCatalogItem): PosCartItem {
  return {
    rowId: crypto.randomUUID(),
    catalogItemId: catalogItem.id,
    name: catalogItem.name,
    garmentType: catalogItem.garmentType,
    unitPrice: catalogItem.salePrice,
    quantity: 1,
    size: "",
    discount: 0,
    imageUrl: catalogItem.imageUrl,
  }
}

export function PosInterface({ catalogItems, customers }: PosInterfaceProps) {
  const [activeTab, setActiveTab] = React.useState("catalog")
  const [customerOptions, setCustomerOptions] = React.useState(customers)
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<PosCustomer | null>(null)
  const [cartItems, setCartItems] = React.useState<PosCartItem[]>([])
  const [channel, setChannel] = React.useState("in_person")
  const [paymentMethod, setPaymentMethod] = React.useState("cash")
  const [discountPercent, setDiscountPercent] = React.useState(0)
  const [receivedAmount, setReceivedAmount] = React.useState(0)
  const [amountPaid, setAmountPaid] = React.useState(0)
  const [dueDate, setDueDate] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [receiptOpen, setReceiptOpen] = React.useState(false)
  const [receiptData, setReceiptData] = React.useState<SaleReceiptData | null>(
    null
  )

  const subtotal = React.useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    )
  }, [cartItems])

  const discountAmount = subtotal * (discountPercent / 100)
  const total = Math.max(subtotal - discountAmount, 0)

  const computedAmountPaid = React.useMemo(() => {
    if (paymentMethod === "cash") return receivedAmount
    return amountPaid
  }, [amountPaid, paymentMethod, receivedAmount])

  function handleAddItem(catalogItem: PosCatalogItem) {
    setCartItems((previous) => {
      const existing = previous.find(
        (item) => item.catalogItemId === catalogItem.id
      )
      if (!existing) return [...previous, createCartItem(catalogItem)]
      return previous.map((item) => {
        if (item.rowId !== existing.rowId) return item
        return { ...item, quantity: item.quantity + 1 }
      })
    })
    toast.success("Item agregado al carrito.")
  }

  function handleIncreaseQuantity(rowId: string) {
    setCartItems((previous) =>
      previous.map((item) =>
        item.rowId === rowId ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function handleDecreaseQuantity(rowId: string) {
    setCartItems((previous) =>
      previous
        .map((item) =>
          item.rowId === rowId
            ? { ...item, quantity: Math.max(item.quantity - 1, 0) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function handleRemoveItem(rowId: string) {
    setCartItems((previous) => previous.filter((item) => item.rowId !== rowId))
  }

  function handleSizeChange(rowId: string, size: string) {
    setCartItems((previous) =>
      previous.map((item) => (item.rowId === rowId ? { ...item, size } : item))
    )
  }

  function resetPos() {
    setSelectedCustomer(null)
    setCartItems([])
    setChannel("in_person")
    setPaymentMethod("cash")
    setDiscountPercent(0)
    setReceivedAmount(0)
    setAmountPaid(0)
    setDueDate("")
    setNotes("")
    setReceiptOpen(false)
    setReceiptData(null)
    setActiveTab("catalog")
  }

  async function handleSubmitSale() {
    if (cartItems.length === 0) {
      toast.error("Agrega al menos un item para registrar la venta.")
      return
    }
    if (paymentMethod === "cash" && receivedAmount <= 0) {
      toast.error("Ingresa el monto recibido en efectivo.")
      return
    }
    setIsSubmitting(true)
    try {
      const saleNotes = [
        notes.trim(),
        paymentMethod === "credit" && dueDate
          ? `Fecha compromiso: ${dueDate}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id ?? null,
          sale_date: new Date().toISOString(),
          channel,
          payment_method: paymentMethod,
          discount: discountAmount,
          amount_paid: computedAmountPaid,
          notes: saleNotes || null,
          items: cartItems.map((item) => ({
            catalog_item_id: item.catalogItemId,
            description: item.name,
            size: item.size || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount,
          })),
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        data?: { id: string }
        error?: string
      }

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "No se pudo registrar la venta.")
      }

      setReceiptData({
        id: payload.data.id,
        createdAt: new Date(),
        customerName: selectedCustomer?.fullName ?? "Cliente ocasional",
        channel,
        paymentMethod,
        subtotal,
        discount: discountAmount,
        total,
        amountPaid: computedAmountPaid,
        changeGiven: Math.max(computedAmountPaid - total, 0),
        items: cartItems.map((item) => ({
          id: item.rowId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          size: item.size,
          subtotal: item.unitPrice * item.quantity,
        })),
      })

      setReceiptOpen(true)
      toast.success("Venta registrada correctamente.")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la venta."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cartProps = {
    items: cartItems,
    customers: customerOptions,
    selectedCustomer,
    onCustomerChange: setSelectedCustomer,
    onCustomerCreated: (customer: PosCustomer) =>
      setCustomerOptions((previous) => [customer, ...previous]),
    onIncreaseQuantity: handleIncreaseQuantity,
    onDecreaseQuantity: handleDecreaseQuantity,
    onRemoveItem: handleRemoveItem,
    onSizeChange: handleSizeChange,
    channel,
    onChannelChange: setChannel,
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    subtotal,
    discountPercent,
    onDiscountPercentChange: setDiscountPercent,
    total,
    receivedAmount,
    onReceivedAmountChange: setReceivedAmount,
    amountPaid,
    onAmountPaidChange: setAmountPaid,
    dueDate,
    onDueDateChange: setDueDate,
    notes,
    onNotesChange: setNotes,
    onSubmit: handleSubmitSale,
    isSubmitting,
  }

  return (
    <>
      {/* Desktop layout */}
      <div className="hidden h-[calc(100vh-11rem)] gap-0 overflow-hidden rounded-xl border border-border/50 md:flex">
        {/* Catalog panel */}
        <div className="flex-1 overflow-y-auto border-r border-border/50 bg-background px-4">
          <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
        </div>

        {/* Cart panel */}
        <div className="flex w-85 shrink-0 flex-col overflow-hidden bg-card lg:w-95">
          <PosCart {...cartProps} />
        </div>
      </div>

      {/* Mobile layout with tabs */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 w-full rounded-none border-b border-border/50 bg-background">
            <TabsTrigger value="catalog" className="flex-1 gap-2 text-sm">
              Catalogo
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex-1 gap-1.5 text-sm">
              Carrito
              {cartItems.length > 0 ? (
                <Badge className="text-brand-foreground h-5 min-w-5 justify-center rounded-full bg-brand px-1.5 text-[10px]">
                  {cartItems.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="catalog"
            className="mt-0 h-[calc(100vh-16rem)] overflow-y-auto px-1 pt-3"
          >
            <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
          </TabsContent>
          <TabsContent
            value="cart"
            className="mt-0 h-[calc(100vh-16rem)] overflow-y-auto"
          >
            <PosCart {...cartProps} />
          </TabsContent>
        </Tabs>
      </div>

      <SaleReceipt
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receiptData}
        onNewSale={resetPos}
      />
    </>
  )
}
