"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import {
  AlertTriangleIcon,
  CircleHelpIcon,
  Loader2Icon,
  ShieldAlertIcon,
} from "lucide-react"

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
  /** If provided, user must type this text to enable the confirm button */
  confirmationText?: string
  /** List of consequences to show in a destructive section */
  consequences?: string[]
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
  confirmationText,
  consequences,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = React.useState(false)
  const [typedText, setTypedText] = React.useState("")
  const Icon = variantConfig[variant].icon

  React.useEffect(() => {
    if (!open) {
      setInternalLoading(false)
      setTypedText("")
    }
  }, [open])

  const pending = isLoading || internalLoading
  const confirmEnabled = confirmationText
    ? typedText === confirmationText
    : true

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
      <AlertDialogContent className="rounded-2xl border border-border/80 p-0 sm:max-w-2xl">
        <AlertDialogHeader className="space-y-3 border-b border-border/80 bg-muted/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex size-10 items-center justify-center rounded-lg border ${variantConfig[variant].iconClassName}`}
            >
              <Icon className="size-4.5" />
            </div>
            <div className="space-y-1">
              <p className="label-overline">{variantConfig[variant].title}</p>
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="leading-relaxed text-pretty">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
          {/* Consequences section for danger variant */}
          {variant === "danger" && consequences && consequences.length > 0 && (
            <div className="danger-consequences">
              <p className="mb-1.5 text-sm font-medium text-foreground">
                Consecuencias de esta accion:
              </p>
              <ul className="space-y-1">
                {consequences.map((item, i) => (
                  <li
                    key={i}
                    className="text-danger flex items-start gap-2 text-sm"
                  >
                    <span className="bg-danger mt-1.5 size-1 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Standard danger alert */}
          {variant === "danger" && !consequences ? (
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
            <p className="rounded-lg border border-border/80 bg-muted/20 p-3 text-sm leading-relaxed text-pretty text-foreground">
              Esta accion es permanente. ¿Seguro que deseas continuar con
              <span className="ml-1 font-semibold">{highlightedText}</span>?
            </p>
          ) : null}

          {/* Confirmation text input */}
          {confirmationText ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Escribe{" "}
                <span className="font-mono font-semibold text-foreground">
                  {confirmationText}
                </span>{" "}
                para confirmar:
              </p>
              <Input
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={confirmationText}
                className="font-mono"
                autoFocus
              />
            </div>
          ) : null}
        </div>

        <AlertDialogFooter className="border-t border-border/80 bg-muted/20 p-4 sm:justify-end sm:px-6 sm:py-4">
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
            disabled={pending || !confirmEnabled}
            className="min-w-28"
          >
            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "default"}
              className="w-full"
              disabled={pending || !confirmEnabled}
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
