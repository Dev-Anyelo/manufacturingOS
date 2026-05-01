"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
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
  const isMobile = useIsMobile()
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

  const periodStr = payment
    ? `${new Date(payment.periodStart).toLocaleDateString("es-PA")} - ${new Date(payment.periodEnd).toLocaleDateString("es-PA")}`
    : "-"

  const content = (
    <>
      <div className="shrink-0 space-y-1 border-b border-border/70 bg-card px-4 py-4 text-left">
        <h2 className="text-base font-semibold text-pretty">
          Marcar pago como pagado
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Confirma la fecha y metodo para procesar este pago.
        </p>
      </div>

      <div className="flex flex-1 flex-col space-y-4 overflow-y-auto px-4 py-4">
        <dl className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 border-b pb-4 text-sm sm:flex-nowrap">
          <div className="flex flex-col items-center gap-1.5 pr-3 sm:border-r">
            <dt className="text-xs text-muted-foreground">Empleado:</dt>
            <dd className="text-center text-xs font-semibold">
              {payment?.employeeName ?? "-"}
            </dd>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:border-r sm:px-3">
            <dt className="text-xs text-muted-foreground">Periodo:</dt>
            <dd className="text-center text-xs font-medium tabular-nums">
              {periodStr}
            </dd>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:pl-3">
            <dt className="text-xs text-muted-foreground">Total:</dt>
            <dd className="text-xs font-bold text-brand tabular-nums">
              <CurrencyDisplay amount={payment?.total ?? 0} size="sm" />
            </dd>
          </div>
        </dl>

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
                selected={paymentDate ? parseInputDate(paymentDate) : undefined}
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
            className="min-h-[60px]"
            rows={2}
            placeholder="Observaciones internas del pago (opcional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border/70 bg-background p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : null}
          Confirmar
        </Button>
      </div>
    </>
  )

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Marcar pago como pagado</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="gap-0 overflow-hidden p-0">
        <DrawerTitle className="sr-only">Marcar pago como pagado</DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
