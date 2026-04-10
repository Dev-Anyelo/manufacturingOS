"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-0 rounded-xl border border-border/60 p-0 sm:max-w-md">
        <AlertDialogHeader className="space-y-1.5 p-4 pb-3">
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 px-4">
          {variant === "danger" && (
            <Alert
              variant="destructive"
              className="border-destructive/50 bg-destructive/10"
            >
              <AlertTriangleIcon className="size-4" />
              <AlertTitle className="font-semibold">
                {warningText ?? "Esta accion es irreversible"}
              </AlertTitle>
              <AlertDescription className="text-pretty text-xs">
                Esto eliminara el recurso y todos los datos asociados.
              </AlertDescription>
            </Alert>
          )}

          <p className="text-pretty text-sm text-muted-foreground">
            {description}
            {highlightedText && (
              <>
                {" "}
                <span className="font-semibold text-foreground">
                  {highlightedText}
                </span>
                ?
              </>
            )}
          </p>
        </div>

        <AlertDialogFooter className="flex-col-reverse gap-2 p-4 sm:flex-row">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "default"}
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => void handleConfirm()}
            >
              {pending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
