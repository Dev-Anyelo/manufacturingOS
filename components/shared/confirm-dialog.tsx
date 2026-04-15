"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  AlertTriangleIcon,
  CircleHelpIcon,
  Loader2Icon,
  ShieldAlertIcon,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
  warningText?: string
  highlightedText?: string
}

const variantConfig = {
  default: {
    icon: CircleHelpIcon,
    iconClassName: "text-brand bg-brand-muted border-brand/30",
    title: "Confirma esta accion",
  },
  warning: {
    icon: AlertTriangleIcon,
    iconClassName: "text-warning bg-warning-soft border-warning-soft",
    title: "Revisa antes de continuar",
  },
  danger: {
    icon: ShieldAlertIcon,
    iconClassName: "text-danger bg-danger-soft border-danger-soft",
    title: "Accion irreversible",
  },
} as const

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  isLoading = false,
  warningText,
  highlightedText,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const Icon = variantConfig[variant].icon

  React.useEffect(() => {
    if (!open) {
      setInternalLoading(false)
    }
  }, [open])

  const pending = isLoading || internalLoading

  async function handleConfirm() {
    try {
      setInternalLoading(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl border border-border/60 p-0 sm:max-w-136">
        <AlertDialogHeader className="space-y-3 border-b border-border/60 p-4">
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex size-8 items-center justify-center rounded-lg border ${variantConfig[variant].iconClassName}`}
            >
              <Icon className="size-4" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {variantConfig[variant].title}
              </p>
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-pretty">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 px-4 py-3">
          {variant === "danger" ? (
            <Alert variant="destructive" className="rounded-lg border">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="text-danger mt-0.5 size-4" />
                <div>
                  <AlertTitle className="text-foreground">
                    {warningText ?? "Eliminar recurso es irreversible"}
                  </AlertTitle>
                  <AlertDescription className="text-pretty">
                    Esto eliminara el recurso y todos los datos asociados.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ) : null}

          {highlightedText ? (
            <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-pretty text-foreground">
              Esta accion es permanente. ¿Seguro que deseas continuar con
              <span className="ml-1 font-semibold">{highlightedText}</span>?
            </p>
          ) : null}
        </div>

        <AlertDialogFooter className="border-t border-border/60 bg-muted/10 p-4 sm:justify-end">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="min-w-28"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            onClick={() => void handleConfirm()}
            disabled={pending}
            className="min-w-28"
          >
            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "default"}
              className="w-full"
              disabled={pending}
            >
              {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
