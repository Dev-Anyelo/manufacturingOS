"use client"

import * as React from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ShoppingCartIcon } from "lucide-react"
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
    if (paymentMethod === "cash") {
      return receivedAmount
    }

    return amountPaid
  }, [amountPaid, paymentMethod, receivedAmount])

  function handleAddItem(catalogItem: PosCatalogItem) {
    setCartItems((previous) => {
      const existing = previous.find(
        (item) => item.catalogItemId === catalogItem.id
      )

      if (!existing) {
        return [...previous, createCartItem(catalogItem)]
      }

      return previous.map((item) => {
        if (item.rowId !== existing.rowId) {
          return item
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        }
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
            ? {
                ...item,
                quantity: Math.max(item.quantity - 1, 0),
              }
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
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <>
      <div className="hidden h-[calc(100vh-11rem)] gap-0 overflow-hidden rounded-xl border border-border/50 md:grid md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px]">
        <div className="overflow-y-auto border-r border-border/50 bg-background p-4">
          <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
        </div>
        <div className="overflow-y-auto bg-card p-4">
          <PosCart
            items={cartItems}
            customers={customerOptions}
            selectedCustomer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
            onCustomerCreated={(customer) =>
              setCustomerOptions((previous) => [customer, ...previous])
            }
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onRemoveItem={handleRemoveItem}
            onSizeChange={handleSizeChange}
            channel={channel}
            onChannelChange={setChannel}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            subtotal={subtotal}
            discountPercent={discountPercent}
            onDiscountPercentChange={setDiscountPercent}
            total={total}
            receivedAmount={receivedAmount}
            onReceivedAmountChange={setReceivedAmount}
            amountPaid={amountPaid}
            onAmountPaidChange={setAmountPaid}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            notes={notes}
            onNotesChange={setNotes}
            onSubmit={handleSubmitSale}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-12 w-full rounded-none border-b border-border/50 bg-background">
            <TabsTrigger value="catalog" className="flex-1 text-sm">
              Catalogo
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex-1 gap-1.5 text-sm">
              Carrito
              <Badge className="min-w-5 justify-center rounded-full bg-brand px-1.5 text-[10px] text-brand-foreground">
                {cartItems.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="catalog"
            className="mt-0 h-[calc(100vh-16rem)] overflow-y-auto pt-3"
          >
            <PosCatalogPanel items={catalogItems} onAddItem={handleAddItem} />
          </TabsContent>
          <TabsContent
            value="cart"
            className="mt-0 h-[calc(100vh-16rem)] overflow-y-auto pt-3"
          >
            <PosCart
              items={cartItems}
              customers={customerOptions}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
              onCustomerCreated={(customer) =>
                setCustomerOptions((previous) => [customer, ...previous])
              }
              onIncreaseQuantity={handleIncreaseQuantity}
              onDecreaseQuantity={handleDecreaseQuantity}
              onRemoveItem={handleRemoveItem}
              onSizeChange={handleSizeChange}
              channel={channel}
              onChannelChange={setChannel}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              subtotal={subtotal}
              discountPercent={discountPercent}
              onDiscountPercentChange={setDiscountPercent}
              total={total}
              receivedAmount={receivedAmount}
              onReceivedAmountChange={setReceivedAmount}
              amountPaid={amountPaid}
              onAmountPaidChange={setAmountPaid}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={handleSubmitSale}
              isSubmitting={isSubmitting}
            />
          </TabsContent>
        </Tabs>
      </div>

      <SaleReceipt
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receiptData}
        onNewSale={resetPos}
      />

      {catalogItems.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/15 p-6 text-center text-sm text-muted-foreground">
          <ShoppingCartIcon className="mx-auto mb-2 size-5" />
          No hay items activos en catalogo para vender.
        </div>
      ) : null}
    </>
  )
}
