"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { PayrollTableRow } from "@/components/modules/payroll/payroll-table"

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
          payment_date: new Date(`${paymentDate}T00:00:00`),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar pago como pagado</DialogTitle>
          <DialogDescription>
            Confirma la fecha y metodo para procesar este pago de planilla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            <p className="font-medium">{payment?.employeeName}</p>
            <p className="text-muted-foreground">
              Periodo:{" "}
              {payment
                ? `${new Date(payment.periodStart).toLocaleDateString("es-PA")} - ${new Date(payment.periodEnd).toLocaleDateString("es-PA")}`
                : "-"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date" className="text-sm font-medium">
              Fecha de pago
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Metodo de pago</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "cash" | "transfer" | "other")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona metodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <Textarea
              id="notes"
              className="min-h-20"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
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
