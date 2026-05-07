"use client"

import * as React from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { cn, statusConfig } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Textarea } from "@/components/ui/textarea"
import { WorkOrderStatus as WOS } from "@prisma/client"

import {
  BanknoteIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  ZapIcon,
  TriangleAlertIcon,
  ChevronDownIcon,
  XIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { useRouter } from "next/navigation"

const REASON_MAX = 240

export interface ChangeStatusDialogProps {
  orderId: string
  currentStatus: WOS
  targetStatus: WOS
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  /** Endpoint a invocar. Por defecto: /api/orders/{orderId}/status */
  endpoint?: string
  /** Permite reemplazar la lógica de envío para testing/demos */
  submitFn?: (payload: {
    status: WOS
    cancelled_reason: string | null
  }) => Promise<void>
}

interface TimelineNodeProps {
  status: WOS
  caption: string
  variant: "from" | "to"
  isCancel?: boolean
}

function TimelineNode({
  status,
  caption,
  variant,
  isCancel,
}: TimelineNodeProps) {
  const cfg = statusConfig[status]
  const Icon = cfg.icon
  const isFrom = variant === "from"

  return (
    <div className="relative flex items-start gap-3">
      {/* Nodo (icono circular) */}
      <div className="relative z-10 flex flex-col items-center">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all",
            isFrom
              ? "border-border bg-muted text-muted-foreground"
              : isCancel
                ? "border-rose-500/40 bg-rose-500 text-white"
                : "border-primary/30 bg-primary text-primary-foreground"
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      {/* Etiqueta */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 pt-1 pb-1">
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10px] font-semibold tracking-wider uppercase",
              isFrom ? "text-muted-foreground" : "text-foreground/70"
            )}
          >
            {caption}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate text-sm leading-tight font-semibold",
              isFrom ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {cfg.label}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {cfg.description}
          </p>
        </div>

        {/* Badge de estado a la derecha */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            cfg.badge,
            isFrom && "opacity-70"
          )}
        >
          <span className={cn("size-1.5 rounded-full", cfg.dot)} aria-hidden />
          {cfg.label}
        </span>
      </div>
    </div>
  )
}

function TimelineConnector({ isCancel }: { isCancel?: boolean }) {
  return (
    <div className="relative ml-4.5 flex h-7 items-center" aria-hidden>
      {/* Línea vertical punteada */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed",
          isCancel
            ? "border-rose-400/50 dark:border-rose-500/40"
            : "border-border"
        )}
      />
      {/* Chevron flotante centrado */}
      <span
        className={cn(
          "ml-3 inline-flex size-5 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm",
          isCancel && "border-rose-300/60 text-rose-500 dark:border-rose-700/60"
        )}
      >
        <ChevronDownIcon className="size-3" />
      </span>
    </div>
  )
}

function ContextualAlert({
  tone,
  icon: Icon,
  title,
  description,
}: {
  tone: "info" | "success" | "warning"
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  const tones = {
    info: "border-sky-200/70 bg-sky-50/70 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100",
    success:
      "border-violet-200/70 bg-violet-50/70 text-violet-900 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-100",
    warning:
      "border-amber-200/70 bg-amber-50/70 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
  }
  const iconTones = {
    info: "text-sky-600 dark:text-sky-400",
    success: "text-violet-600 dark:text-violet-400",
    warning: "text-amber-600 dark:text-amber-400",
  }
  return (
    <div className={cn("flex gap-2.5 rounded-lg border p-3", tones[tone])}>
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", iconTones[tone])}
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs leading-tight font-semibold">{title}</p>
        <p className="text-xs leading-relaxed opacity-90 text-pretty">{description}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

export function ChangeStatusDialog({
  orderId,
  currentStatus,
  targetStatus,
  open,
  onOpenChange,
  onSuccess,
  endpoint,
  submitFn,
}: ChangeStatusDialogProps) {
  const isMobile = useIsMobile()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [cancelledReason, setCancelledReason] = React.useState("")
  const [reasonError, setReasonError] = React.useState<string | null>(null)
  const reasonInputRef = React.useRef<HTMLTextAreaElement>(null)

  const isCancel = targetStatus === "cancelled"
  const fromCfg = statusConfig[currentStatus]
  const toCfg = statusConfig[targetStatus]
  const HeaderIcon = isCancel ? TriangleAlertIcon : ZapIcon
  const router = useRouter()

  // reset on close
  React.useEffect(() => {
    if (!open) {
      setCancelledReason("")
      setReasonError(null)
      setIsSubmitting(false)
    }
  }, [open])

  // autofocus motivo si es cancelación
  React.useEffect(() => {
    if (open && isCancel) {
      const t = setTimeout(() => reasonInputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, isCancel])

  async function defaultSubmit(payload: {
    status: WOS
    cancelled_reason: string | null
  }) {
    const url = endpoint ?? `/api/orders/${orderId}/status`
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean
      error?: string
    }
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "No se pudo actualizar el estado.")
    }
  }

  async function handleConfirm() {
    if (isCancel) {
      const trimmed = cancelledReason.trim()
      if (!trimmed) {
        setReasonError("Debes indicar el motivo de cancelación.")
        reasonInputRef.current?.focus()
        return
      }
      if (trimmed.length > REASON_MAX) {
        setReasonError(`El motivo no puede superar ${REASON_MAX} caracteres.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload = {
        status: targetStatus,
        cancelled_reason: isCancel ? cancelledReason.trim() : null,
      }
      if (submitFn) {
        await submitFn(payload)
      } else {
        await defaultSubmit(payload)
      }
      try {
        await revalidatePaths(["/orders", `/orders/${orderId}`, "/"])
      } catch (e) {
        // non-fatal: log and continue
        // eslint-disable-next-line no-console
        console.error("revalidatePaths failed", e)
      }
      toast.success("Estado del pedido actualizado.", {
        description: `${fromCfg.label} → ${toCfg.label}`,
      })
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

  /* ---------------------------------- UI ---------------------------------- */

  const header = (
    <div className="flex items-start gap-3 px-5 pt-5 pb-3 sm:px-6">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          isCancel
            ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
            : "bg-primary/10 text-primary"
        )}
      >
        <HeaderIcon className="size-4.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[15px] leading-tight font-semibold tracking-tight">
            {isCancel ? "Cancelar pedido" : "Cambiar estado"}
          </h2>
          <span
            className="hidden shrink-0 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase sm:inline-block"
            title={`ID del pedido: ${orderId}`}
          >
            #{orderId.slice(0, 6)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {isCancel
            ? "Esta acción es definitiva y no se puede deshacer."
            : "Confirma la transición de estado del pedido."}
        </p>
      </div>
      {/* Botón cerrar custom (sólo en Dialog; el Drawer ya tiene gesto) */}
      {!isMobile && (
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          )}
          aria-label="Cerrar"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  )

  const transitionBlock = (
    <section
      aria-label="Transición de estado"
      className={cn(
        "rounded-xl border bg-muted/30 p-3 dark:bg-muted/10",
        isCancel
          ? "border-rose-200/60 dark:border-rose-900/40"
          : "border-border/60"
      )}
    >
      <TimelineNode
        status={currentStatus}
        caption="Estado actual"
        variant="from"
        isCancel={isCancel}
      />
      <TimelineConnector isCancel={isCancel} />
      <TimelineNode
        status={targetStatus}
        caption="Nuevo estado"
        variant="to"
        isCancel={isCancel}
      />
    </section>
  )

  const body = (
    <div className="space-y-3 px-5 pb-2 sm:px-6">
      {transitionBlock}

      {/* Motivo de cancelación */}
      {isCancel && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="cancel-reason" className="text-xs font-semibold">
              Motivo de cancelación <span className="text-destructive">*</span>
            </Label>
            <span
              className={cn(
                "text-[11px] tabular-nums",
                cancelledReason.length > REASON_MAX
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {cancelledReason.length}/{REASON_MAX}
            </span>
          </div>
          <Textarea
            id="cancel-reason"
            ref={reasonInputRef}
            value={cancelledReason}
            onChange={(e) => {
              setCancelledReason(e.target.value)
              if (reasonError) setReasonError(null)
            }}
            placeholder="Describe brevemente por qué se cancela el pedido…"
            maxLength={REASON_MAX + 40}
            aria-invalid={!!reasonError}
            className={cn(
              "min-h-20 resize-none text-sm",
              reasonError &&
                "border-destructive focus-visible:ring-destructive/30"
            )}
          />
          {reasonError ? (
            <p className="text-[11px] text-destructive">{reasonError}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Esta nota quedará registrada en el historial del pedido.
            </p>
          )}
        </div>
      )}

      {/* Alertas contextuales */}
      {targetStatus === "ready" && (
        <ContextualAlert
          tone="info"
          icon={InfoIcon}
          title="Notificación automática"
          description="Se enviará un correo al cliente cuando el pedido se marque como listo para retirar."
        />
      )}

      {targetStatus === "delivered" && (
        <ContextualAlert
          tone="success"
          icon={BanknoteIcon}
          title="Venta automática"
          description="Al confirmar la entrega, el sistema registrará la venta automáticamente."
        />
      )}

      {isCancel && (
        <ContextualAlert
          tone="warning"
          icon={TriangleAlertIcon}
          title="Acción irreversible"
          description="Una vez cancelado, no podrás revertir el estado del pedido desde aquí."
        />
      )}
    </div>
  )

  const footer = (
    <div
      className={cn(
        "sticky bottom-0 mt-2 grid grid-cols-2 gap-2 border-t border-border/60 bg-background/95 px-5 py-3 backdrop-blur",
        "sm:flex-row sm:items-center sm:justify-end sm:px-6"
      )}
    >
      <Button
        type="button"
        variant="outline"
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
        className="min-w-40"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Guardando…
          </>
        ) : isCancel ? (
          <>
            <XCircleIcon className="size-4" />
            Confirmar
          </>
        ) : (
          <>
            <CheckCircle2Icon className="size-4" />
            Confirmar cambio
          </>
        )}
      </Button>
    </div>
  )

  /* ----------------------------- Render shells ---------------------------- */

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "flex max-h-[min(640px,90vh)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0",
            "sm:w-full sm:max-w-110"
          )}
        >
          <DialogTitle className="sr-only">
            {isCancel ? "Cancelar pedido" : "Cambiar estado"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {`Transición de ${fromCfg.label} a ${toCfg.label}`}
          </DialogDescription>

          {header}
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">{body}</div>
          {footer}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[92vh] flex-col gap-0 p-0">
        <DrawerTitle className="sr-only">
          {isCancel ? "Cancelar pedido" : "Cambiar estado"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {`Transición de ${fromCfg.label} a ${toCfg.label}`}
        </DrawerDescription>

        {header}
        <div className="min-h-0 flex-1 overflow-y-auto pb-3">{body}</div>
        {footer}
      </DrawerContent>
    </Drawer>
  )
}
