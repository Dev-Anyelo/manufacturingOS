"use client"

import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { useForm } from "react-hook-form"
import { MaterialCategory } from "@/types"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormFieldWrapper } from "@/components/shared/form-field-wrapper"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import {
  Box,
  DollarSign,
  FileText,
  ImageIcon,
  LayersIcon,
  Loader2,
  PackageIcon,
  Palette,
  Scissors,
  SettingsIcon,
  Tag,
  Truck,
  Upload,
  WrenchIcon,
  X,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const inventoryFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.nativeEnum(MaterialCategory),
  fabric_type: z.string().trim().max(80).optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  quantity: z.number().min(0),
  unit: z.string().trim().min(1).max(20),
  unit_price: z.number().min(0),
  minimum_stock: z.number().min(0),
  supplier: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
})

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>

interface InventoryFormProps {
  mode: "create" | "edit"
  itemId?: string
  defaultValues?: Partial<InventoryFormValues>
}

const categoryOptions = [
  { value: MaterialCategory.Fabric, label: "Telas", icon: LayersIcon },
  { value: MaterialCategory.Supplies, label: "Insumos", icon: PackageIcon },
  { value: MaterialCategory.Tools, label: "Herramientas", icon: WrenchIcon },
  {
    value: MaterialCategory.Machinery,
    label: "Maquinaria",
    icon: SettingsIcon,
  },
] as const

const unitOptions = ["yd", "metros", "unidades", "rollos"] as const

function normalizeOptionalValue(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function InventoryForm({
  mode,
  itemId,
  defaultValues,
}: InventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    defaultValues?.image_url ?? null
  )
  const [isDragging, setIsDragging] = React.useState(false)

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      category: defaultValues?.category ?? MaterialCategory.Fabric,
      fabric_type: defaultValues?.fabric_type ?? "",
      color: defaultValues?.color ?? "",
      quantity: defaultValues?.quantity ?? 0,
      unit: defaultValues?.unit ?? "yd",
      unit_price: defaultValues?.unit_price ?? 0,
      minimum_stock: defaultValues?.minimum_stock ?? 0,
      supplier: defaultValues?.supplier ?? "",
      notes: defaultValues?.notes ?? "",
      image_url: defaultValues?.image_url ?? null,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const category = form.watch("category")
  const quantityWatch = form.watch("quantity")
  const minimumStockWatch = form.watch("minimum_stock")
  const unitWatch = form.watch("unit")

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
      // Simulated submit for demo
      await new Promise((r) => setTimeout(r, 1000))
      toast.success(
        mode === "create"
          ? "Material creado correctamente."
          : "Material actualizado correctamente."
      )
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
    <Form {...form}>
      <form
        className="animate-fade-in space-y-6"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Main info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Card 1: Identificación */}
            <Card className="animate-slide-up overflow-hidden border-border/60 p-0 shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10">
                    <Tag className="size-4 text-brand" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-pretty">
                      Identificación
                    </CardTitle>
                    <CardDescription className="text-xs text-pretty">
                      Nombre, categoría y datos básicos del material.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pt-0 pb-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormFieldWrapper
                    control={form.control}
                    name="name"
                    label="Nombre del material"
                    required
                  >
                    {(field) => (
                      <Input
                        {...field}
                        placeholder="Ej: Denim azul premium"
                        className="text-sm transition-shadow focus:shadow-sm"
                      />
                    )}
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="category"
                    label="Categoría"
                    required
                  >
                    {(field) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) =>
                          field.onChange(v as MaterialCategory)
                        }
                      >
                        <SelectTrigger className="w-full text-sm transition-shadow focus:shadow-sm">
                          <SelectValue placeholder="Selecciona categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((opt) => {
                            const Icon = opt.icon
                            return (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <Icon className="size-4 text-muted-foreground" />
                                  {opt.label}
                                </span>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </FormFieldWrapper>
                </div>

                {/* Conditional fabric type */}
                <div
                  className={`grid transition-all duration-300 ${
                    category === MaterialCategory.Fabric
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormFieldWrapper
                        control={form.control}
                        name="fabric_type"
                        label="Tipo de tela"
                      >
                        {(field) => (
                          <div className="relative">
                            <Scissors className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Ej: Algodón pima"
                              className="pl-9 text-sm transition-shadow focus:shadow-sm"
                            />
                          </div>
                        )}
                      </FormFieldWrapper>

                      <FormFieldWrapper
                        control={form.control}
                        name="color"
                        label="Color"
                      >
                        {(field) => (
                          <div className="relative">
                            <Palette className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder="Ej: Azul marino"
                              className="pl-9 text-sm transition-shadow focus:shadow-sm"
                            />
                          </div>
                        )}
                      </FormFieldWrapper>
                    </div>
                  </div>
                </div>

                {category !== MaterialCategory.Fabric && (
                  <FormFieldWrapper
                    control={form.control}
                    name="color"
                    label="Color"
                  >
                    {(field) => (
                      <div className="relative">
                        <Palette className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Ej: Azul marino"
                          className="pl-9 text-sm transition-shadow focus:shadow-sm"
                        />
                      </div>
                    )}
                  </FormFieldWrapper>
                )}

                <Separator className="opacity-40" />

                <FormFieldWrapper
                  control={form.control}
                  name="supplier"
                  label="Proveedor"
                >
                  {(field) => (
                    <div className="relative">
                      <Truck className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Ej: Textiles Panamá"
                        className="pl-9 text-sm transition-shadow focus:shadow-sm"
                      />
                    </div>
                  )}
                </FormFieldWrapper>
              </CardContent>
            </Card>

            {/* Card 2: Stock y precios */}
            <Card
              className="animate-slide-up overflow-hidden border-border/60 p-0 shadow-sm"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10">
                    <DollarSign className="text-success size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-pretty">
                      Stock y precios
                    </CardTitle>
                    <CardDescription className="text-xs text-pretty">
                      Cantidades, unidades y costos de adquisición.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-4 pt-0 pb-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <FormFieldWrapper
                    control={form.control}
                    name="quantity"
                    label="Cantidad"
                    required
                  >
                    {(field) => (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="text-sm transition-shadow focus:shadow-sm"
                      />
                    )}
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="unit"
                    label="Unidad"
                    required
                  >
                    {(field) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full text-sm transition-shadow focus:shadow-sm">
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
                    )}
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="minimum_stock"
                    label="Stock mínimo"
                    required
                  >
                    {(field) => (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="text-sm transition-shadow focus:shadow-sm"
                      />
                    )}
                  </FormFieldWrapper>

                  <FormFieldWrapper
                    control={form.control}
                    name="unit_price"
                    label="Precio unitario"
                    required
                  >
                    {(field) => (
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="pl-7 text-sm transition-shadow focus:shadow-sm"
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </div>
                    )}
                  </FormFieldWrapper>
                </div>

                {/* Stock indicator */}
                <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    <Box className="size-3" />
                    Vista previa del stock
                  </p>
                  <StockIndicator
                    quantity={quantityWatch ?? 0}
                    minimumStock={minimumStockWatch ?? 0}
                    unit={unitWatch ?? "yd"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Notas */}
            <Card
              className="animate-slide-up overflow-hidden border-border/60 p-0 shadow-sm"
              style={{ animationDelay: "0.15s" }}
            >
              <CardHeader className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-yellow-400/10">
                    <FileText className="text-warning size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-pretty">
                      Notas adicionales
                    </CardTitle>
                    <CardDescription className="text-xs text-pretty">
                      Información complementaria sobre el material.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 px-4 pt-0 pb-5">
                <FormFieldWrapper
                  control={form.control}
                  name="notes"
                  label="Notas"
                >
                  {(field) => (
                    <Textarea
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Detalles adicionales, instrucciones de uso, observaciones..."
                      className="min-h-28 resize-none text-sm transition-shadow focus:shadow-sm"
                    />
                  )}
                </FormFieldWrapper>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Image & actions */}
          <div className="space-y-6">
            {/* Image upload card */}
            <Card
              className="animate-slide-up overflow-hidden border-border/60 p-0 shadow-sm"
              style={{ animationDelay: "0.05s" }}
            >
              <CardHeader className="border-b border-border/40 bg-muted/30 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10">
                    <ImageIcon className="size-4 text-brand" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Imagen
                    </CardTitle>
                    <CardDescription className="text-xs text-pretty">
                      Foto del material (opcional).
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pt-0 pb-5">
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
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                    isDragging
                      ? "bg-brand-muted border-brand"
                      : "hover:bg-brand-muted/50 border-border/60 bg-muted/20 hover:border-brand/40"
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative w-full">
                      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border/40 bg-background">
                        <img
                          src={previewUrl}
                          alt="Preview del material"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 size-7 rounded-full shadow-md"
                        onClick={(e) => {
                          e.preventDefault()
                          setImageFile(null)
                          setPreviewUrl(null)
                        }}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-full bg-muted p-3">
                        <Upload className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Arrastra o haz click
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          PNG, JPG, WEBP · Máx 5MB
                        </p>
                      </div>
                    </>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label="Seleccionar imagen"
                    onChange={(e) =>
                      handleFileSelection(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </CardContent>
            </Card>

            {/* Actions card */}
            <Card
              className="animate-slide-up overflow-hidden border-border/60 p-0 shadow-sm"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="grid grid-cols-2 gap-3 px-4 pt-3 pb-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand text-brand-foreground shadow-sm transition-all hover:bg-brand/90 hover:shadow-md"
                  size="lg"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {mode === "create" ? "Crear material" : "Guardar cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
