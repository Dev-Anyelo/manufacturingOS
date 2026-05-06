import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CatalogFormValues } from "./catalog-form"
import { UseFormSetValue, UseFormWatch, Control } from "react-hook-form"

export interface StockEntry {
  size: string
  color?: string
  quantity: number
  minimumStock: number
}

interface CatalogStockSectionProps {
  control: Control<CatalogFormValues>
  watch: UseFormWatch<CatalogFormValues>
  setValue: UseFormSetValue<CatalogFormValues>
}

export function CatalogStockSection({
  control,
  watch,
  setValue,
}: CatalogStockSectionProps) {
  const stockEntries = watch("stock_entries") || []

  const addStockEntry = () => {
    const newEntries = [
      ...(stockEntries || []),
      { size: "", color: "", quantity: 0, minimumStock: 0 },
    ]
    setValue("stock_entries", newEntries)
  }

  const removeStockEntry = (index: number) => {
    const newEntries = (stockEntries || []).filter((_, i) => i !== index)
    setValue("stock_entries", newEntries)
  }

  const updateStockEntry = (index: number, field: string, value: any) => {
    const newEntries = [...(stockEntries || [])]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setValue("stock_entries", newEntries)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Stock por talla/color</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addStockEntry}
          className="gap-2"
        >
          <Plus className="size-4" />
          Agregar entrada
        </Button>
      </div>

      <div className="space-y-3">
        {stockEntries && stockEntries.length > 0 ? (
          stockEntries.map((entry, index) => (
            <div
              key={index}
              className="flex gap-2 rounded-lg border border-border/70 bg-muted/30 p-3"
            >
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Talla
                  </Label>
                  <Input
                    placeholder="S, M, L, XL..."
                    value={entry.size || ""}
                    onChange={(e) =>
                      updateStockEntry(index, "size", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Color (opt.)
                  </Label>
                  <Input
                    placeholder="Rojo, Azul..."
                    value={entry.color || ""}
                    onChange={(e) =>
                      updateStockEntry(index, "color", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Cantidad
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={String(entry.quantity)}
                    onChange={(e) =>
                      updateStockEntry(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    Mín.
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={String(entry.minimumStock)}
                    onChange={(e) =>
                      updateStockEntry(
                        index,
                        "minimumStock",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => removeStockEntry(index)}
                variant="destructive"
                size="icon"
                className="self-start"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <p className="py-2 text-xs text-muted-foreground italic">
            Sin entradas de stock. Agrega una para crear stock manual.
          </p>
        )}
      </div>
    </div>
  )
}
