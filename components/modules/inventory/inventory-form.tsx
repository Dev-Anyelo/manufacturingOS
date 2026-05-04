"use client"

import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MaterialCategory } from "@prisma/client"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Currency } from "@prisma/client"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatCurrencyNI } from "@/lib/currency/exchange"

import {
  Loader2,
  Upload,
  X,
  Package,
  Tag,
  Layers,
  Wrench,
  Settings,
  Scissors,
  Palette,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Save,
} from "lucide-react"

const inventoryFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.nativeEnum(MaterialCategory),
  fabric_type: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  quantity: z.number().min(0),
  unit: z.string().trim().min(1).max(20),
  unit_price: z.number().min(0),
  unit_price_currency: z.nativeEnum(Currency),
  minimum_stock: z.number().min(0),
  supplier: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
})

type InventoryFormInput = z.input<typeof inventoryFormSchema>
type InventoryFormOutput = z.output<typeof inventoryFormSchema>

export type InventoryFormValues = InventoryFormOutput

interface InventoryFormProps {
  mode: "create" | "edit"
  itemId?: string
  defaultValues?: Partial<InventoryFormValues>
  onSuccess?: () => void
  onCancel?: () => void
}

const categoryOptions = [
  {
    value: MaterialCategory.fabric,
    label: "Telas",
    icon: Layers,
    color: "text-info",
  },
  {
    value: MaterialCategory.supplies,
    label: "Insumos",
    icon: Package,
    color: "text-success",
  },
  {
    value: MaterialCategory.tools,
    label: "Herramientas",
    icon: Wrench,
    color: "text-warning",
  },
  {
    value: MaterialCategory.machinery,
    label: "Maquinaria",
    icon: Settings,
    color: "text-muted-foreground",
  },
] as const

const unitOptions = ["yd", "metros", "unidades", "rollos"] as const

// formatCurrency eliminado, se usa exchange.ts

export function InventoryForm({
  mode,
  itemId,
  defaultValues,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { baseCurrency, isLoading: settingsLoading } = useSystemSettings()
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    defaultValues?.image_url ?? null
  )
  const [isDragging, setIsDragging] = React.useState(false)

  const form = useForm<InventoryFormInput, unknown, InventoryFormOutput>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? MaterialCategory.fabric,
      fabric_type: defaultValues?.fabric_type ?? "",
      color: defaultValues?.color ?? "",
      quantity: defaultValues?.quantity ?? 0,
      unit: defaultValues?.unit ?? "yd",
      unit_price: defaultValues?.unit_price ?? 0,
      unit_price_currency: defaultValues?.unit_price_currency,
      minimum_stock: defaultValues?.minimum_stock ?? 0,
      supplier: defaultValues?.supplier ?? "",
      notes: defaultValues?.notes ?? "",
      image_url: defaultValues?.image_url ?? null,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const category = form.watch("category")
  React.useEffect(() => {
    if (baseCurrency && !form.getValues("unit_price_currency")) {
      form.setValue("unit_price_currency", baseCurrency)
    }
  }, [baseCurrency, form])

  const { isDirty, isValid } = form.formState
  const quantityWatch = form.watch("quantity")
  const minimumStockWatch = form.watch("minimum_stock")
  const unitWatch = form.watch("unit")
  const unitPriceWatch = form.watch("unit_price")

  const stockStatus = React.useMemo(() => {
    if (quantityWatch <= 0) return "out"
    if (quantityWatch <= minimumStockWatch) return "low"
    if (quantityWatch <= minimumStockWatch * 1.5) return "warning"
    return "ok"
  }, [quantityWatch, minimumStockWatch])

  const totalValue = quantityWatch * unitPriceWatch

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileSelection(file: File | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Debes seleccionar una imagen válida.")
      return
    }
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      const endpoint =
        mode === "create" ? "/api/inventory" : `/api/inventory/${itemId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          fabric_type: values.fabric_type?.trim() || null,
          color: values.color?.trim() || null,
          supplier: values.supplier?.trim() || null,
          notes: values.notes?.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo guardar el material.")
      }

      if (imageFile && result.data?.id) {
        const formData = new FormData()
        formData.append("file", imageFile)
        await fetch(`/api/inventory/${result.data.id}/image`, {
          method: "POST",
          body: formData,
        })
      }

      toast.success(
        mode === "create"
          ? "Material agregado al inventario"
          : "Material actualizado correctamente"
      )
      onSuccess?.()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el material."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form className="mx-auto w-full" onSubmit={onSubmit} noValidate>
      {/* Summary Stats - Compact Info Bar */}
      <div className="mb-4 flex items-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
        {[
          { 
            label: "Valor", 
            amount: Number(totalValue || 0),
            currency: (form.watch("unit_price_currency") as Currency) || Currency.USD
          },
          {
            label: "Estado",
            value:
              stockStatus === "ok"
                ? "Óptimo"
                : stockStatus === "warning"
                  ? "Moderado"
                  : stockStatus === "low"
                    ? "Bajo"
                    : "Sin stock",
          },
          { label: "Unidad", value: unitWatch || "N/A" },
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0 flex-col items-center px-4 py-2",
              i > 0 && "border-l border-border/60"
            )}
          >
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {item.label}
            </span>
            <div className="mt-0.5">
              {"amount" in item ? (
                <CurrencyDisplay 
                  amount={item.amount ?? 0} 
                  currency={item.currency}
                  size="sm"
                />
              ) : (
                <span className="text-sm font-bold tabular-nums">
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="info" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="size-3.5" />
            Información
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5 text-xs sm:text-sm">
            <Package className="size-3.5" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5 text-xs sm:text-sm">
            <ImageIcon className="size-3.5" />
            Imagen
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="space-y-4">
              {/* Name + Category */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Ej: Denim azul premium"
                    className="h-10"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoría</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(v) =>
                      form.setValue("category", v as MaterialCategory)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={cn("size-4", opt.color)} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="supplier"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Truck className="size-3.5" />
                    Proveedor
                  </Label>
                  <Input
                    id="supplier"
                    {...form.register("supplier")}
                    placeholder="Ej: Textiles S.A."
                    className="h-10"
                  />
                </div>
              </div>

              {/* Conditional fields */}
              {category === MaterialCategory.fabric && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="fabric_type"
                      className="flex items-center gap-1 text-sm font-medium"
                    >
                      <Scissors className="size-3.5" />
                      Tipo de tela
                    </Label>
                    <Input
                      id="fabric_type"
                      {...form.register("fabric_type")}
                      placeholder="Ej: Algodón pima"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="color"
                      className="flex items-center gap-1 text-sm font-medium"
                    >
                      <Palette className="size-3.5" />
                      Color
                    </Label>
                    <Input
                      id="color"
                      {...form.register("color")}
                      placeholder="Ej: Azul marino"
                      className="h-10"
                    />
                  </div>
                </div>
              )}

              {category !== MaterialCategory.fabric && (
                <div className="space-y-2">
                  <Label
                    htmlFor="color"
                    className="flex items-center gap-1 text-sm font-medium"
                  >
                    <Palette className="size-3.5" />
                    Color / Variante
                  </Label>
                  <Input
                    id="color"
                    {...form.register("color")}
                    placeholder="Ej: Negro, Plata, etc."
                    className="h-10"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  {...form.register("notes")}
                  placeholder="Información adicional..."
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="space-y-4">
              {/* Quantity Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Cantidad
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("quantity", { valueAsNumber: true })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Unidad</Label>
                  <Select
                    value={form.watch("unit")}
                    onValueChange={(v) => form.setValue("unit", v)}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="minimum_stock"
                    className="text-sm font-medium"
                  >
                    Stock mín.
                  </Label>
                  <Input
                    id="minimum_stock"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("minimum_stock", { valueAsNumber: true })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="text-sm font-medium">
                    Precio
                  </Label>
                  <div className="flex gap-2">
                    <CurrencySelector
                      value={form.watch("unit_price_currency") || Currency.USD}
                      onChange={(val) => form.setValue("unit_price_currency", val)}
                    />
                    <Input
                      id="unit_price"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("unit_price", { valueAsNumber: true })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Status */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Estado del stock
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      stockStatus === "ok" && "bg-success/10 text-success",
                      stockStatus === "warning" && "bg-warning/10 text-warning",
                      stockStatus === "low" &&
                        "bg-destructive/10 text-destructive",
                      stockStatus === "out" &&
                        "bg-destructive/20 text-destructive"
                    )}
                  >
                    {stockStatus === "ok" && (
                      <CheckCircle2 className="size-3" />
                    )}
                    {stockStatus !== "ok" && (
                      <AlertTriangle className="size-3" />
                    )}
                    {stockStatus === "ok" && "Óptimo"}
                    {stockStatus === "warning" && "Moderado"}
                    {stockStatus === "low" && "Bajo"}
                    {stockStatus === "out" && "Sin stock"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      stockStatus === "ok" && "bg-success",
                      stockStatus === "warning" && "bg-warning",
                      stockStatus === "low" && "bg-destructive",
                      stockStatus === "out" && "bg-destructive"
                    )}
                    style={{
                      width: `${Math.min((quantityWatch / (minimumStockWatch * 2)) * 100, 100)}%`,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/20"
                    style={{ left: "50%" }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>0</span>
                  <span>Mín: {minimumStockWatch}</span>
                  <span>{minimumStockWatch * 2}+</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <label
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFileSelection(e.dataTransfer.files?.[0] ?? null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all",
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-border bg-muted/30 hover:border-accent/50"
              )}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-50">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 size-7 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      setImageFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-3">
                    <Upload className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-pretty">
                      Arrastra o selecciona una imagen
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG hasta 5MB
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  handleFileSelection(e.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:mt-5">
        <Button type="button" variant="outline" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? "Agregar material" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
