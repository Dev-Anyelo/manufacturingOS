"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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
}> = [
  { value: "add", label: "Agregar" },
  { value: "subtract", label: "Restar" },
  { value: "set", label: "Establecer en" },
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
  const isDecrease = nextQuantity < currentItem.quantity

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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {adjustmentOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={
                  adjustmentType === option.value ? "default" : "outline"
                }
                className="w-full"
                onClick={() => setAdjustmentType(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={quantity || ""}
              onChange={(event) => setQuantity(Number(event.target.value))}
              placeholder="0.00"
            />
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
            <p className="text-muted-foreground">Vista previa</p>
            <p className="font-medium">
              {currentItem.quantity.toFixed(2)} {currentItem.unit} -&gt;{" "}
              <span
                className={
                  isDecrease
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {nextQuantity.toFixed(2)} {currentItem.unit}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo del ajuste</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo: Correccion por conteo fisico de bodega"
              className="min-h-24"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
