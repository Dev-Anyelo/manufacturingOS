"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { PayrollTableRow } from "@/components/modules/payroll/payroll-table"

import {
  BanknoteIcon,
  CalendarIcon,
  CreditCardIcon,
  Loader2Icon,
  MoreHorizontalIcon,
} from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MarkPaidDialogProps {
  open: boolean
  payment: PayrollTableRow | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function todayInputDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

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

const paymentMethods = [
  { value: "cash", label: "Efectivo", icon: BanknoteIcon },
  { value: "transfer", label: "Transferencia", icon: CreditCardIcon },
  { value: "other", label: "Otro", icon: MoreHorizontalIcon },
] as const

export function MarkPaidDialog({
  open,
  payment,
  onOpenChange,
  onSuccess,
}: MarkPaidDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [paymentDate, setPaymentDate] = React.useState(todayInputDate())
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "transfer" | "other"
  >("cash")
  const [notes, setNotes] = React.useState("")
  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  React.useEffect(() => {
    if (!open) {
      return
    }

    setPaymentDate(todayInputDate())
    setPaymentMethod("cash")
    setNotes("")
  }, [open])

  async function handleSubmit() {
    if (!payment) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/payroll/${payment.id}/mark-paid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_date: parseInputDate(paymentDate),
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo marcar como pagado.")
      }

      toast.success("Pago marcado como pagado.")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo marcar como pagado."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-border/75 p-0 sm:max-w-xl">
        <DialogHeader className="space-y-2 py-3 px-4">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Marcar pago como pagado</DialogTitle>
          </div>
          <DialogDescription>
            Confirma la fecha y metodo para procesar este pago de planilla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatLine label="Empleado" value={payment?.employeeName ?? "-"} />
            <StatLine
              label="Periodo"
              value={
                payment
                  ? `${new Date(payment.periodStart).toLocaleDateString("es-PA")} - ${new Date(payment.periodEnd).toLocaleDateString("es-PA")}`
                  : "-"
              }
            />
            <StatLine
              label="Total"
              value={
                <span className="text-brand">
                  <CurrencyDisplay amount={payment?.total ?? 0} size="sm" />
                </span>
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha de pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {formatDateLabel(paymentDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  mode="single"
                  selected={
                    paymentDate ? parseInputDate(paymentDate) : undefined
                  }
                  onSelect={(date) => {
                    if (!date) {
                      return
                    }

                    setPaymentDate(toInputDate(date))
                  }}
                  disabled={(date) => date > today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Metodo de pago</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "cash" | "transfer" | "other")
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {paymentMethods.map((method) => {
                const Icon = method.icon

                return (
                  <Label
                    key={method.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-xs transition-colors",
                      paymentMethod === method.value
                        ? "bg-brand-muted border-brand font-medium text-brand"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <RadioGroupItem value={method.value} className="sr-only" />
                    <Icon className="size-4" />
                    <span className="text-sm">{method.label}</span>
                  </Label>
                )
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <Textarea
              id="notes"
              className="min-h-20"
              placeholder="Observaciones internas del pago (opcional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t border-border/70 bg-muted/10 px-5 py-4 sm:flex sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-brand text-brand-foreground"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/85 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
