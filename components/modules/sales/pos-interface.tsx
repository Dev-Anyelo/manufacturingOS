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

  React.useEffect(() => {
    setCustomerOptions(customers)
  }, [customers])

  const subtotal = React.useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    )
  }, [cartItems])

  const discountAmount = React.useMemo(() => {
    return subtotal * (discountPercent / 100)
  }, [subtotal, discountPercent])

  const total = React.useMemo(() => {
    return Math.max(subtotal - discountAmount, 0)
  }, [subtotal, discountAmount])

  const computedAmountPaid = React.useMemo(() => {
    if (paymentMethod === "cash") {
      return receivedAmount
    }
    return amountPaid
  }, [paymentMethod, receivedAmount, amountPaid])

  function handleAddItem(catalogItem: PosCatalogItem) {
    setCartItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.catalogItemId === catalogItem.id && item.size === ""
      )

      if (existingIndex === -1) {
        return [createCartItem(catalogItem), ...previous]
      }

      const next = [...previous]
      const existing = next[existingIndex]
      next[existingIndex] = { ...existing, quantity: existing.quantity + 1 }
      return next
    })
    setActiveTab("cart")
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
      previous.flatMap((item) => {
        if (item.rowId !== rowId) {
          return [item]
        }
        if (item.quantity <= 1) {
          return []
        }
        return [{ ...item, quantity: item.quantity - 1 }]
      })
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
      <div className="hidden md:block">
        <div className="flex h-[calc(100vh-14.5rem)] gap-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-3">
            <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
          </div>

          <div className="flex w-85 shrink-0 flex-col overflow-hidden lg:w-95">
            <PosCart {...cartProps} />
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-11 w-full rounded-xl border border-border/70 bg-background px-1">
            <TabsTrigger value="catalog" className="flex-1 gap-2 text-sm">
              Catalogo
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex-1 gap-1.5 text-sm">
              Carrito
              {cartItems.length > 0 ? (
                <Badge className="h-5 min-w-5 justify-center rounded-full bg-brand px-1.5 text-xs text-brand-foreground">
                  {cartItems.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="catalog"
            className="mt-0 h-[calc(100vh-20rem)] overflow-y-auto px-1 pt-3"
          >
            <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
          </TabsContent>
          <TabsContent
            value="cart"
            className="mt-0 h-[calc(100vh-20rem)] overflow-y-auto"
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
