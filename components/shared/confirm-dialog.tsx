"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl border border-border/60 p-0 sm:max-w-136">
        <DialogHeader className="border-b border-border/60 p-3">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-pretty">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 px-3">
          {variant === "danger" ? (
            <Alert variant="destructive" className="rounded-none border-x-0">
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
            <p className="text-sm text-pretty text-foreground">
              Esta accion es permanente. ¿Seguro que deseas continuar con
              <span className="ml-1 font-semibold">{highlightedText}</span>?
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/60 p-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="min-w-28"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={pending}
            variant={variant === "danger" ? "destructive" : "default"}
            className="min-w-28"
          >
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
