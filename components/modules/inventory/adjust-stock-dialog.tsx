"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2Icon, MinusIcon, PlusIcon, TargetIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

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
  icon: React.ElementType
}> = [
  { value: "add", label: "Agregar", icon: PlusIcon },
  { value: "subtract", label: "Restar", icon: MinusIcon },
  { value: "set", label: "Establecer", icon: TargetIcon },
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
  const resultIsValid = nextQuantity >= 0

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajustar stock de {currentItem.name}</DialogTitle>
          <DialogDescription>
            Registra un ajuste con motivo para mantener trazabilidad.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <RadioGroup
            value={adjustmentType}
            onValueChange={(value) =>
              setAdjustmentType(value as AdjustmentType)
            }
            className="grid grid-cols-3 gap-2"
          >
            {adjustmentOptions.map((option) => {
              const Icon = option.icon
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                    "hover:bg-muted/50",
                    adjustmentType === option.value
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border text-muted-foreground"
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{option.label}</span>
                </label>
              )
            })}
          </RadioGroup>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Cantidad</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={quantity || ""}
              onChange={(event) => setQuantity(Number(event.target.value))}
              placeholder="0.00"
            />
          </div>

          <div
            className={cn(
              "rounded-lg border p-3 text-center",
              resultIsValid
                ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-red-500/30 bg-red-50 dark:bg-red-950/20"
            )}
          >
            <p className="mb-1 text-xs text-muted-foreground">
              Stock resultante
            </p>
            <p className="text-lg font-bold tabular-nums">
              <span className="mr-2 text-sm text-muted-foreground line-through">
                {currentItem.quantity.toFixed(2)} {currentItem.unit}
              </span>
              <span
                className={
                  resultIsValid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
                }
              >
                {nextQuantity.toFixed(2)} {currentItem.unit}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo del ajuste</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo: Correccion por conteo fisico de bodega"
              className="min-h-24"
            />
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand text-brand-foreground sm:w-auto"
            >
              {isSubmitting && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              Guardar ajuste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
