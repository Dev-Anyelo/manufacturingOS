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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Loader2Icon,
  MinusCircleIcon,
  PlusCircleIcon,
  RefreshCcwDotIcon,
} from "lucide-react"

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
  const isMobile = useIsMobile()
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
      ? "text-emerald-600 dark:text-emerald-400"
      : delta < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 border-border p-0 sm:max-w-xl",
          isMobile ? "max-h-[92vh] rounded-t-2xl" : ""
        )}
      >
        <SheetHeader className="border-b border-border/70 bg-muted/10 px-4 py-4 text-left">
          <SheetTitle className="text-base text-pretty">Ajustar stock</SheetTitle>
          <SheetDescription className="text-sm text-pretty">
            Registra un ajuste con trazabilidad para{" "}
            <strong>{currentItem.name}</strong>.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col overflow-y-auto"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4 px-4 py-4">
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
                          ? "border-primary bg-primary/10"
                          : "border-border/70 bg-card hover:bg-muted/20"
                      )}
                    >
                      <RadioGroupItem
                        value={option.value}
                        className="mt-0.5"
                      />
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
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
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
                    reason.trim().length < 10
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {reason.trim().length}/10
                </span>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/70 pb-[max(env(safe-area-inset-bottom),1rem)] sm:flex-row sm:justify-end sm:gap-2">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
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
