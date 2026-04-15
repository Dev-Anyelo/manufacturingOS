"use client"

import { z } from "zod"
import * as React from "react"
import Image from "next/image"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export function CatalogForm({ mode, itemId, defaultValues }: CatalogFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [imageFile, setImageFile] = React.useState<File | null>(null)
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

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileSelection(file: File | null) {
    if (!file) {
      return
    }

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
    if (!imageFile) {
      return
    }

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
        headers: {
          "Content-Type": "application/json",
        },
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
          result.error ?? "No se pudo guardar el item de catalogo."
        )
      }

      await uploadImage(result.data.id)

      toast.success(
        mode === "create"
          ? "Item de catalogo creado."
          : "Item de catalogo actualizado."
      )

      router.push(`/catalog/${result.data.id}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el item de catalogo."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="m-0 rounded-none border-none bg-transparent p-0 shadow-none">
      <CardHeader className="hidden border-none bg-none">
        <CardTitle>
          {mode === "create" ? "Nuevo item de catalogo" : "Editar item"}
        </CardTitle>
      </CardHeader>
      <CardContent className="m-0 space-y-4 border-none bg-transparent p-0 shadow-none">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagen del producto</p>
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center transition-colors hover:border-brand/60 hover:bg-muted/40"
              onDrop={(event) => {
                event.preventDefault()
                handleFileSelection(event.dataTransfer.files?.[0] ?? null)
              }}
              onDragOver={(event) => event.preventDefault()}
            >
              {previewUrl ? (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-background sm:w-64">
                  <Image
                    src={previewUrl}
                    alt="Preview de producto"
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
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-full bg-muted p-3">
                    <UploadIcon className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Arrastra una imagen o haz click para seleccionar
                  </p>
                </>
              )}

              <Input
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Seleccionar imagen del producto"
                onChange={(event) =>
                  handleFileSelection(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre
              </Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-danger text-xs">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="garment_type" className="text-sm font-medium">
                Tipo de prenda
              </Label>
              <Input
                id="garment_type"
                {...form.register("garment_type")}
                placeholder="Ej: Camisa"
              />
              {form.formState.errors.garment_type ? (
                <p className="text-danger text-xs">
                  {form.formState.errors.garment_type.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_cost" className="text-sm font-medium">
                Costo estimado
              </Label>
              <Input
                id="estimated_cost"
                type="number"
                min={0}
                step="0.01"
                {...form.register("estimated_cost", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="market_price_unit"
                className="text-sm font-medium"
              >
                Precio mercado unitario
              </Label>
              <Input
                id="market_price_unit"
                type="number"
                min={0}
                step="0.01"
                {...form.register("market_price_unit", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="market_price_dozen"
                className="text-sm font-medium"
              >
                Precio mercado docena
              </Label>
              <Input
                id="market_price_dozen"
                type="number"
                min={0}
                step="0.01"
                {...form.register("market_price_dozen", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="our_price_unit" className="text-sm font-medium">
                Nuestro precio unitario
              </Label>
              <Input
                id="our_price_unit"
                type="number"
                min={0}
                step="0.01"
                {...form.register("our_price_unit", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="our_price_dozen" className="text-sm font-medium">
                Nuestro precio docena
              </Label>
              <Input
                id="our_price_dozen"
                type="number"
                min={0}
                step="0.01"
                {...form.register("our_price_dozen", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripcion
              </Label>
              <Textarea
                id="description"
                className="min-h-20"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notas internas
              </Label>
              <Textarea
                id="notes"
                className="min-h-20"
                {...form.register("notes")}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/catalog")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand text-brand-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              Guardar producto
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
