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
import { useSystemSettings } from "@/hooks/use-system-settings"
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

import { Currency } from "@prisma/client"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import {
  formatCurrencyNI,
  getCurrencySymbol,
  convertAmount,
} from "@/lib/currency/exchange"
import { useSettingsStore } from "@/stores/settingsStore"

const catalogFormSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().trim().max(1000).optional().nullable(),
  garment_type: z.string().trim().min(2, "El tipo de prenda es obligatorio"),

  market_price_unit: z.coerce.number().min(0),
  market_price_unit_currency: z.nativeEnum(Currency),

  market_price_dozen: z.coerce.number().min(0).optional().nullable(),
  market_price_dozen_currency: z.nativeEnum(Currency),

  our_price_unit: z.coerce.number().min(0),
  our_price_unit_currency: z.nativeEnum(Currency),

  our_price_dozen: z.coerce.number().min(0).optional().nullable(),
  our_price_dozen_currency: z.nativeEnum(Currency),

  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  estimated_cost_currency: z.nativeEnum(Currency),

  sale_price: z.coerce.number().min(0).default(0),
  sale_price_currency: z.nativeEnum(Currency),

  notes: z.string().trim().max(1000).optional().nullable(),
})

type CatalogFormInput = z.input<typeof catalogFormSchema>
type CatalogFormOutput = z.output<typeof catalogFormSchema>

interface CatalogFormProps {
  mode: "create" | "edit"
  itemId?: string
  defaultValues?: Partial<CatalogFormInput> & { image_url?: string | null }
  /** Called after successful submission — used when embedded in a Sheet */
  onSuccess?: () => void
  /** Called when the user cancels — used when embedded in a Sheet */
  onCancel?: () => void
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

// Eliminado formatCurrency interno, se usa exchange.ts

export function CatalogForm({
  mode,
  itemId,
  defaultValues,
  onSuccess,
  onCancel,
}: CatalogFormProps) {
  const router = useRouter()
  const { baseCurrency, isLoading: settingsLoading } = useSystemSettings()
  const { exchangeRate } = useSettingsStore()
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
      sale_price: defaultValues?.sale_price ?? 0,
    },
  })

  const watchedCost = (form.watch("estimated_cost") as number) ?? 0
  const watchedCostCurrency =
    form.watch("estimated_cost_currency") || Currency.USD
  const watchedOurPrice = (form.watch("our_price_unit") as number) ?? 0
  const watchedOurPriceCurrency =
    form.watch("our_price_unit_currency") || Currency.USD

  // Convert cost to price currency for accurate margin calculation
  const normalizedCost = convertAmount(
    watchedCost,
    watchedCostCurrency,
    watchedOurPriceCurrency,
    exchangeRate
  )

  const profitMargin =
    watchedOurPrice > 0 && watchedCost > 0
      ? (((watchedOurPrice - normalizedCost) / watchedOurPrice) * 100).toFixed(
          1
        )
      : null

  React.useEffect(() => {
    if (baseCurrency && !form.getValues("sale_price_currency")) {
      form.setValue("market_price_unit_currency", baseCurrency)
      form.setValue("market_price_dozen_currency", baseCurrency)
      form.setValue("our_price_unit_currency", baseCurrency)
      form.setValue("our_price_dozen_currency", baseCurrency)
      form.setValue("estimated_cost_currency", baseCurrency)
      form.setValue("sale_price_currency", baseCurrency)
    }
  }, [baseCurrency, form])

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
          market_price_unit_currency: values.market_price_unit_currency,
          market_price_dozen: values.market_price_dozen,
          market_price_dozen_currency: values.market_price_dozen_currency,
          our_price_unit: values.our_price_unit,
          our_price_unit_currency: values.our_price_unit_currency,
          our_price_dozen: values.our_price_dozen,
          our_price_dozen_currency: values.our_price_dozen_currency,
          estimated_cost: values.estimated_cost,
          estimated_cost_currency: values.estimated_cost_currency,
          sale_price: values.our_price_unit, // Por defecto el unitario es el de venta
          sale_price_currency: values.our_price_unit_currency,
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

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/catalog/${result.data.id}`)
        router.refresh()
      }
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
      {/* Quick Stats Bar - Compact Info Bar */}
      <div className="mb-4 flex items-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
        {[
          {
            label: "Mercado",
            amount: Number(form.watch("market_price_unit") || 0),
            currency:
              (form.watch("market_price_unit_currency") as Currency) ||
              Currency.USD,
          },
          {
            label: "Nuestro precio",
            amount: Number(form.watch("our_price_unit") || 0),
            currency:
              (form.watch("our_price_unit_currency") as Currency) ||
              Currency.USD,
          },
          {
            label: "Costo est.",
            amount: Number(form.watch("estimated_cost") || 0),
            currency:
              (form.watch("estimated_cost_currency") as Currency) ||
              Currency.USD,
          },
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
              <CurrencyDisplay
                amount={item.amount}
                currency={item.currency}
                size="sm"
              />
            </div>
          </div>
        ))}
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
          <div className="m-0 border-none bg-none p-0">
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
                <div className="flex gap-2">
                  <CurrencySelector
                    value={
                      form.watch("estimated_cost_currency") || Currency.USD
                    }
                    onChange={(val) =>
                      form.setValue("estimated_cost_currency", val)
                    }
                  />
                  <Input
                    id="estimated_cost"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("estimated_cost", {
                      valueAsNumber: true,
                    })}
                    className="h-11"
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
          <div className="m-0 border-none bg-none p-0">
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
                    <div className="flex gap-2">
                      <CurrencySelector
                        value={
                          form.watch("market_price_unit_currency") ||
                          Currency.USD
                        }
                        onChange={(val) =>
                          form.setValue("market_price_unit_currency", val)
                        }
                      />
                      <Input
                        id="market_price_unit"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("market_price_unit", {
                          valueAsNumber: true,
                        })}
                        className="h-11"
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
                    <div className="flex gap-2">
                      <CurrencySelector
                        value={
                          form.watch("market_price_dozen_currency") ||
                          Currency.USD
                        }
                        onChange={(val) =>
                          form.setValue("market_price_dozen_currency", val)
                        }
                      />
                      <Input
                        id="market_price_dozen"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("market_price_dozen", {
                          valueAsNumber: true,
                        })}
                        className="h-11"
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
                    <div className="flex gap-2">
                      <CurrencySelector
                        value={
                          form.watch("our_price_unit_currency") || Currency.USD
                        }
                        onChange={(val) =>
                          form.setValue("our_price_unit_currency", val)
                        }
                      />
                      <Input
                        id="our_price_unit"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("our_price_unit", {
                          valueAsNumber: true,
                        })}
                        className="h-11"
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
                    <div className="flex gap-2">
                      <CurrencySelector
                        value={
                          form.watch("our_price_dozen_currency") || Currency.USD
                        }
                        onChange={(val) =>
                          form.setValue("our_price_dozen_currency", val)
                        }
                      />
                      <Input
                        id="our_price_dozen"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        {...form.register("our_price_dozen", {
                          valueAsNumber: true,
                        })}
                        className="h-11"
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
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase">
                      Ganancia por unidad:
                    </span>
                    <CurrencyDisplay
                      amount={watchedOurPrice - normalizedCost}
                      currency={
                        form.watch("our_price_unit_currency") || Currency.USD
                      }
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
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

      <div className="mt-3 flex w-full items-center justify-center gap-2 md:mt-5">
        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
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
