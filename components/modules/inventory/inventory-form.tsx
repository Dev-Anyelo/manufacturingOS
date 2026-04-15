"use client"

import { z } from "zod"
import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import * as React from "react"
import { MaterialCategory } from "@/types"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormFieldWrapper } from "@/components/shared/form-field-wrapper"
import { useForm, type Control, type FieldValues } from "react-hook-form"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import {
  LayersIcon,
  Loader2Icon,
  PackageIcon,
  SettingsIcon,
  UploadIcon,
  WrenchIcon,
  XIcon,
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

type InventoryFormValues = z.infer<typeof inventoryFormSchema>

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
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    defaultValues?.image_url ?? null
  )

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

  const formControl = form.control as unknown as Control<FieldValues>
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
      toast.error("Debes seleccionar una imagen valida.")
      return
    }
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadImage(targetId: string) {
    if (!imageFile) return
    const formData = new FormData()
    formData.append("file", imageFile)
    const response = await fetch(`/api/inventory/${targetId}/image`, {
      method: "POST",
      body: formData,
    })
    const payload = (await response.json()) as {
      success: boolean
      error?: string
    }
    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? "No se pudo subir la imagen.")
    }
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
          fabric_type: normalizeOptionalValue(values.fabric_type),
          color: normalizeOptionalValue(values.color),
          supplier: normalizeOptionalValue(values.supplier),
          notes: normalizeOptionalValue(values.notes),
          image_url: defaultValues?.image_url ?? null,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        data?: { id: string }
        error?: string
      }

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "No se pudo guardar el material.")
      }

      await uploadImage(payload.data.id)

      toast.success(
        mode === "create"
          ? "Material creado correctamente."
          : "Material actualizado correctamente."
      )

      router.push(`/inventory/${payload.data.id}`)
      router.refresh()
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
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      {/* Card 1: Informacion del material */}
      <Card className="rounded-xl border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold">
            Informacion del material
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Datos de identificacion, categoria y proveedor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* Image upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagen del material</p>
            <label
              onDrop={(event) => {
                event.preventDefault()
                handleFileSelection(event.dataTransfer.files?.[0] ?? null)
              }}
              onDragOver={(event) => event.preventDefault()}
              className="hover:bg-brand-muted flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-center transition-colors hover:border-brand/60"
            >
              {previewUrl ? (
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-border/50 bg-background sm:w-56">
                  <Image
                    src={previewUrl}
                    alt="Preview del material"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 size-7"
                    onClick={(event) => {
                      event.preventDefault()
                      setImageFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-3">
                    <UploadIcon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Arrastra o haz click para seleccionar
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PNG, JPG, WEBP hasta 5MB
                    </p>
                  </div>
                </>
              )}
              <Input
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Seleccionar imagen del material"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>

          <Separator className="opacity-50" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormFieldWrapper
              control={formControl}
              name="name"
              label="Nombre"
              required
            >
              {(field) => <Input {...field} placeholder="Ej: Denim azul" />}
            </FormFieldWrapper>

            <FormFieldWrapper
              control={formControl}
              name="category"
              label="Categoria"
              required
            >
              {(field) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value as MaterialCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {option.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            </FormFieldWrapper>

            <div
              className={`overflow-hidden transition-all duration-200 ${
                category === MaterialCategory.Fabric
                  ? "max-h-28 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <FormFieldWrapper
                control={formControl}
                name="fabric_type"
                label="Tipo de tela"
              >
                {(field) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Ej: Algodon"
                  />
                )}
              </FormFieldWrapper>
            </div>

            <FormFieldWrapper control={formControl} name="color" label="Color">
              {(field) => (
                <Input
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Ej: Azul marino"
                />
              )}
            </FormFieldWrapper>

            <FormFieldWrapper
              control={formControl}
              name="supplier"
              label="Proveedor"
            >
              {(field) => (
                <Input
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  placeholder="Ej: Textiles Panama"
                />
              )}
            </FormFieldWrapper>
          </div>

          <FormFieldWrapper control={formControl} name="notes" label="Notas">
            {(field) => (
              <Textarea
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Detalles adicionales del material"
                className="min-h-24 resize-none"
              />
            )}
          </FormFieldWrapper>
        </CardContent>
      </Card>

      {/* Card 2: Stock y precios */}
      <Card className="rounded-xl border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold">
            Stock y precios
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Cantidades, unidades y costos de adquisicion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FormFieldWrapper
              control={formControl}
              name="quantity"
              label="Cantidad actual"
              required
            >
              {(field) => (
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              )}
            </FormFieldWrapper>

            <FormFieldWrapper
              control={formControl}
              name="unit"
              label="Unidad"
              required
            >
              {(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormFieldWrapper>

            <FormFieldWrapper
              control={formControl}
              name="minimum_stock"
              label="Stock minimo"
              required
            >
              {(field) => (
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              )}
            </FormFieldWrapper>

            <FormFieldWrapper
              control={formControl}
              name="unit_price"
              label="Precio unitario"
              required
            >
              {(field) => (
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="pl-7"
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </div>
              )}
            </FormFieldWrapper>
          </div>

          {/* Live stock preview */}
          <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Vista previa del stock
            </p>
            <StockIndicator
              quantity={quantityWatch ?? 0}
              minimumStock={minimumStockWatch ?? 0}
              unit={unitWatch ?? "yd"}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
          <Button
            asChild
            variant="outline"
            type="button"
            className="w-full sm:w-auto"
          >
            <Link
              href={mode === "create" ? "/inventory" : `/inventory/${itemId}`}
            >
              Cancelar
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : null}
            {mode === "create" ? "Crear material" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
