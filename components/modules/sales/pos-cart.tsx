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
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { PosCartItem, PosCustomer } from "@/components/modules/sales/types"

import {
  CalendarIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  ShirtIcon,
  ShoppingCartIcon,
  Trash2Icon,
  XIcon,
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
  items: PosCartItem[]
  customers: PosCustomer[]
  selectedCustomer: PosCustomer | null
  onCustomerChange: (customer: PosCustomer | null) => void
  onCustomerCreated: (customer: PosCustomer) => void
  onIncreaseQuantity: (rowId: string) => void
  onDecreaseQuantity: (rowId: string) => void
  onRemoveItem: (rowId: string) => void
  onSizeChange: (rowId: string, size: string) => void
  channel: string
  onChannelChange: (value: string) => void
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
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
}

const paymentMethods = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "credit", label: "Credito" },
  { value: "mixed", label: "Mixto" },
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
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseInputDate(value))
}

export function PosCart({
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
  isSubmitting = false,
}: PosCartProps) {
  const discountAmount = subtotal * (discountPercent / 100)
  const changeGiven = Math.max(receivedAmount - total, 0)

  return (
    <div className="flex h-full flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card/80 shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/10 px-1 py-3">
        <div className="flex items-center gap-2 px-4 text-sm font-semibold">
          <ShoppingCartIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Carrito</span>
          {items.length > 0 ? (
            <Badge className="h-5 min-w-5 justify-center rounded-full bg-brand px-1.5 text-xs text-brand-foreground">
              {items.length}
            </Badge>
          ) : null}
        </div>
        {items.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              items.forEach((item) => onRemoveItem(item.rowId))
            }}
          >
            <XIcon className="mr-1 size-3" />
            Limpiar
          </Button>
        ) : null}
      </div>

      {/* Cart items */}
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="space-y-2 px-1 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <ShoppingCartIcon className="size-7 text-muted-foreground/40" />
              <p className="text-xs leading-relaxed text-balance text-muted-foreground">
                Agrega prendas desde el catalogo para iniciar una venta.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.rowId}
                item={item}
                onIncrease={() => onIncreaseQuantity(item.rowId)}
                onDecrease={() => onDecreaseQuantity(item.rowId)}
                onRemove={() => onRemoveItem(item.rowId)}
                onSizeChange={(size) => onSizeChange(item.rowId, size)}
              />
            ))
          )}
        </div>

        {/* Order details section */}
        <div className="space-y-3 px-1 pb-3">
          <Separator className="opacity-50" />

          {/* Customer + Channel row */}
          <div className="space-y-3">
            <CustomerSelector
              customers={customers}
              value={selectedCustomer}
              onChange={onCustomerChange}
              onCustomerCreated={onCustomerCreated}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Canal</Label>
                <Select value={channel} onValueChange={onChannelChange}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">En tienda</SelectItem>
                    <SelectItem value="order">Pedido</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descuento %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  className="h-8 text-xs"
                  value={discountPercent}
                  onChange={(event) =>
                    onDiscountPercentChange(Number(event.target.value || 0))
                  }
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Metodo de pago</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={onPaymentMethodChange}
              className="grid grid-cols-2 gap-1.5"
            >
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-all",
                    paymentMethod === method.value
                      ? "border-brand bg-brand/10 font-medium text-brand"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  <RadioGroupItem value={method.value} className="size-3" />
                  <span>{method.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Cash specific */}
          {paymentMethod === "cash" ? (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Recibido $</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-8 pl-6 text-xs"
                    value={receivedAmount}
                    onChange={(event) =>
                      onReceivedAmountChange(Number(event.target.value || 0))
                    }
                  />
                </div>
              </div>
              {changeGiven > 0 ? (
                <div className="bg-success-soft border-success-soft flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-success text-xs font-medium">
                    Cambio
                  </span>
                  <span className="text-success text-sm font-bold tabular-nums">
                    <CurrencyDisplay amount={changeGiven} size="sm" />
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Credit specific */}
          {paymentMethod === "credit" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Anticipo $</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-8 pl-6 text-xs"
                    value={amountPaid}
                    onChange={(event) =>
                      onAmountPaidChange(Number(event.target.value || 0))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de pago</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-full justify-start text-left text-xs font-normal"
                    >
                      <CalendarIcon className="mr-1.5 size-3.5 shrink-0" />
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
              </div>
            </div>
          ) : null}

          {/* Transfer / Mixed */}
          {paymentMethod === "transfer" || paymentMethod === "mixed" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Monto pagado $</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="h-8 pl-6 text-xs"
                  value={amountPaid}
                  onChange={(event) =>
                    onAmountPaidChange(Number(event.target.value || 0))
                  }
                />
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notas</Label>
            <Textarea
              rows={2}
              placeholder="Notas internas de la venta"
              className="resize-none text-xs"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                <CurrencyDisplay amount={subtotal} size="sm" />
              </span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Descuento ({discountPercent}%)
                </span>
                <span className="text-danger font-medium tabular-nums">
                  -<CurrencyDisplay amount={discountAmount} size="sm" />
                </span>
              </div>
            ) : null}
            <Separator className="my-1 opacity-40" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-brand tabular-nums">
                <CurrencyDisplay amount={total} />
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 bg-card/95 p-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={items.length === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckCircle2Icon className="size-4" />
          )}
          {isSubmitting ? "Registrando..." : "Registrar venta"}
        </Button>
      </div>
    </div>
  )
}

function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onSizeChange,
}: {
  item: PosCartItem
  onIncrease: () => void
  onDecrease: () => void
  onRemove: () => void
  onSizeChange: (size: string) => void
}) {
  return (
    <div className="group space-y-2 rounded-lg border border-border bg-muted/20 p-2.5">
      <div className="flex items-start gap-2">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShirtIcon className="size-4 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Name + price */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-xs leading-tight font-semibold">
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            <CurrencyDisplay amount={item.unitPrice} size="sm" /> &times;{" "}
            {item.quantity}
          </p>
        </div>

        {/* Remove */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
          onClick={onRemove}
          aria-label={`Eliminar ${item.name}`}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {/* Size input */}
        <Input
          placeholder="Talla"
          value={item.size}
          className="h-7 flex-1 text-xs"
          onChange={(event) => onSizeChange(event.target.value)}
        />

        <div className="flex items-center rounded-lg border border-border bg-muted/20">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 rounded-r-none"
            onClick={onDecrease}
            aria-label="Disminuir"
          >
            <MinusIcon className="size-3" />
          </Button>
          <span className="w-7 text-center text-xs font-semibold tabular-nums">
            {item.quantity}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7 rounded-l-none"
            onClick={onIncrease}
            aria-label="Aumentar"
          >
            <PlusIcon className="size-3" />
          </Button>
        </div>

        {/* Row total */}
        <span className="w-14 shrink-0 text-right text-xs font-bold text-brand tabular-nums">
          <CurrencyDisplay amount={item.unitPrice * item.quantity} size="sm" />
        </span>
      </div>
    </div>
  )
}
