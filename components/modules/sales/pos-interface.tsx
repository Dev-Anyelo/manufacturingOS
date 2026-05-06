"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/stores/settingsStore"
import { KeyboardIcon, ShoppingCartIcon } from "lucide-react"
import { PosCart } from "@/components/modules/sales/pos-cart"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Currency, SaleChannel, PaymentMethod } from "@prisma/client"
import { SaleReceipt } from "@/components/modules/sales/sale-receipt"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { convertAmount, getCurrencySymbol } from "@/lib/currency/exchange"
import { PosCatalogPanel } from "@/components/modules/sales/pos-catalog-panel"
import { VariantSelector } from "@/components/modules/sales/variant-selector"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

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

function createCartItem(
  catalogItem: PosCatalogItem,
  finishedGoodStockId?: string,
  size?: string,
  color?: string | null,
  variantLabel?: string,
  maxQuantity?: number
): PosCartItem {
  return {
    rowId: crypto.randomUUID(),
    catalogItemId: catalogItem.id,
    finishedGoodStockId: finishedGoodStockId || null,
    variantLabel: variantLabel || null,
    maxQuantity: maxQuantity ?? null,
    name: catalogItem.name,
    garmentType: catalogItem.garmentType,
    unitPrice: catalogItem.salePrice,
    quantity: 1,
    size: size || "",
    color: color || null,
    discount: 0,
    imageUrl: catalogItem.imageUrl,
  }
}

export function PosInterface({ catalogItems, customers }: PosInterfaceProps) {
  const [customerOptions, setCustomerOptions] = React.useState(customers)
  const [selectedCustomer, setSelectedCustomer] =
    React.useState<PosCustomer | null>(null)
  const { settings, exchangeRate } = useSettingsStore()

  // Build rate map for convertAmount function
  const rateMap: Record<string, number> = {
    [`${Currency.USD}_${Currency.NIO}`]: exchangeRate,
    [`${Currency.NIO}_${Currency.USD}`]: 1 / exchangeRate,
  }

  const [cartItems, setCartItems] = React.useState<PosCartItem[]>([])
  const [cartDrawerOpen, setCartDrawerOpen] = React.useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = React.useState(false)
  const [addCounts, setAddCounts] = React.useState<Record<string, number>>({})
  const [highlightRowId, setHighlightRowId] = React.useState<string | null>(
    null
  )
  const [channel, setChannel] = React.useState<SaleChannel>(
    SaleChannel.in_person
  )
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    PaymentMethod.cash
  )
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
  const [currency, setCurrency] = React.useState<Currency>(
    settings?.baseCurrency || (Currency.USD as Currency)
  )
  const [variantSelectorOpen, setVariantSelectorOpen] = React.useState(false)
  const [selectedItemForVariant, setSelectedItemForVariant] =
    React.useState<PosCatalogItem | null>(null)

  React.useEffect(() => {
    setCustomerOptions(customers)
  }, [customers])

  React.useEffect(() => {
    if (settings?.baseCurrency) {
      setCurrency(settings.baseCurrency)
    }
  }, [settings?.baseCurrency])

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
    if (paymentMethod === "cash") return receivedAmount
    if (paymentMethod === "mixed") return receivedAmount + amountPaid
    return amountPaid
  }, [amountPaid, paymentMethod, receivedAmount])

  const changeGiven = React.useMemo(() => {
    return Math.max(computedAmountPaid - total, 0)
  }, [computedAmountPaid, total])

  const canSubmit =
    cartItems.length > 0 &&
    !isSubmitting &&
    (paymentMethod !== "cash" || receivedAmount > 0) &&
    (paymentMethod !== "transfer" || amountPaid > 0) &&
    (paymentMethod !== "mixed" || receivedAmount + amountPaid > 0) &&
    (paymentMethod !== "credit" || Boolean(dueDate))

  function handleAddItem(catalogItem: PosCatalogItem) {
    // If item has variants, open variant selector
    if (catalogItem.finishedGoods && catalogItem.finishedGoods.length > 0) {
      setSelectedItemForVariant(catalogItem)
      setVariantSelectorOpen(true)
      return
    }

    // Otherwise, add directly to cart
    setAddCounts((previous) => ({
      ...previous,
      [catalogItem.id]: (previous[catalogItem.id] ?? 0) + 1,
    }))

    // Convert price if catalog item currency differs from current POS currency
    const itemUnitPrice =
      convertAmount(
        catalogItem.salePrice,
        catalogItem.salePriceCurrency,
        currency,
        rateMap
      ) ?? catalogItem.salePrice

    setCartItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.catalogItemId === catalogItem.id && item.size === ""
      )

      if (existingIndex === -1) {
        const created = {
          ...createCartItem(catalogItem),
          unitPrice: itemUnitPrice,
        }
        setHighlightRowId(created.rowId)
        return [created, ...previous]
      }

      const next = [...previous]
      const existing = next[existingIndex]
      next[existingIndex] = { ...existing, quantity: existing.quantity + 1 }
      setHighlightRowId(existing.rowId)
      return next
    })
  }

  function handleIncreaseQuantity(rowId: string) {
    setCartItems((previous) =>
      previous.map((item) =>
        item.rowId === rowId
          ? {
              ...item,
              quantity: item.maxQuantity
                ? Math.min(item.quantity + 1, item.maxQuantity)
                : item.quantity + 1,
            }
          : item
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

  function handleSizeChange(rowId: string, size: string) {
    setCartItems((previous) =>
      previous.map((item) => (item.rowId === rowId ? { ...item, size } : item))
    )
  }

  function handleRemoveItem(rowId: string) {
    setCartItems((previous) => previous.filter((item) => item.rowId !== rowId))
  }

  function handleSelectVariant(params: {
    finishedGoodStockId: string
    size: string
    color: string | null
    quantity: number
    variantLabel: string
    maxQuantity: number
  }) {
    if (!selectedItemForVariant) return

    const catalogItem = selectedItemForVariant

    setAddCounts((previous) => ({
      ...previous,
      [catalogItem.id]: (previous[catalogItem.id] ?? 0) + 1,
    }))

    // Convert price if catalog item currency differs from current POS currency
    const itemUnitPrice =
      convertAmount(
        catalogItem.salePrice,
        catalogItem.salePriceCurrency,
        currency,
        rateMap
      ) ?? catalogItem.salePrice

    setCartItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => item.finishedGoodStockId === params.finishedGoodStockId
      )

      if (existingIndex === -1) {
        const created = {
          ...createCartItem(
            selectedItemForVariant!,
            params.finishedGoodStockId,
            params.size,
            params.color,
            params.variantLabel,
            params.maxQuantity
          ),
          quantity: params.quantity,
          unitPrice: itemUnitPrice,
        }
        setHighlightRowId(created.rowId)
        return [created, ...previous]
      }

      const next = [...previous]
      const existing = next[existingIndex]
      next[existingIndex] = {
        ...existing,
        quantity: Math.min(
          existing.quantity + params.quantity,
          existing.maxQuantity ?? Number.MAX_SAFE_INTEGER
        ),
      }
      setHighlightRowId(existing.rowId)
      return next
    })

    setSelectedItemForVariant(null)
  }

  function resetPos() {
    setSelectedCustomer(null)
    setCartItems([])
    setAddCounts({})
    setChannel("in_person")
    setPaymentMethod("cash")
    setDiscountPercent(0)
    setReceivedAmount(0)
    setAmountPaid(0)
    setDueDate("")
    setNotes("")
    setCurrency(settings?.baseCurrency || (Currency.USD as Currency))
    setReceiptOpen(false)
    setReceiptData(null)
    setCartDrawerOpen(false)
  }

  const previousCurrencyRef = React.useRef<Currency>(currency)

  React.useEffect(() => {
    const previousCurrency = previousCurrencyRef.current
    if (previousCurrency === currency) return

    // Convert cart items unit prices and discounts
    setCartItems((prev) =>
      prev.map((item) => ({
        ...item,
        unitPrice:
          convertAmount(item.unitPrice, previousCurrency, currency, rateMap) ??
          item.unitPrice,
        discount:
          convertAmount(item.discount, previousCurrency, currency, rateMap) ??
          item.discount,
      }))
    )

    // Convert payment amounts
    setReceivedAmount(
      (prev) => convertAmount(prev, previousCurrency, currency, rateMap) ?? prev
    )
    setAmountPaid(
      (prev) => convertAmount(prev, previousCurrency, currency, rateMap) ?? prev
    )

    previousCurrencyRef.current = currency
  }, [currency])

  React.useEffect(() => {
    if (!highlightRowId) return

    const timer = window.setTimeout(() => setHighlightRowId(null), 650)
    return () => window.clearTimeout(timer)
  }, [highlightRowId])

  const requestClearCart = React.useCallback(() => {
    if (cartItems.length === 0) return
    setConfirmClearOpen(true)
  }, [cartItems.length])

  const clearCart = React.useCallback(() => {
    setCartItems([])
    setReceivedAmount(0)
    setAmountPaid(0)
    toast.success("Carrito limpiado.")
  }, [])

  const handleSubmitSale = React.useCallback(async () => {
    if (cartItems.length === 0) {
      toast.error("Agrega al menos un item para registrar la venta.")
      return
    }

    if (paymentMethod === "cash" && receivedAmount <= 0) {
      toast.error("Ingresa el monto recibido en efectivo.")
      return
    }

    if (paymentMethod === "transfer" && amountPaid <= 0) {
      toast.error("Ingresa el monto pagado por transferencia.")
      return
    }

    if (paymentMethod === "mixed" && receivedAmount + amountPaid <= 0) {
      toast.error("Ingresa los montos del pago mixto.")
      return
    }

    if (paymentMethod === "credit" && !dueDate) {
      toast.error("Selecciona la fecha compromiso del credito.")
      return
    }

    setIsSubmitting(true)

    try {
      const paymentBreakdownNote =
        paymentMethod === "mixed"
          ? `Pago mixto: Efectivo ${getCurrencySymbol(currency)}${receivedAmount.toFixed(2)} + Transferencia ${getCurrencySymbol(currency)}${amountPaid.toFixed(2)}`
          : ""

      const saleNotes = [
        notes.trim(),
        paymentBreakdownNote,
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
          discount_currency: currency,
          amount_paid: computedAmountPaid,
          amount_paid_currency: currency,
          total: total,
          total_currency: currency,
          change_given: changeGiven,
          change_given_currency: currency,
          notes: saleNotes || null,
          items: cartItems.map((item) => ({
            catalog_item_id: item.catalogItemId,
            finished_good_stock_id: item.finishedGoodStockId,
            description: item.name,
            size: item.size || null,
            color: item.color || null,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit_price_currency: currency,
            discount: item.discount,
            discount_currency: currency,
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
        totalCurrency: currency,
        amountPaid: computedAmountPaid,
        changeGiven,
        items: cartItems.map((item) => ({
          id: item.rowId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitPriceCurrency: currency, // En POS, los items se convierten a la moneda de la transaccion
          size: item.size,
          color: item.color,
          subtotal: item.unitPrice * item.quantity,
        })),
      })

      setReceiptOpen(true)
      setCartDrawerOpen(false)
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
  }, [
    amountPaid,
    cartItems,
    changeGiven,
    channel,
    computedAmountPaid,
    discountAmount,
    dueDate,
    notes,
    paymentMethod,
    receivedAmount,
    selectedCustomer,
    subtotal,
    total,
  ])

  React.useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!target || !(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      )
    }

    function allowEnterSubmitFromTarget(target: EventTarget | null) {
      if (!target || !(target instanceof HTMLElement)) return false
      return target.getAttribute("data-pos-enter-submit") === "true"
    }

    function onKeyDown(event: KeyboardEvent) {
      if (receiptOpen) return

      const isMobile = window.matchMedia("(max-width: 767px)").matches

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        const searchInput = document.getElementById(
          "pos-catalog-search"
        ) as HTMLInputElement | null
        searchInput?.focus()
        return
      }

      if (event.key === "Escape") {
        if (isMobile && cartDrawerOpen) {
          setCartDrawerOpen(false)
          return
        }

        if (cartItems.length > 0) {
          event.preventDefault()
          setConfirmClearOpen(true)
        }

        return
      }

      if (event.key === "Enter") {
        const isEditable = isEditableTarget(event.target)
        if (isEditable && !allowEnterSubmitFromTarget(event.target)) {
          return
        }

        if (cartItems.length === 0) {
          return
        }

        if (isMobile && !cartDrawerOpen) {
          event.preventDefault()
          setCartDrawerOpen(true)
          return
        }

        if (!canSubmit) {
          return
        }

        event.preventDefault()
        void handleSubmitSale()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    canSubmit,
    cartDrawerOpen,
    cartItems.length,
    handleSubmitSale,
    receiptOpen,
  ])

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
    canSubmit,
    highlightRowId,
    onRequestClear: requestClearCart,
    currency,
    onCurrencyChange: setCurrency,
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {/* POS layout: desktop = 2 columns, tablet = stacked, mobile = catalog + drawer cart */}
        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-3 overflow-hidden",
            "md:grid-rows-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-4",
            "lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-1"
          )}
        >
          <div className="min-h-0 overflow-hidden rounded-2xl bg-card/80 shadow-lg backdrop-blur-sm">
            <PosCatalogPanel
              items={catalogItems}
              onAddItem={handleAddItem}
              addCounts={addCounts}
              currency={currency}
              exchangeRate={exchangeRate}
            />
          </div>

          <div className="hidden min-h-0 overflow-hidden rounded-2xl bg-card/80 shadow-lg backdrop-blur-sm md:block">
            <PosCart {...cartProps} />
          </div>
        </div>

        {/* Mobile sticky bar */}
        <div className="md:hidden">
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/40 bg-card/80 px-4 py-4 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] backdrop-blur-md">
            <Button
              type="button"
              className="h-14 w-full justify-between rounded-xl text-base shadow-sm"
              onClick={() => setCartDrawerOpen(true)}
              disabled={cartItems.length === 0}
              size="lg"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCartIcon className="size-5" />
                <span className="font-semibold">Carrito de venta</span>
                {cartItems.length > 0 ? (
                  <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full border-0 bg-background px-1.5 text-xs text-foreground shadow-sm">
                    {cartItems.length}
                  </Badge>
                ) : null}
              </span>
              <span className="text-lg font-bold tracking-tight tabular-nums">
                <CurrencyDisplay amount={total} currency={currency} />
              </span>
            </Button>

            <p className="mt-2 flex items-center justify-center gap-2 text-[0.6875rem] text-muted-foreground">
              <KeyboardIcon className="size-3.5" />
              <span>
                Atajos: <span className="font-medium">Ctrl/⌘ K</span> buscar •{" "}
                <span className="font-medium">Enter</span> cobrar •{" "}
                <span className="font-medium">Esc</span> limpiar
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile drawer cart */}
      <div className="md:hidden">
        <Drawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
          <DrawerContent className="h-[85vh] border-border/40 bg-background p-0">
            <div className="flex justify-center pt-3">
              <span className="block h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </div>
            <DrawerHeader className="sticky top-0 z-10 border-b border-border/40 bg-card/50 pb-4">
              <DrawerTitle className="inline-flex items-center justify-center gap-2">
                <ShoppingCartIcon className="size-5 text-brand" />
                <span className="text-base font-semibold">Carrito y cobro</span>
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-sm">
                {cartItems.length > 0
                  ? `${cartItems.length} item${cartItems.length === 1 ? "" : "s"} • Total `
                  : "Agrega productos desde el catálogo."}
                {cartItems.length > 0 && (
                  <span className="font-bold text-foreground">
                    <CurrencyDisplay
                      amount={total}
                      currency={currency}
                      size="sm"
                    />
                  </span>
                )}
              </DrawerDescription>
            </DrawerHeader>
            <PosCart
              {...cartProps}
              className="h-full rounded-none border-0 bg-transparent shadow-none"
              variant="drawer"
            />
          </DrawerContent>
        </Drawer>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Limpiar carrito"
        description="Esto eliminara todos los productos y montos ingresados para esta venta."
        confirmLabel="Limpiar carrito"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={clearCart}
      />

      <SaleReceipt
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        receipt={receiptData}
        onNewSale={resetPos}
      />

      <VariantSelector
        open={variantSelectorOpen}
        onOpenChange={setVariantSelectorOpen}
        itemName={selectedItemForVariant?.name ?? ""}
        variants={selectedItemForVariant?.finishedGoods ?? []}
        selectedSize=""
        selectedColor={null}
        onSelectVariant={handleSelectVariant}
      />
    </>
  )
}
