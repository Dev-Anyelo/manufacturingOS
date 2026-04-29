"use client"

import { z } from "zod"
import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { MetricCard } from "@/components/shared/metric-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Loader2,
  Upload,
  X,
  Package,
  DollarSign,
  FileText,
  Sparkles,
  ImageIcon,
  Save,
  ArrowUpDown,
} from "lucide-react"

const catalogFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().trim().max(1000).optional().nullable(),
  garment_type: z.string().trim().min(2, "El tipo de prenda es obligatorio"),
  market_price_unit: z.coerce.number().gt(0),
  market_price_dozen: z.coerce.number().gt(0).optional().nullable(),
  our_price_unit: z.coerce.number().gt(0),
  our_price_dozen: z.coerce.number().gt(0).optional().nullable(),
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

type CatalogFormInput = z.input<typeof catalogFormSchema>
type CatalogFormOutput = z.output<typeof catalogFormSchema>

interface CatalogFormProps {
  mode: "create" | "edit"
  itemId?: string
  defaultValues?: Partial<CatalogFormOutput> & { image_url?: string | null }
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function CatalogForm({ mode, itemId, defaultValues }: CatalogFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    defaultValues?.image_url ?? null
  )

  const form = useForm<CatalogFormInput, unknown, CatalogFormOutput>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      garment_type: defaultValues?.garment_type ?? "",
      market_price_unit: defaultValues?.market_price_unit ?? 0,
      market_price_dozen: defaultValues?.market_price_dozen ?? null,
      our_price_unit: defaultValues?.our_price_unit ?? 0,
      our_price_dozen: defaultValues?.our_price_dozen ?? null,
      estimated_cost: defaultValues?.estimated_cost ?? null,
      notes: defaultValues?.notes ?? "",
    },
  })

  const watchedCost = (form.watch("estimated_cost") as number) ?? 0
  const watchedOurPrice = (form.watch("our_price_unit") as number) ?? 0
  const profitMargin =
    watchedOurPrice > 0 && watchedCost > 0
      ? (((watchedOurPrice - watchedCost) / watchedOurPrice) * 100).toFixed(1)
      : null

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

  async function uploadImage(targetId: string) {
    if (!imageFile) return

    const formData = new FormData()
    formData.append("file", imageFile)

    const response = await fetch(`/api/catalog/${targetId}/image`, {
      method: "POST",
      body: formData,
    })

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "No se pudo subir la imagen.")
    }
  }

  async function onSubmit(values: CatalogFormOutput) {
    setIsSubmitting(true)

    try {
      const endpoint =
        mode === "create" ? "/api/catalog" : `/api/catalog/${itemId}`
      const method = mode === "create" ? "POST" : "PATCH"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          description: normalizeOptional(values.description),
          garment_type: values.garment_type.trim(),
          market_price_unit: values.market_price_unit,
          market_price_dozen: values.market_price_dozen,
          our_price_unit: values.our_price_unit,
          our_price_dozen: values.our_price_dozen,
          estimated_cost: values.estimated_cost,
          image_url: defaultValues?.image_url ?? null,
          notes: normalizeOptional(values.notes),
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
        data?: { id: string }
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error ?? "No se pudo guardar el item de catálogo."
        )
      }

      await uploadImage(result.data.id)

      toast.success(
        mode === "create"
          ? "Producto agregado al catálogo"
          : "Producto actualizado correctamente"
      )

      router.push(`/catalog/${result.data.id}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el item de catálogo."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto w-full"
      noValidate
    >
      {/* Quick Stats Bar */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard
          icon={<Package className="size-4" />}
          label="Precio de mercado"
          value={
            form.watch("market_price_unit")
              ? formatCurrency(form.watch("market_price_unit") as number)
              : "N/A"
          }
          accent="default"
        />
        <MetricCard
          icon={<DollarSign className="size-4" />}
          label="Nuestro precio"
          value={
            form.watch("our_price_unit")
              ? formatCurrency(form.watch("our_price_unit") as number)
              : "N/A"
          }
          accent="brand"
        />
        <MetricCard
          label="Costo estimado"
          value={
            form.watch("estimated_cost")
              ? formatCurrency(form.watch("estimated_cost") as number)
              : "N/A"
          }
          accent="success"
          icon={<Sparkles className="size-4" />}
        />
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="info" className="gap-2">
            <Package className="size-4" />
            <span className="hidden sm:inline">Información</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="size-4" />
            <span className="hidden sm:inline">Precios</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <ImageIcon className="size-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre del producto{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Ej: Camisa Oxford Premium"
                  className="h-11"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="garment_type" className="text-sm font-medium">
                  Tipo de prenda <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="garment_type"
                  {...form.register("garment_type")}
                  placeholder="Ej: Camisa"
                  className="h-11"
                />
                {form.formState.errors.garment_type && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.garment_type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_cost" className="text-sm font-medium">
                  Costo estimado
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="estimated_cost"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("estimated_cost", {
                      valueAsNumber: true,
                    })}
                    className="h-11 pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Describe las características del producto..."
                  {...form.register("description")}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="notes"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <FileText className="size-3.5" />
                  Notas internas
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Información privada, instrucciones..."
                  {...form.register("notes")}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="space-y-6">
              {/* Market Prices */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    M
                  </span>
                  <span className="text-sm font-medium">Precio de mercado</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="market_price_unit"
                      className="text-sm font-medium"
                    >
                      Unitario <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="market_price_unit"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("market_price_unit", {
                          valueAsNumber: true,
                        })}
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="market_price_dozen"
                      className="text-sm font-medium"
                    >
                      Por docena
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="market_price_dozen"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("market_price_dozen", {
                          valueAsNumber: true,
                        })}
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Our Prices */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    N
                  </span>
                  <span className="text-sm font-medium">Nuestro precio</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="our_price_unit"
                      className="text-sm font-medium"
                    >
                      Unitario <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="our_price_unit"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("our_price_unit", {
                          valueAsNumber: true,
                        })}
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="our_price_dozen"
                      className="text-sm font-medium"
                    >
                      Por docena
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="our_price_dozen"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("our_price_dozen", {
                          valueAsNumber: true,
                        })}
                        className="h-11 pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit Summary */}
              <div className="rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <ArrowUpDown className="size-4" />
                  <span className="text-sm font-medium">
                    Margen de ganancia
                  </span>
                </div>
                <p className="mt-1 text-base font-bold">
                  {profitMargin ? `${profitMargin}%` : "Ingresa precios"}
                </p>
                {profitMargin && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ganancia: {formatCurrency(watchedOurPrice - watchedCost)}{" "}
                    por unidad
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <Label
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
                "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-all",
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-border bg-muted/30 hover:border-accent/50 hover:bg-muted/50"
              )}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-xs">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={previewUrl}
                      alt="Preview del producto"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 size-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.preventDefault()
                      setImageFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-4">
                    <Upload className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Arrastra una imagen o haz click para seleccionar
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
            </Label>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-3 flex w-full items-center justify-end gap-2 md:mt-5">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
