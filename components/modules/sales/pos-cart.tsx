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
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomerSelector } from "./customer-selector"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
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
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-1 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Carrito</span>
          {items.length > 0 ? (
            <Badge className="min-w-5 h-5 justify-center rounded-full bg-brand px-1.5 text-[10px] text-brand-foreground">
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
            <XIcon className="size-3 mr-1" />
            Limpiar
          </Button>
        ) : null}
      </div>

      {/* Cart items */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-1 py-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/15 p-8 text-center">
              <ShoppingCartIcon className="size-7 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground leading-relaxed">
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
        <div className="px-1 pb-3 space-y-3">
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
                  <SelectTrigger className="h-8 text-xs">
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
                      ? "bg-brand-muted border-brand text-foreground font-medium"
                      : "border-border/60 bg-background hover:bg-muted/40 text-muted-foreground"
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
                    className="pl-6 h-8 text-xs"
                    value={receivedAmount}
                    onChange={(event) =>
                      onReceivedAmountChange(Number(event.target.value || 0))
                    }
                  />
                </div>
              </div>
              {changeGiven > 0 ? (
                <div className="flex items-center justify-between rounded-lg bg-success-soft border border-success-soft px-3 py-2">
                  <span className="text-xs text-success font-medium">
                    Cambio
                  </span>
                  <span className="text-sm font-bold text-success tabular-nums">
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
                    className="pl-6 h-8 text-xs"
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
                      className="w-full h-8 justify-start text-left text-xs font-normal"
                    >
                      <CalendarIcon className="size-3.5 mr-1.5 shrink-0" />
                      <span className="truncate">{formatDateLabel(dueDate)}</span>
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
                  className="pl-6 h-8 text-xs"
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
              className="text-xs resize-none"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-medium">
                <CurrencyDisplay amount={subtotal} size="sm" />
              </span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Descuento ({discountPercent}%)
                </span>
                <span className="tabular-nums text-danger font-medium">
                  -<CurrencyDisplay amount={discountAmount} size="sm" />
                </span>
              </div>
            ) : null}
            <Separator className="opacity-40 my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-brand tabular-nums">
                <CurrencyDisplay amount={total} />
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Submit footer */}
      <div className="border-t border-border/50 p-3">
        <Button
          type="button"
          className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-sm gap-2"
          onClick={onSubmit}
          disabled={items.length === 0 || isSubmitting}
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
    <div className="rounded-lg border border-border/50 bg-card p-2.5 space-y-2 group">
      <div className="flex items-start gap-2">
        {/* Thumbnail */}
        <div className="relative size-10 shrink-0 rounded-md overflow-hidden border border-border/60 bg-muted">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShirtIcon className="size-4 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight line-clamp-1">
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            <CurrencyDisplay amount={item.unitPrice} size="sm" />
            {" "}&times;{" "}{item.quantity}
          </p>
        </div>

        {/* Remove */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
          className="h-7 text-xs flex-1"
          onChange={(event) => onSizeChange(event.target.value)}
        />

        {/* Quantity stepper */}
        <div className="flex items-center rounded-lg border border-border/60 bg-background">
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
        <span className="text-xs font-bold tabular-nums text-brand w-14 text-right shrink-0">
          <CurrencyDisplay amount={item.unitPrice * item.quantity} size="sm" />
        </span>
      </div>
    </div>
  )
}
