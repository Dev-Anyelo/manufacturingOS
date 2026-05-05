"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

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
  const isMobile = useIsMobile()
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

  const content = (
    <>
      <div className="space-y-1.5 border-b border-border/70 bg-muted/10 px-4 py-4 text-left">
        <h2 className="text-lg font-semibold tracking-tight">
          Ajuste masivo de precios
        </h2>
        <p className="text-sm text-muted-foreground">
          Incrementa o reduce precios en bloque según el porcentaje indicado.
        </p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SummaryCell label="Objetivo" value={targetLabel} />
          <SummaryCell
            label="Multiplicador"
            value={
              <span className="font-mono font-bold text-brand">
                x{multiplier.toFixed(3)}
              </span>
            }
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="percentage" className="text-sm font-semibold">
            Porcentaje de ajuste
          </Label>
          <div className="relative">
            <Input
              id="percentage"
              type="number"
              step="0.1"
              value={percentage}
              onChange={(event) => setPercentage(Number(event.target.value))}
              className="pr-10 text-lg font-medium"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
              %
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            Usa valores positivos para incrementar (ej: 10) y negativos para
            reducir (ej: -15).
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Precios a afectar</Label>
          <RadioGroup
            value={target}
            onValueChange={(value) => setTarget(value as typeof target)}
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
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
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200",
                    active
                      ? "border-brand bg-brand/5 shadow-sm ring-1 ring-brand/20"
                      : "border-border/60 bg-card hover:bg-muted/30"
                  )}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-brand" : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              )
            })}
          </RadioGroup>
        </div>
      </div>

      <div className="mt-auto border-t border-border/70 bg-background/50 p-4 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full shadow-lg shadow-brand/15 sm:w-auto"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            
            Aplicar
          </Button>
        </div>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex max-h-[95vh] flex-col overflow-hidden border-border bg-popover p-0 shadow-2xl">
          <DrawerTitle className="sr-only">
            Ajuste masivo de precios
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Formulario para ajustar precios en bloque
          </DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetTitle className="sr-only">Ajuste masivo de precios</SheetTitle>
        <SheetDescription className="sr-only">
          Formulario para ajustar precios en bloque
        </SheetDescription>
        {content}
      </SheetContent>
    </Sheet>
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
    <div className="group flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
        {label}
      </p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  )
}
