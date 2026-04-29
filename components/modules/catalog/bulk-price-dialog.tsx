"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BulkPriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BulkPriceDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkPriceDialogProps) {
  const [percentage, setPercentage] = React.useState<number>(0)
  const [target, setTarget] = React.useState<
    "our_price_unit" | "our_price_dozen" | "all"
  >("all")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const multiplier = React.useMemo(() => 1 + percentage / 100, [percentage])
  const targetLabel =
    target === "all"
      ? "Todos los precios"
      : target === "our_price_unit"
        ? "Precio unitario"
        : "Precio por docena"

  React.useEffect(() => {
    if (open) {
      setPercentage(0)
      setTarget("all")
    }
  }, [open])

  async function handleSubmit() {
    if (percentage === 0) {
      toast.error("El porcentaje no puede ser 0.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/catalog/bulk-price", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          percentage,
          target,
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
        data?: { updated_count: number }
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo aplicar el ajuste masivo.")
      }

      toast.success(
        `Ajuste aplicado a ${result.data?.updated_count ?? 0} productos.`
      )
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo aplicar el ajuste masivo."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-border/75 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/70 bg-muted/10 px-4 py-4">
          <DialogTitle className="text-base text-pretty">
            Ajuste masivo de precios
          </DialogTitle>

          <DialogDescription className="text-sm text-pretty">
            Incrementa o reduce precios en bloque segun el porcentaje indicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <SummaryCell label="Objetivo" value={targetLabel} />
            <SummaryCell
              label="Multiplicador"
              value={
                <span className="text-brand">x{multiplier.toFixed(3)}</span>
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentage" className="text-sm font-medium">
              Porcentaje
            </Label>
            <Input
              id="percentage"
              type="number"
              step="0.1"
              value={percentage}
              onChange={(event) => setPercentage(Number(event.target.value))}
            />
            <p className="text-xs text-pretty text-muted-foreground">
              Usa valores positivos para subir y negativos para bajar.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Objetivo</Label>
            <RadioGroup
              value={target}
              onValueChange={(value) => setTarget(value as typeof target)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {[
                { value: "all", label: "Todos" },
                { value: "our_price_unit", label: "Unitario" },
                { value: "our_price_dozen", label: "Docena" },
              ].map((option) => {
                const active = target === option.value

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border/70 bg-card text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <span className="font-medium">{option.label}</span>
                  </label>
                )
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t border-border/70 bg-muted/10 px-4 py-4 sm:flex sm:justify-end">
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
            size="sm"
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            Aplicar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCell({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/85 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
