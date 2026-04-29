"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import {
  Loader2Icon,
  MinusCircleIcon,
  PlusCircleIcon,
  RefreshCcwDotIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type AdjustmentType = "add" | "subtract" | "set"

interface InventoryAdjustItem {
  id: string
  name: string
  quantity: number
  unit: string
}

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryAdjustItem | null
  onAdjusted?: () => void
}

const adjustmentOptions: Array<{
  value: AdjustmentType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    value: "add",
    label: "Agregar",
    description: "Entrada adicional de material",
    icon: PlusCircleIcon,
  },
  {
    value: "subtract",
    label: "Restar",
    description: "Salida o merma no registrada",
    icon: MinusCircleIcon,
  },
  {
    value: "set",
    label: "Establecer",
    description: "Correccion segun conteo fisico",
    icon: RefreshCcwDotIcon,
  },
]

function getNextQuantity(
  currentQuantity: number,
  adjustmentType: AdjustmentType,
  quantity: number
) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return currentQuantity
  }

  if (adjustmentType === "add") {
    return currentQuantity + quantity
  }

  if (adjustmentType === "subtract") {
    return Math.max(0, currentQuantity - quantity)
  }

  return quantity
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  item,
  onAdjusted,
}: AdjustStockDialogProps) {
  const [adjustmentType, setAdjustmentType] =
    React.useState<AdjustmentType>("add")
  const [quantity, setQuantity] = React.useState<number>(0)
  const [reason, setReason] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setAdjustmentType("add")
      setQuantity(0)
      setReason("")
      setIsSubmitting(false)
    }
  }, [open])

  if (!item) {
    return null
  }

  const currentItem = item

  const nextQuantity = getNextQuantity(
    currentItem.quantity,
    adjustmentType,
    quantity
  )
  const delta = nextQuantity - currentItem.quantity
  const deltaTone =
    delta > 0
      ? "text-success"
      : delta < 0
        ? "text-danger"
        : "text-muted-foreground"
  const previewTone =
    nextQuantity < currentItem.quantity ? "text-danger" : "text-success"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor que cero.")
      return
    }

    if (reason.trim().length < 10) {
      toast.error("El motivo debe tener al menos 10 caracteres.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/inventory/${currentItem.id}/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory_item_id: currentItem.id,
          adjustment_type: adjustmentType,
          quantity,
          reason: reason.trim(),
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo ajustar el inventario.")
      }

      toast.success("Inventario ajustado correctamente.")
      onOpenChange(false)
      onAdjusted?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo ajustar el inventario."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-border/75 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/70 bg-muted/10 px-4 py-4">
          <DialogTitle className="text-base text-pretty">
            Ajustar stock
          </DialogTitle>
          <DialogDescription className="text-sm text-pretty">
            Registra un ajuste con trazabilidad para{" "}
            <strong>{currentItem.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 px-4 py-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricBox
              label="Stock actual"
              value={`${currentItem.quantity.toFixed(2)} ${currentItem.unit}`}
            />
            <MetricBox
              label="Ajuste"
              value={
                <span className={cn("tabular-nums", deltaTone)}>
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(2)} {currentItem.unit}
                </span>
              }
            />
            <MetricBox
              label="Resultado"
              value={`${nextQuantity.toFixed(2)} ${currentItem.unit}`}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de ajuste</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(value) =>
                setAdjustmentType(value as AdjustmentType)
              }
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {adjustmentOptions.map((option) => {
                const Icon = option.icon
                const active = adjustmentType === option.value

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                      active
                        ? "border-brand bg-brand/10"
                        : "border-border/70 bg-card hover:bg-muted/20"
                    )}
                  >
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="size-3.5" />
                          {option.label}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cantidad</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={quantity || ""}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  placeholder="0.00"
                  className="pr-14"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                  {currentItem.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo del ajuste</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo: Correccion por conteo fisico de bodega"
              className="min-h-24"
            />
            <div className="flex items-center justify-between text-xs">
              <span
                className={
                  reason.trim().length < 10 ? "text-warning" : "text-success"
                }
              >
                {reason.trim().length}/10
              </span>
            </div>
          </div>

          <DialogFooter className="grid grid-cols-1 gap-2 border-t border-border/70 pt-3 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              Guardar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MetricBox({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/80 px-3 py-2">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}
