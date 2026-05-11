"use client"

import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Currency } from "@prisma/client"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MaterialCategory } from "@prisma/client"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { MediaUpload } from "@/components/shared/media-upload"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Loader2,
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
  image_url: z.string().trim().optional().nullable(),
  is_active: z.boolean().optional(),
})

type InventoryFormInput = z.input<typeof inventoryFormSchema>
type InventoryFormOutput = z.output<typeof inventoryFormSchema>

export type InventoryFormValues = InventoryFormOutput

interface InventoryFormProps {
  className?: string
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
  className,
  mode,
  itemId,
  defaultValues,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()
  const { baseCurrency, isLoading: settingsLoading } = useSystemSettings()

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
          image_url: values.image_url || null,
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

      const pathsToRevalidate = ["/inventory", "/"]
      if (result.data?.id)
        pathsToRevalidate.push(`/inventory/${result.data.id}`)

      if (onSuccess) {
        await revalidatePaths(pathsToRevalidate)
        toast.success(
          mode === "create"
            ? "Material agregado al inventario"
            : "Material actualizado correctamente"
        )
        onSuccess()
      } else {
        await revalidatePaths(pathsToRevalidate)
        toast.success(
          mode === "create"
            ? "Material agregado al inventario"
            : "Material actualizado correctamente"
        )
        if (result.data?.id) {
          router.push(`/inventory/${result.data.id}`)
        }
      }
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
    <form
      onSubmit={onSubmit}
      className={cn("flex h-full min-h-0 flex-col", className)}
      noValidate
    >
      {/* ─── Summary Bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-5">
            <SummaryStat
              label="Valor Total"
              value={totalValue}
              currency={
                (form.watch("unit_price_currency") as Currency) || Currency.USD
              }
            />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-8"
            />
            <SummaryStat
              label="Estado Stock"
              value={
                stockStatus === "ok"
                  ? "Óptimo"
                  : stockStatus === "warning"
                    ? "Moderado"
                    : stockStatus === "low"
                      ? "Bajo"
                      : "Sin stock"
              }
              status={stockStatus}
            />
            <Separator
              orientation="vertical"
              className="hidden data-[orientation=vertical]:h-8 sm:block"
            />
            <SummaryStat
              label="Unidad"
              value={unitWatch || "N/A"}
              className="hidden sm:flex"
            />
          </div>

          <div className="flex min-w-0 flex-col items-end">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Categoría
            </span>
            <div className="flex min-w-0 items-center gap-1.5">
              {categoryOptions.find((o) => o.value === category)?.icon && (
                <div className={cn("size-3.5 shrink-0", categoryOptions.find((o) => o.value === category)?.color)}>
                  {React.createElement(categoryOptions.find((o) => o.value === category)!.icon, { className: "size-full" })}
                </div>
              )}
              <span className="truncate text-sm font-medium">
                {categoryOptions.find((o) => o.value === category)?.label || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs Content (Scrollable) ──────────────────────────────── */}
      <Tabs defaultValue="info" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border/70 bg-background px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <TabsList className="grid h-10 w-full grid-cols-3">
            <TabsTrigger value="info" className="gap-2 text-sm">
              <Tag className="size-4" />
              <span>Información</span>
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2 text-sm">
              <Package className="size-4" />
              <span>Stock</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 text-sm">
              <ImageIcon className="size-4" />
              <span>Imagen</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <TabsContent value="info" className="m-0 focus-visible:ring-0">
            <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-foreground/90">
                    Nombre del material <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Ej: Denim azul premium"
                    className="h-10 focus-visible:ring-primary"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs font-medium text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground/90">Categoría</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(v) => form.setValue("category", v as MaterialCategory)}
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
                  <Label htmlFor="supplier" className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                    <Truck className="size-3.5 text-primary" />
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

              {category === MaterialCategory.fabric ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fabric_type" className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                      <Scissors className="size-3.5 text-primary" />
                      Tipo de tela
                    </Label>
                    <Input id="fabric_type" {...form.register("fabric_type")} placeholder="Ej: Algodón pima" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color" className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                      <Palette className="size-3.5 text-primary" />
                      Color
                    </Label>
                    <Input id="color" {...form.register("color")} placeholder="Ej: Azul marino" className="h-10" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="color" className="flex items-center gap-1.5 text-sm font-semibold text-foreground/90">
                    <Palette className="size-3.5 text-primary" />
                    Color / Variante
                  </Label>
                  <Input id="color" {...form.register("color")} placeholder="Ej: Negro, Plata, etc." className="h-10" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-foreground/90">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  {...form.register("notes")}
                  placeholder="Información relevante sobre el material..."
                  className="min-h-[100px] resize-none focus-visible:ring-primary"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="m-0 focus-visible:ring-0">
            <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold text-foreground/90">Cantidad actual</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("quantity", { valueAsNumber: true })}
                    className="h-10 font-medium tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground/90">Unidad de medida</Label>
                  <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v)}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_stock" className="text-sm font-semibold text-foreground/90">Stock mínimo alertable</Label>
                  <Input
                    id="minimum_stock"
                    type="number"
                    min={0}
                    step="0.01"
                    {...form.register("minimum_stock", { valueAsNumber: true })}
                    className="h-10 font-medium tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="text-sm font-semibold text-foreground/90">Precio por unidad</Label>
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
                      className="h-10 flex-1 font-medium tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Status Indicator Pattern */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Estado operativo
                  </span>
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                    stockStatus === "ok" && "bg-emerald-500/10 text-emerald-600",
                    stockStatus === "warning" && "bg-amber-500/10 text-amber-600",
                    stockStatus === "low" && "bg-destructive/10 text-destructive",
                    stockStatus === "out" && "bg-destructive/20 text-destructive"
                  )}>
                    {stockStatus === "ok" ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                    {stockStatus === "ok" ? "Óptimo" : stockStatus === "warning" ? "Moderado" : stockStatus === "low" ? "Stock Bajo" : "Agotado"}
                  </div>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      stockStatus === "ok" && "bg-emerald-500",
                      stockStatus === "warning" && "bg-amber-500",
                      stockStatus === "low" && "bg-destructive",
                      stockStatus === "out" && "bg-destructive"
                    )}
                    style={{ width: `${Math.min((quantityWatch / (minimumStockWatch * 2 || 1)) * 100, 100)}%` }}
                  />
                  <div className="absolute top-0 h-full w-0.5 bg-foreground/20" style={{ left: "50%" }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>Agotado</span>
                  <span>Mínimo: {minimumStockWatch}</span>
                  <span>{minimumStockWatch * 2}+ {unitWatch}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media" className="m-0 focus-visible:ring-0">
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
              <input type="hidden" {...form.register("image_url")} />
              <MediaUpload
                bucketType="inventory"
                recordId={itemId}
                currentValue={form.watch("image_url") || undefined}
                onUploadComplete={(path) => {
                  form.setValue("image_url", path as string, { shouldDirty: true, shouldValidate: true })
                }}
                label="Imagen del material"
                multiple={false}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* ─── Sticky Footer (Always Visible) ─────────────────────────── */}
      <div className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 sm:py-4 sm:pb-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 sm:flex-initial">
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>{mode === "create" ? "Agregar material" : "Guardar cambios"}</span>
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ───────────────────────────── Subcomponents ──────────────────────────── */

function SummaryStat({
  label,
  value,
  currency,
  status,
  className,
}: {
  label: string
  value: string | number
  currency?: Currency
  status?: "ok" | "warning" | "low" | "out"
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {currency ? (
          <CurrencyDisplay amount={Number(value)} currency={currency} size="sm" />
        ) : (
          <span className={cn(
            "text-sm font-bold tabular-nums",
            status === "low" || status === "out" ? "text-destructive" : ""
          )}>
            {value}
          </span>
        )}
      </div>
    </div>
  )
}
