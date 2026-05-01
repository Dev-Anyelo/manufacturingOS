"use client"

import * as React from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn, statusConfig } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Textarea } from "@/components/ui/textarea"
import { WorkOrderStatus as WOS } from "@prisma/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  BanknoteIcon,
  CheckCircle2Icon,
  CircleIcon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  ZapIcon,
  ArrowRightIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

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
  const isMobile = useIsMobile()
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

  const content = (
    <>
      <div className="border-b border-border/60 px-5 py-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md bg-primary/10 p-1.5">
            {isCancel ? (
              <XCircleIcon className="h-4 w-4 text-destructive" />
            ) : (
              <ZapIcon className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {isCancel ? "Cancelar pedido" : "Cambiar estado"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isCancel
                ? "Esta acción no se puede deshacer."
                : "Confirma la transición del pedido."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-3 py-3">
        {/* Transición visual compacta */}
        <div className="mb-3 flex items-center justify-center gap-2 overflow-x-auto rounded-lg bg-muted/50 p-3">
          <Badge
            variant="outline"
            className="gap-1.5 text-xs whitespace-nowrap"
          >
            <CircleIcon className="h-2 w-2 fill-current" />
            {fromCfg.label}
          </Badge>
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Badge
            className={cn(
              "gap-1.5 text-xs whitespace-nowrap",
              isCancel
                ? "border-destructive/30 bg-destructive/15 text-destructive"
                : "border-primary/30 bg-primary/15 text-primary"
            )}
          >
            <CircleIcon className="h-2 w-2 fill-current" />
            {toCfg.label}
          </Badge>
        </div>

        {/* Motivo de cancelación */}
        {isCancel && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-pretty">
              Motivo de cancelación <span className="text-destructive">*</span>
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
              <AlertTitle className="text-xs font-semibold text-blue-800 dark:text-blue-200 text-pretty">
                Notificación automática
              </AlertTitle>
            </div>
            <AlertDescription className="text-xs text-blue-700/80 dark:text-blue-300/80 text-pretty">
              Se enviará un correo al cliente cuando el pedido se marque como
              listo para retirar.
            </AlertDescription>
          </Alert>
        )}

        {targetStatus === WOS.delivered && (
          <Alert className="rounded-xl border-violet-200/60 bg-violet-50/60 dark:border-violet-800/40 dark:bg-violet-950/20">
            <div className="flex items-center gap-1.5">
              <BanknoteIcon className="size-4 text-violet-600 dark:text-violet-400" />
              <AlertTitle className="text-xs font-semibold text-violet-800 dark:text-violet-200 text-pretty">
                Venta automática
              </AlertTitle>
            </div>
            <AlertDescription className="text-xs text-violet-700/80 dark:text-violet-300/80 text-pretty">
              Al confirmar la entrega el sistema registrará la venta
              automáticamente.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur-sm sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          disabled={isSubmitting}
          variant={isCancel ? "destructive" : "default"}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
              Guardando…
            </>
          ) : isCancel ? (
            <>
              <XCircleIcon className="mr-1.5 size-3.5" />
              Confirmar cancelación
            </>
          ) : (
            <>
              <CheckCircle2Icon className="mr-1.5 size-3.5" />
              Confirmar cambio
            </>
          )}
        </Button>
      </div>
    </>
  )

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogTitle className="sr-only">Cambiar estado</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="gap-0 overflow-hidden p-0">
        <DrawerTitle className="sr-only">Cambiar estado</DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
