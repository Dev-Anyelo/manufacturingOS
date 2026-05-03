"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { CustomerSelector } from "./customer-selector"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCurrencySymbol } from "@/lib/currency/exchange"
import { EmptyState } from "@/components/shared/empty-state"
import { Currency, SaleChannel, PaymentMethod } from "@prisma/client"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { PosCartItem, PosCustomer } from "@/components/modules/sales/types"

import {
  ArrowLeftRightIcon,
  BanknoteIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  ShirtIcon,
  ShoppingCartIcon,
  Trash2Icon,
  StoreIcon,
  ShoppingBagIcon,
  MessageCircleIcon,
  GlobeIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface PosCartProps {
  className?: string
  variant?: "panel" | "drawer"
  items: PosCartItem[]
  customers: PosCustomer[]
  selectedCustomer: PosCustomer | null
  onCustomerChange: (customer: PosCustomer | null) => void
  onCustomerCreated: (customer: PosCustomer) => void
  onIncreaseQuantity: (rowId: string) => void
  onDecreaseQuantity: (rowId: string) => void
  onRemoveItem: (rowId: string) => void
  onSizeChange: (rowId: string, size: string) => void
  channel: SaleChannel
  onChannelChange: (value: SaleChannel) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (value: PaymentMethod) => void
  subtotal: number
  discountPercent: number
  onDiscountPercentChange: (value: number) => void
  total: number
  receivedAmount: number
  onReceivedAmountChange: (value: number) => void
  amountPaid: number
  onAmountPaidChange: (value: number) => void
  dueDate: string
  onDueDateChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  canSubmit?: boolean
  highlightRowId?: string | null
  onRequestClear?: () => void
  currency: Currency
  onCurrencyChange: (value: Currency) => void
}

const paymentMethods = [
  {
    value: "cash",
    label: "Efectivo",
    description: "Recibido y cambio",
    icon: BanknoteIcon,
  },
  {
    value: "transfer",
    label: "Transferencia",
    description: "Pago digital",
    icon: CreditCardIcon,
  },
  {
    value: "credit",
    label: "Crédito",
    description: "Por cobrar",
    icon: CalendarIcon,
  },
  {
    value: "mixed",
    label: "Mixto",
    description: "Efectivo + Transf.",
    icon: ArrowLeftRightIcon,
  },
]

const channels = [
  { value: "in_person", label: "Tienda", icon: StoreIcon },
  { value: "order", label: "Pedido", icon: ShoppingBagIcon },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircleIcon },
  { value: "marketplace", label: "Marketplace", icon: GlobeIcon },
  { value: "other", label: "Otro", icon: MoreHorizontalIcon },
]

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function formatDateLabel(value: string) {
  if (!value) return "Seleccionar fecha"
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseInputDate(value))
}

export function PosCart(props: PosCartProps) {
  const {
    className,
    variant = "panel",
    items,
    customers,
    selectedCustomer,
    onCustomerChange,
    onCustomerCreated,
    onIncreaseQuantity,
    onDecreaseQuantity,
    onRemoveItem,
    onSizeChange,
    channel,
    onChannelChange,
    paymentMethod,
    onPaymentMethodChange,
    subtotal,
    discountPercent,
    onDiscountPercentChange,
    total,
    receivedAmount,
    onReceivedAmountChange,
    amountPaid,
    onAmountPaidChange,
    dueDate,
    onDueDateChange,
    notes,
    onNotesChange,
    onSubmit,
    isSubmitting,
    canSubmit,
    highlightRowId,
    onRequestClear,
    currency,
    onCurrencyChange,
  } = props

  const discountAmount = subtotal * (discountPercent / 100)
  const taxAmount = 0

  const computedAmountPaid =
    paymentMethod === "cash"
      ? receivedAmount
      : paymentMethod === "mixed"
        ? receivedAmount + amountPaid
        : amountPaid

  const pendingAmount = Math.max(total - computedAmountPaid, 0)
  const changeGiven = Math.max(computedAmountPaid - total, 0)
  const allowSubmit = canSubmit ?? items.length > 0

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden bg-card transition-all",
        variant === "panel" && "rounded-2xl border border-border/40 shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 bg-card/50 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 font-semibold">
          <ShoppingCartIcon className="size-5 text-brand" />
          <span className="text-base tracking-tight">Resumen de Venta</span>
          {items.length > 0 && (
            <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full bg-brand px-1.5 text-xs text-brand-foreground shadow-sm">
              {items.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CurrencySelector
            value={currency}
            onChange={onCurrencyChange}
            variant="ghost"
          />
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (onRequestClear) {
                  onRequestClear()
                  return
                }
                items.forEach((item) => onRemoveItem(item.rowId))
              }}
            >
              <Trash2Icon className="mr-1.5 size-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          {/* Customer Selection */}
          <div className="sticky top-3 z-20 -mx-4 mb-2 px-4">
            <div>
              <CustomerSelector
                customers={customers}
                value={selectedCustomer}
                onChange={onCustomerChange}
                onCustomerCreated={onCustomerCreated}
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="overflow-hidden rounded-xl border-0 bg-background/0 shadow-none">
            {items.length === 0 ? (
              <EmptyState
                title="Carrito vacío"
                description="Agrega productos desde el catálogo para comenzar."
                icon={<ShoppingCartIcon />}
              />
            ) : (
              <div className="divide-y divide-border/20">
                {items.map((item) => (
                  <CartItemRow
                    key={item.rowId}
                    item={item}
                    highlighted={Boolean(
                      highlightRowId && highlightRowId === item.rowId
                    )}
                    onIncrease={() => onIncreaseQuantity(item.rowId)}
                    onDecrease={() => onDecreaseQuantity(item.rowId)}
                    onRemove={() => onRemoveItem(item.rowId)}
                    onSizeChange={(size) => onSizeChange(item.rowId, size)}
                    currency={currency}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Settings: Channel & Discount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Canal
              </Label>
              <Select value={channel} onValueChange={(v) => onChannelChange(v as SaleChannel)}>
                <SelectTrigger className="h-10 w-full rounded-xl border-border/60 bg-background shadow-sm">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <c.icon className="size-4 text-muted-foreground" />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Descuento (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-10 rounded-xl border-border/60 bg-background pr-8 text-base shadow-sm"
                  value={discountPercent || ""}
                  data-pos-enter-submit="true"
                  placeholder="0.00"
                  onChange={(event) =>
                    onDiscountPercentChange(Number(event.target.value || 0))
                  }
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Método de pago
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-2 rounded-2xl p-4 transition-all",
                    paymentMethod === method.value
                      ? "border-0 bg-brand/5 shadow-sm ring-1 ring-brand/20"
                      : "bg-background hover:border-brand/40"
                  )}
                >
                  <RadioGroupItem value={method.value} className="sr-only" />
                  <div className="flex items-center justify-between">
                    <method.icon
                      className={cn(
                        "size-5",
                        paymentMethod === method.value
                          ? "text-brand"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <div
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full border",
                        paymentMethod === method.value
                          ? "border-brand bg-brand"
                          : "border-border/60"
                      )}
                    >
                      {paymentMethod === method.value && (
                        <div className="size-1.5 rounded-full bg-brand-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        paymentMethod === method.value
                          ? "text-brand"
                          : "text-foreground"
                      )}
                    >
                      {method.label}
                    </span>
                    <span className="block text-[0.6875rem] text-muted-foreground">
                      {method.description}
                    </span>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Dynamic Payment Fields */}
          <div className="space-y-4">
            {paymentMethod === "cash" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Recibido
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="h-12 rounded-xl border-border/60 bg-background pl-8 text-lg font-bold shadow-sm transition-colors focus:border-brand"
                      value={receivedAmount || ""}
                      data-pos-enter-submit="true"
                      placeholder="0.00"
                      onChange={(event) =>
                        onReceivedAmountChange(Number(event.target.value || 0))
                      }
                    />
                  </div>
                </div>
                {changeGiven > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-brand px-4 py-3 font-black text-brand-foreground">
                    <span className="text-sm">Cambio a devolver</span>
                    <span className="text-xl tracking-tight tabular-nums">
                      <CurrencyDisplay amount={changeGiven} />
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "transfer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Monto transferido
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground">
                    {getCurrencySymbol(currency)}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-12 rounded-xl border-border/60 bg-background pl-8 text-lg font-bold shadow-sm transition-colors focus:border-brand"
                    value={amountPaid || ""}
                    data-pos-enter-submit="true"
                    placeholder="0.00"
                    onChange={(event) =>
                      onAmountPaidChange(Number(event.target.value || 0))
                    }
                  />
                </div>
              </div>
            )}

            {paymentMethod === "credit" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Anticipo (Opcional)
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground">
                      {getCurrencySymbol(currency)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="h-10 rounded-xl border-border/60 bg-background pl-8 text-base shadow-sm focus:border-brand"
                      value={amountPaid || ""}
                      data-pos-enter-submit="true"
                      placeholder="0.00"
                      onChange={(event) =>
                        onAmountPaidChange(Number(event.target.value || 0))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Fecha compromiso
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-10 w-full justify-start rounded-xl border-border/60 bg-background text-left font-normal shadow-sm",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4 opacity-70" />
                        <span className="truncate">
                          {formatDateLabel(dueDate)}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate ? parseInputDate(dueDate) : undefined}
                        onSelect={(date) => {
                          if (date) onDueDateChange(toInputDate(date))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {!dueDate && (
                    <p className="text-warning text-[0.6875rem] font-medium">
                      Requerida
                    </p>
                  )}
                </div>
              </div>
            )}

            {paymentMethod === "mixed" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Efectivo
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-10 rounded-xl border-border/60 bg-background pl-8 text-base shadow-sm focus:border-brand"
                        value={receivedAmount || ""}
                        data-pos-enter-submit="true"
                        onChange={(event) =>
                          onReceivedAmountChange(
                            Number(event.target.value || 0)
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Transferencia
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-medium text-muted-foreground">
                        {getCurrencySymbol(currency)}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        className="h-10 rounded-xl border-border/60 bg-background pl-8 text-base shadow-sm focus:border-brand"
                        value={amountPaid || ""}
                        data-pos-enter-submit="true"
                        onChange={(event) =>
                          onAmountPaidChange(Number(event.target.value || 0))
                        }
                      />
                    </div>
                  </div>
                </div>
                {changeGiven > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-brand px-4 py-3 font-black text-brand-foreground">
                    <span className="text-sm">Cambio a devolver</span>
                    <span className="text-xl tracking-tight tabular-nums">
                      <CurrencyDisplay amount={changeGiven} />
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="pt-2">
              <Label className="mb-1.5 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Notas (Opcional)
              </Label>
              <Textarea
                rows={5}
                placeholder="Notas internas..."
                className="max-h-20 min-h-10 resize-none rounded-xl border-border/60 bg-background text-sm shadow-sm focus:border-brand"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer / Summary / Checkout */}
      <div className="z-10 shrink-0 border-t border-border/40 bg-card p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] md:p-5">
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground tabular-nums">
              <CurrencyDisplay amount={subtotal} currency={currency} />
            </span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Descuento ({discountPercent}%)
              </span>
              <span className="text-danger font-medium tabular-nums">
                -<CurrencyDisplay amount={discountAmount} currency={currency} />
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Impuesto</span>
            <span className="font-medium text-foreground tabular-nums">
              <CurrencyDisplay amount={taxAmount} currency={currency} />
            </span>
          </div>

          <Separator className="my-2 opacity-60" />

          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-2xl font-black tracking-tight text-brand tabular-nums">
              <CurrencyDisplay amount={total} currency={currency} />
            </span>
          </div>

          {(pendingAmount > 0 || computedAmountPaid > 0) && (
            <div className="mt-1 flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">
                Pagado:{" "}
                <span className="font-medium text-foreground">
                  <CurrencyDisplay
                    amount={computedAmountPaid}
                    currency={currency}
                  />
                </span>
              </span>
              {pendingAmount > 0 && (
                <span className="text-warning font-medium">
                  Pendiente:{" "}
                  <CurrencyDisplay amount={pendingAmount} currency={currency} />
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={() => void onSubmit()}
          disabled={!allowSubmit || isSubmitting}
          className="w-full rounded-xl bg-brand text-sm font-bold text-brand-foreground shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
          size="lg"
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckCircle2Icon className="size-4" />
          )}
          {isSubmitting ? "Procesando..." : "Registrar venta"}
        </Button>
      </div>
    </div>
  )
}

function CartItemRow({
  item,
  highlighted,
  onIncrease,
  onDecrease,
  onRemove,
  onSizeChange,
  currency,
}: {
  item: PosCartItem
  highlighted: boolean
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
  onSizeChange: (size: string) => void
  currency: Currency
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 border-b border-border/20 p-3 transition-colors last:border-0",
        highlighted && "bg-brand/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted/30">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShirtIcon className="size-5 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 py-0.5">
          <p className="line-clamp-2 text-sm leading-tight font-semibold text-foreground">
            {item.name}
          </p>
          <div className="mt-1 text-sm font-bold tracking-tight text-brand tabular-nums">
            <CurrencyDisplay amount={item.unitPrice} currency={currency} />
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-full text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          aria-label={`Eliminar ${item.name}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {/* Size Input */}
        <div className="flex-1">
          <Input
            placeholder="Talla (Opcional)"
            value={item.size}
            className="h-9 rounded-lg border-border/60 bg-background text-sm shadow-sm focus:border-brand"
            onChange={(event) => onSizeChange(event.target.value)}
          />
        </div>

        {/* Quantity Controls */}
        <div className="flex h-11 items-center overflow-hidden rounded-lg border border-border/40 bg-background shadow-sm">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-full w-12 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
            onClick={onDecrease}
            aria-label="Disminuir"
          >
            <MinusIcon className="size-5" />
          </Button>
          <div className="flex h-full w-12 items-center justify-center border-x border-border/40 bg-muted/10">
            <span className="text-base font-bold tabular-nums">
              {item.quantity}
            </span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-full w-12 rounded-none text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80"
            onClick={onIncrease}
            aria-label="Aumentar"
          >
            <PlusIcon className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
