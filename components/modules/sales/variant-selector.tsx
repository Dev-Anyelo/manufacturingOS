"use client"

import * as React from "react"
import { Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const NO_COLOR_VALUE = "__no_color__"

interface FinishedGoodVariant {
  id: string
  size: string
  color: string | null
  stock: number
}

interface VariantSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  variants: FinishedGoodVariant[]
  selectedSize?: string
  selectedColor?: string | null
  onSelectVariant: (params: {
    finishedGoodStockId: string
    size: string
    color: string | null
    quantity: number
    variantLabel: string
    maxQuantity: number
  }) => void
}

export function VariantSelector({
  open,
  onOpenChange,
  itemName,
  variants,
  selectedSize = "",
  selectedColor = null,
  onSelectVariant,
}: VariantSelectorProps) {
  const [tempSize, setTempSize] = React.useState(selectedSize)
  const [tempColor, setTempColor] = React.useState(
    selectedColor ?? NO_COLOR_VALUE
  )
  const [quantity, setQuantity] = React.useState(1)

  // Get unique sizes and colors available
  const availableSizes = React.useMemo(() => {
    const sizes = [...new Set(variants.map((v) => v.size))].sort()
    return sizes
  }, [variants])

  const availableColors = React.useMemo(() => {
    const colors = [
      ...new Set(
        variants
          .map((v) => v.color)
          .filter((color): color is string => Boolean(color))
      ),
    ].sort()
    return colors
  }, [variants])

  // Get available colors for selected size
  const colorsForSize = React.useMemo(() => {
    if (!tempSize) return availableColors
    return [
      ...new Set(
        variants
          .filter((v) => v.size === tempSize)
          .map((v) => v.color)
          .filter((color): color is string => Boolean(color))
      ),
    ].sort()
  }, [variants, tempSize, availableColors])

  // Get available sizes for selected color
  const sizesForColor = React.useMemo(() => {
    if (tempColor === NO_COLOR_VALUE) {
      return [
        ...new Set(
          variants
            .filter((v) => v.color === null && v.stock > 0)
            .map((v) => v.size)
        ),
      ].sort()
    }
    return [
      ...new Set(
        variants
          .filter((v) => v.color === tempColor && v.stock > 0)
          .map((v) => v.size)
      ),
    ].sort()
  }, [variants, tempColor])

  // Find matching variant
  const selectedVariant = React.useMemo(() => {
    const normalizedColor = tempColor === NO_COLOR_VALUE ? null : tempColor
    return variants.find(
      (v) => v.size === tempSize && v.color === normalizedColor
    )
  }, [variants, tempSize, tempColor])

  React.useEffect(() => {
    if (!selectedVariant) return
    setQuantity((prev) => {
      const bounded = Math.min(Math.max(prev, 1), selectedVariant.stock)
      return Number.isFinite(bounded) ? bounded : 1
    })
  }, [selectedVariant])

  const handleConfirm = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return

    const normalizedQuantity = Math.min(
      Math.max(quantity, 1),
      selectedVariant.stock
    )

    onSelectVariant({
      finishedGoodStockId: selectedVariant.id,
      size: tempSize,
      color: tempColor === NO_COLOR_VALUE ? null : tempColor,
      quantity: normalizedQuantity,
      variantLabel: `${tempColor === NO_COLOR_VALUE ? "Sin color" : tempColor} / ${tempSize}`,
      maxQuantity: selectedVariant.stock,
    })
    onOpenChange(false)
  }

  const handleSizeChange = (size: string) => {
    setTempSize(size)
    // If selected color is not available for this size, reset color
    if (tempColor !== NO_COLOR_VALUE && !colorsForSize.includes(tempColor)) {
      setTempColor(NO_COLOR_VALUE)
    }
  }

  const handleColorChange = (color: string) => {
    const normalizedColor = color === NO_COLOR_VALUE ? NO_COLOR_VALUE : color
    setTempColor(normalizedColor)
    // If selected size is not available for this color, reset size
    const sizesForSelectedColor = normalizedColor
      ? normalizedColor === NO_COLOR_VALUE
        ? [
            ...new Set(
              variants.filter((v) => v.color === null).map((v) => v.size)
            ),
          ]
        : [
            ...new Set(
              variants
                .filter((v) => v.color === normalizedColor)
                .map((v) => v.size)
            ),
          ]
      : availableSizes
    if (tempSize && !sizesForSelectedColor.includes(tempSize)) {
      setTempSize("")
    }
  }

  React.useEffect(() => {
    if (open) {
      setTempSize(selectedSize)
      setTempColor(selectedColor ?? NO_COLOR_VALUE)
      setQuantity(1)
    }
  }, [open, selectedSize, selectedColor])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Seleccionar variante
          </DialogTitle>
          <DialogDescription>
            Elige la talla y color para {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <Label>Color</Label>
              <Select value={tempColor} onValueChange={handleColorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_COLOR_VALUE}>Sin color</SelectItem>
                  {availableColors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Talla</Label>
            <Select value={tempSize} onValueChange={handleSizeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar talla" />
              </SelectTrigger>
              <SelectContent>
                {sizesForColor.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVariant && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">Variante seleccionada</div>
                  <div className="text-muted-foreground">
                    Talla: {selectedVariant.size}
                    {selectedVariant.color &&
                      ` • Color: ${selectedVariant.color}`}
                  </div>
                </div>
                <Badge variant="secondary">
                  Stock: {selectedVariant.stock}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <Label htmlFor="variant-qty">Cantidad</Label>
                <Input
                  id="variant-qty"
                  type="number"
                  min={1}
                  max={selectedVariant.stock}
                  value={quantity}
                  onChange={(event) => {
                    const parsed = Number(event.target.value || 1)
                    if (!Number.isFinite(parsed)) {
                      setQuantity(1)
                      return
                    }
                    setQuantity(
                      Math.min(Math.max(parsed, 1), selectedVariant.stock)
                    )
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
            >
              <Check className="mr-2 size-4" />
              Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
