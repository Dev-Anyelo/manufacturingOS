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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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

  const content = (
    <>
      <div className="shrink-0 border-b border-border/70 bg-muted/10 px-4 py-4 text-left">
        <h2 className="text-base font-semibold text-pretty">Ajustar stock</h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Registra un ajuste con trazabilidad para{" "}
          <strong>{currentItem.name}</strong>.
        </p>
      </div>

      <form
        className="flex flex-1 flex-col overflow-y-auto"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4 px-4 py-4">
          <dl className="flex items-center gap-1 border-b pb-4 text-sm">
            <div className="flex items-center gap-1.5 border-r pr-3">
              <dt className="text-xs text-muted-foreground">Stock:</dt>
              <dd className="font-semibold text-pretty tabular-nums">
                {currentItem.quantity.toFixed(2)} {currentItem.unit}
              </dd>
            </div>
            <div className="flex items-center gap-1.5 border-r px-3">
              <dt className="text-xs text-muted-foreground">Ajuste:</dt>
              <dd
                className={cn(
                  "font-medium text-pretty tabular-nums",
                  deltaTone
                )}
              >
                {delta > 0 ? "+" : ""}
                {delta.toFixed(2)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5 pl-3">
              <dt className="text-xs text-muted-foreground">Resultado:</dt>
              <dd className="font-semibold text-pretty tabular-nums">
                {nextQuantity.toFixed(2)}
              </dd>
            </div>
          </dl>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de ajuste</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(value) =>
                setAdjustmentType(value as AdjustmentType)
              }
              className="grid grid-cols-1 gap-2"
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
                    <RadioGroupItem value={option.value} className="mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="size-3.5" />
                          {option.label}
                        </span>
                      </p>
                      <p className="text-xs text-pretty text-muted-foreground">
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
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-r-none border-r-0"
                  onClick={() => setQuantity(Math.max(0, quantity - 1))}
                >
                  -
                </Button>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={quantity || ""}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                    placeholder="0.00"
                    className="rounded-none pr-14 text-center"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                    {currentItem.unit}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-l-none border-l-0"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Motivo del ajuste</Label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo: Correccion por conteo fisico de bodega"
              className="min-h-[60px]"
              rows={2}
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

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/70 bg-background p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
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
              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
            ) : null}
            Guardar ajuste
          </Button>
        </div>
      </form>
    </>
  )

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Ajustar stock</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="gap-0 overflow-hidden p-0">
        <DrawerTitle className="sr-only">Ajustar stock</DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
