"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CustomerSelector } from "./customer-selector"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PosCartItem, PosCustomer } from "@/components/modules/sales/types"

import {
  CalendarIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
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
  if (!value) {
    return "Fecha de pago"
  }

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
    <Card className="border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-base">Carrito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
              Agrega prendas desde el catalogo para iniciar una venta.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.rowId}
                className="space-y-2 rounded-lg border border-border/60 bg-muted/15 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <CurrencyDisplay amount={item.unitPrice} size="sm" /> x{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveItem(item.rowId)}
                    aria-label={`Eliminar ${item.name} del carrito`}
                  >
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Talla"
                    value={item.size}
                    onChange={(event) =>
                      onSizeChange(item.rowId, event.target.value)
                    }
                  />
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-2">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onDecreaseQuantity(item.rowId)}
                      aria-label={`Disminuir cantidad de ${item.name}`}
                    >
                      <MinusIcon className="size-4" />
                    </Button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onIncreaseQuantity(item.rowId)}
                      aria-label={`Aumentar cantidad de ${item.name}`}
                    >
                      <PlusIcon className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <CurrencyDisplay amount={item.unitPrice * item.quantity} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
          <CustomerSelector
            customers={customers}
            value={selectedCustomer}
            onChange={onCustomerChange}
            onCustomerCreated={onCustomerCreated}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={onChannelChange}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Descuento %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={discountPercent}
                onChange={(event) =>
                  onDiscountPercentChange(Number(event.target.value || 0))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Metodo de pago</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={onPaymentMethodChange}
              className="grid grid-cols-2 gap-2"
            >
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors",
                    paymentMethod === method.value
                      ? "bg-brand-muted border-brand"
                      : "bg-background hover:bg-muted/40"
                  )}
                >
                  <RadioGroupItem value={method.value} />
                  <span>{method.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {paymentMethod === "cash" ? (
            <div className="space-y-2">
              <Label>Recibido $</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={receivedAmount}
                onChange={(event) =>
                  onReceivedAmountChange(Number(event.target.value || 0))
                }
              />
              <p className="text-xs text-muted-foreground">
                Cambio: <CurrencyDisplay amount={changeGiven} size="sm" />
              </p>
            </div>
          ) : null}

          {paymentMethod === "credit" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Anticipo $</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountPaid}
                  onChange={(event) =>
                    onAmountPaidChange(Number(event.target.value || 0))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de pago</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {formatDateLabel(dueDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate ? parseInputDate(dueDate) : undefined}
                      onSelect={(date) => {
                        if (!date) {
                          return
                        }

                        onDueDateChange(toInputDate(date))
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : null}

          {paymentMethod === "transfer" || paymentMethod === "mixed" ? (
            <div className="space-y-2">
              <Label>Monto pagado $</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={amountPaid}
                onChange={(event) =>
                  onAmountPaidChange(Number(event.target.value || 0))
                }
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              rows={3}
              placeholder="Notas internas de la venta"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1 rounded-lg border border-border/60 bg-background p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <CurrencyDisplay amount={subtotal} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Descuento</span>
            <CurrencyDisplay amount={discountAmount} />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-base font-semibold">
            <span>Total</span>
            <CurrencyDisplay amount={total} />
          </div>
        </div>

        <Button
          type="button"
          className="w-full bg-brand text-brand-foreground"
          onClick={onSubmit}
          disabled={items.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar venta"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
