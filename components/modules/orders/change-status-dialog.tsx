"use client"

import * as React from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { cn, statusConfig } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { WorkOrderStatus as WOS } from "@prisma/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  BanknoteIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react"

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
  currentStatus: WOS
  targetStatus: WOS
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
    if (!open) setCancelledReason("")
  }, [open])

  const isCancel = targetStatus === WOS.cancelled
  const fromCfg = statusConfig[currentStatus]
  const toCfg = statusConfig[targetStatus]

  async function handleConfirm() {
    if (isCancel && !cancelledReason.trim()) {
      toast.error("Debes indicar el motivo de cancelación.")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          cancelled_reason: isCancel ? cancelledReason.trim() : null,
        }),
      })
      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }
      if (!response.ok || !payload.success)
        throw new Error(payload.error ?? "No se pudo actualizar el estado.")
      toast.success("Estado del pedido actualizado.")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header */}
        <div
          className={cn(
            "border-b border-border/60 px-5 py-4",
            isCancel && "border-destructive/20 bg-destructive/5"
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-bold text-pretty">
              {isCancel ? (
                <XCircleIcon className="size-4 text-destructive" />
              ) : (
                <ZapIcon className="size-4 text-brand" />
              )}
              {isCancel ? "Cancelar pedido" : "Cambiar estado del pedido"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-pretty text-muted-foreground">
              {isCancel
                ? "Esta acción no se puede deshacer. El pedido quedará como cancelado."
                : "Confirma la transición para continuar con el flujo del pedido."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-4">
          {/* Transición visual */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3">
            {/* Estado actual */}
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl border text-base opacity-70",
                  fromCfg.badge
                )}
              >
                {fromCfg.icon}
              </span>
              <span className="mx-auto max-w-xs text-center text-xs leading-tight font-medium text-pretty text-muted-foreground">
                {fromCfg.label}
              </span>
            </div>

            {/* Flecha animada */}
            <div className="flex flex-1 items-center justify-center gap-1 px-3">
              {[0, 1, 2, 3].map((i) => (
                <ChevronRightIcon
                  key={i}
                  className={cn(
                    "size-4 transition-opacity",
                    isCancel ? "text-destructive" : "text-brand",
                    i === 0 && "opacity-30",
                    i === 1 && "opacity-60",
                    i === 2 && "opacity-80",
                    i === 3 && "opacity-100"
                  )}
                />
              ))}
            </div>

            {/* Estado destino */}
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-xl border ring-4",
                  isCancel ? "ring-destructive/20" : "ring-brand/20",
                  toCfg.badge
                )}
              >
                {toCfg.icon}
              </span>
              <span className="mx-auto max-w-xs text-center text-xs leading-tight font-bold text-pretty text-foreground">
                {toCfg.label}
              </span>
            </div>
          </div>

          {/* Motivo de cancelación */}
          {isCancel && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Motivo de cancelación{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={cancelledReason}
                onChange={(e) => setCancelledReason(e.target.value)}
                placeholder="Describe el motivo de la cancelación…"
                className="min-h-22.5 resize-none text-sm focus-visible:ring-destructive/30"
              />
            </div>
          )}

          {/* Alertas contextuales */}
          {targetStatus === WOS.ready && (
            <Alert className="rounded-xl border-blue-200/60 bg-blue-50/60 dark:border-blue-800/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-1.5">
                <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                  Notificación automática
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-blue-700/80 dark:text-blue-300/80">
                Se enviará un correo al cliente cuando el pedido se marque como
                listo para retirar.
              </AlertDescription>
            </Alert>
          )}

          {targetStatus === WOS.delivered && (
            <Alert className="rounded-xl border-violet-200/60 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/20">
              <div className="flex items-center gap-1.5">
                <BanknoteIcon className="size-4 text-violet-600 dark:text-violet-400" />
                <AlertTitle className="text-xs font-semibold text-violet-800 dark:text-violet-200">
                  Venta automática
                </AlertTitle>
              </div>
              <AlertDescription className="text-xs text-violet-700/80 dark:text-violet-300/80">
                Al confirmar la entrega el sistema registrará la venta
                automáticamente.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="grid grid-cols-2 gap-2 border-t border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur-sm">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant={isCancel ? "destructive" : "default"}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Guardando…
              </>
            ) : isCancel ? (
              <>
                <XCircleIcon className="size-4" />
                Confirmar cancelación
              </>
            ) : (
              <>
                <CheckCircle2Icon className="size-4" />
                Confirmar cambio
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
