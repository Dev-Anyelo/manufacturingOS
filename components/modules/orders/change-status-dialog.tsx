"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { WorkOrderStatus } from "@prisma/client"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/shared/status-badge"
import { ArrowRightIcon, InfoIcon, Loader2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChangeStatusDialogProps {
  orderId: string
  currentStatus: WorkOrderStatus
  targetStatus: WorkOrderStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ChangeStatusDialog({
  orderId,
  currentStatus,
  targetStatus,
  open,
  onOpenChange,
  onSuccess,
}: ChangeStatusDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [cancelledReason, setCancelledReason] = React.useState("")

  React.useEffect(() => {
    if (!open) {
      setCancelledReason("")
    }
  }, [open])

  async function handleConfirm() {
    if (targetStatus === WorkOrderStatus.cancelled && !cancelledReason.trim()) {
      toast.error("Debes indicar el motivo de cancelacion.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: targetStatus,
          cancelled_reason:
            targetStatus === WorkOrderStatus.cancelled
              ? cancelledReason.trim()
              : null,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo actualizar el estado.")
      }

      toast.success("Estado del pedido actualizado.")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar estado del pedido</DialogTitle>
          <DialogDescription>
            Confirma la transicion para continuar con el flujo del pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={currentStatus} type="work-order" />
            <ArrowRightIcon className="size-4 text-muted-foreground" />
            <StatusBadge status={targetStatus} type="work-order" />
          </div>
        </div>

        {targetStatus === WorkOrderStatus.cancelled ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo de cancelacion</label>
            <Textarea
              value={cancelledReason}
              onChange={(event) => setCancelledReason(event.target.value)}
              placeholder="Explica por que se cancela este pedido..."
              className="min-h-24"
            />
          </div>
        ) : null}

        {targetStatus === WorkOrderStatus.ready ? (
          <Alert>
            <InfoIcon className="size-4" />
            <AlertTitle>Notificacion automatica</AlertTitle>
            <AlertDescription>
              Se enviara un correo al cliente cuando el pedido se marque como
              listo.
            </AlertDescription>
          </Alert>
        ) : null}

        {targetStatus === WorkOrderStatus.delivered ? (
          <Alert>
            <InfoIcon className="size-4" />
            <AlertTitle>Venta automatica</AlertTitle>
            <AlertDescription>
              Al entregar el pedido, el sistema creara una venta
              automaticamente.
            </AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
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
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Confirmar cambio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
