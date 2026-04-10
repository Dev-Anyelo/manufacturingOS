"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste masivo de precios</DialogTitle>
          <DialogDescription>
            Incrementa o reduce precios en bloque segun el porcentaje indicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              Usa valores positivos para subir y negativos para bajar.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Objetivo</Label>
            <Select
              value={target}
              onValueChange={(value) => setTarget(value as typeof target)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los precios</SelectItem>
                <SelectItem value="our_price_unit">Precio unitario</SelectItem>
                <SelectItem value="our_price_dozen">
                  Precio por docena
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-brand text-brand-foreground"
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
