"use client"

import * as React from "react"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import {
  CalendarDaysIcon,
  Loader2Icon,
  PlusIcon,
  RulerIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CustomerSelector } from "@/components/modules/sales/customer-selector"
import type { PosCustomer } from "@/components/modules/sales/types"

const channelOptions = [
  { value: "in_person", label: "En tienda" },
  { value: "referral", label: "Referido" },
  { value: "social_media", label: "Redes sociales" },
  { value: "returning_customer", label: "Cliente recurrente" },
  { value: "other", label: "Otro" },
] as const

const lineSchema = z.object({
  catalog_item_id: z.string().optional().nullable(),
  description: z
    .string()
    .trim()
    .min(2, "La descripcion debe tener al menos 2 caracteres"),
  size: z.string().trim().max(30).optional().nullable(),
  inventory_item_id: z.string().optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  design_notes: z.string().trim().max(1000).optional().nullable(),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "La cantidad debe ser mayor o igual a 1"),
  unit_price: z.coerce
    .number()
    .min(0, "El precio unitario no puede ser negativo"),
  measurements: z
    .object({
      bust: z.coerce.number().positive().optional(),
      waist: z.coerce.number().positive().optional(),
      hips: z.coerce.number().positive().optional(),
      length: z.coerce.number().positive().optional(),
      sleeve: z.coerce.number().positive().optional(),
    })
    .optional()
    .nullable(),
})

const orderFormSchema = z.object({
  customer_id: z.string().uuid("Selecciona un cliente valido"),
  delivery_date: z.string().min(1, "La fecha de entrega es obligatoria"),
  channel: z.enum([
    "in_person",
    "referral",
    "social_media",
    "returning_customer",
    "other",
  ]),
  advance_paid: z.coerce.number().min(0, "El adelanto no puede ser negativo"),
  total: z.coerce.number().min(0, "El total no puede ser negativo"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(lineSchema).min(1, "Debes agregar al menos un item"),
})

type OrderFormValues = z.infer<typeof orderFormSchema>
type OrderFormInput = z.input<typeof orderFormSchema>
type OrderFormOutput = z.output<typeof orderFormSchema>

type MeasurementMode = "standard" | "exact"

type CatalogChoice = {
  id: string
  name: string
  garmentType: string | null
  salePrice: number
}

type InventoryChoice = {
  id: string
  name: string
  unit: string
  quantity: number
}

interface OrderFormProps {
  customers: PosCustomer[]
  catalogItems: CatalogChoice[]
  inventoryItems: InventoryChoice[]
}

function getEmptyLine(): OrderFormValues["items"][number] {
  return {
    catalog_item_id: null,
    description: "",
    size: "",
    inventory_item_id: null,
    color: "",
    design_notes: "",
    quantity: 1,
    unit_price: 0,
    measurements: null,
  }
}

function toNullableString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizeMeasurements(
  mode: MeasurementMode,
  measurements?: Record<string, unknown> | null
) {
  if (mode === "standard" || !measurements) {
    return null
  }

  const entries = Object.entries(measurements).filter(([, value]) => {
    return typeof value === "number" && Number.isFinite(value)
  })

  if (entries.length === 0) {
    return null
  }

  return Object.fromEntries(entries)
}

export function OrderForm({
  customers,
  catalogItems,
  inventoryItems,
}: OrderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [referenceFiles, setReferenceFiles] = React.useState<File[]>([])
  const [measurementModes, setMeasurementModes] = React.useState<
    Record<string, MeasurementMode>
  >({})

  const form = useForm<OrderFormInput, unknown, OrderFormOutput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: "",
      delivery_date: "",
      channel: "in_person",
      advance_paid: 0,
      total: 0,
      notes: "",
      items: [getEmptyLine()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  const watchedCustomerId = form.watch("customer_id")
  const watchedAdvance = form.watch("advance_paid")
  const watchedTotal = form.watch("total")

  const selectedCustomer = React.useMemo(
    () =>
      customers.find((customer) => customer.id === watchedCustomerId) ?? null,
    [customers, watchedCustomerId]
  )

  const estimatedTotal = React.useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      return acc + Number(item.quantity || 0) * Number(item.unit_price || 0)
    }, 0)
  }, [watchedItems])

  function handleCatalogChange(index: number, catalogItemId: string) {
    form.setValue(`items.${index}.catalog_item_id`, catalogItemId, {
      shouldValidate: true,
    })

    const selected = catalogItems.find((item) => item.id === catalogItemId)

    if (!selected) {
      return
    }

    form.setValue(`items.${index}.description`, selected.name, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue(`items.${index}.unit_price`, selected.salePrice, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleReferenceImages(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])

    if (selected.length === 0) {
      setReferenceFiles([])
      return
    }

    setReferenceFiles(selected.slice(0, 3))

    if (selected.length > 3) {
      toast.info("Solo se conservaran las primeras 3 imagenes.")
    }
  }

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true)

    try {
      const payload = {
        customer_id: values.customer_id,
        delivery_date: new Date(`${values.delivery_date}T00:00:00`),
        channel: values.channel,
        advance_paid: Number(values.advance_paid),
        total: Number(values.total),
        notes: toNullableString(values.notes),
        items: values.items.map((item, index) => ({
          catalog_item_id: toNullableString(item.catalog_item_id),
          description: item.description.trim(),
          size: toNullableString(item.size),
          inventory_item_id: toNullableString(item.inventory_item_id),
          color: toNullableString(item.color),
          design_notes: toNullableString(item.design_notes),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          measurements: normalizeMeasurements(
            measurementModes[fields[index].id] ?? "standard",
            item.measurements
          ),
        })),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
        data?: { id: string }
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "No se pudo crear el pedido.")
      }

      if (referenceFiles.length > 0) {
        toast.info(
          "Pedido creado. La carga de imagenes de referencia se integra en la siguiente iteracion."
        )
      }

      toast.success("Pedido creado correctamente.")
      router.push(`/orders/${result.data.id}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el pedido."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <CustomerSelector
              customers={customers}
              value={selectedCustomer}
              onChange={(customer) => {
                form.setValue("customer_id", customer?.id ?? "", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
            />
            {form.formState.errors.customer_id ? (
              <p className="text-danger text-xs">
                {form.formState.errors.customer_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_date" className="text-sm font-medium">
              Fecha de entrega
            </Label>
            <div className="relative">
              <CalendarDaysIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="delivery_date"
                type="date"
                className="pl-8"
                {...form.register("delivery_date")}
              />
            </div>
            {form.formState.errors.delivery_date ? (
              <p className="text-danger text-xs">
                {form.formState.errors.delivery_date.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Canal</Label>
            <Select
              value={form.watch("channel")}
              onValueChange={(value) =>
                form.setValue("channel", value as OrderFormValues["channel"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona canal" />
              </SelectTrigger>
              <SelectContent>
                {channelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advance_paid" className="text-sm font-medium">
              Anticipo
            </Label>
            <Input
              id="advance_paid"
              type="number"
              min={0}
              step="0.01"
              {...form.register("advance_paid")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total" className="text-sm font-medium">
              Total del pedido
            </Label>
            <Input
              id="total"
              type="number"
              min={0}
              step="0.01"
              {...form.register("total")}
            />
            <p className="text-xs text-muted-foreground">
              Sugerido por lineas:{" "}
              <CurrencyDisplay amount={estimatedTotal} size="sm" />
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas generales
            </Label>
            <Textarea
              id="notes"
              className="min-h-24"
              placeholder="Observaciones del pedido, preferencias y detalles generales..."
              {...form.register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prendas del pedido</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(getEmptyLine())}
          >
            <PlusIcon className="size-4" />
            Agregar linea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const mode = measurementModes[field.id] ?? "standard"
            const itemErrors = form.formState.errors.items?.[index]

            return (
              <div
                key={field.id}
                className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Linea #{index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Catalogo (opcional)
                    </Label>
                    <Select
                      value={
                        form.watch(`items.${index}.catalog_item_id`) ?? "none"
                      }
                      onValueChange={(value) =>
                        handleCatalogChange(
                          index,
                          value === "none" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar prenda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin catalogo</SelectItem>
                        {catalogItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Material (opcional)
                    </Label>
                    <Select
                      value={
                        form.watch(`items.${index}.inventory_item_id`) ?? "none"
                      }
                      onValueChange={(value) =>
                        form.setValue(
                          `items.${index}.inventory_item_id`,
                          value === "none" ? null : value,
                          { shouldDirty: true }
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin material</SelectItem>
                        {inventoryItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} - {item.quantity} {item.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Descripcion</Label>
                    <Input {...form.register(`items.${index}.description`)} />
                    {itemErrors?.description ? (
                      <p className="text-danger text-xs">
                        {itemErrors.description.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Color</Label>
                    <Input {...form.register(`items.${index}.color`)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Talla</Label>
                    <Input {...form.register(`items.${index}.size`)} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      {...form.register(`items.${index}.quantity`)}
                    />
                    {itemErrors?.quantity ? (
                      <p className="text-danger text-xs">
                        {itemErrors.quantity.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Precio unitario
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register(`items.${index}.unit_price`)}
                    />
                    {itemErrors?.unit_price ? (
                      <p className="text-danger text-xs">
                        {itemErrors.unit_price.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">
                      Notas de diseno
                    </Label>
                    <Textarea
                      className="min-h-20"
                      {...form.register(`items.${index}.design_notes`)}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border/60 bg-background p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <RulerIcon className="size-4 text-muted-foreground" />
                    Medidas
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === "standard" ? "default" : "outline"}
                      onClick={() =>
                        setMeasurementModes((prev) => ({
                          ...prev,
                          [field.id]: "standard",
                        }))
                      }
                      className={cn(
                        mode === "standard"
                          ? "bg-brand text-brand-foreground"
                          : ""
                      )}
                    >
                      Talla estandar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === "exact" ? "default" : "outline"}
                      onClick={() =>
                        setMeasurementModes((prev) => ({
                          ...prev,
                          [field.id]: "exact",
                        }))
                      }
                      className={cn(
                        mode === "exact" ? "bg-brand text-brand-foreground" : ""
                      )}
                    >
                      Medidas exactas
                    </Button>
                  </div>

                  {mode === "exact" ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Busto"
                        {...form.register(`items.${index}.measurements.bust`)}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Cintura"
                        {...form.register(`items.${index}.measurements.waist`)}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Cadera"
                        {...form.register(`items.${index}.measurements.hips`)}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Largo"
                        {...form.register(`items.${index}.measurements.length`)}
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Manga"
                        {...form.register(`items.${index}.measurements.sleeve`)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Imagenes de referencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block cursor-pointer rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
            <UploadIcon className="mx-auto mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Sube hasta 3 imagenes</p>
            <p className="text-xs text-muted-foreground">PNG o JPG</p>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleReferenceImages}
            />
          </label>

          {referenceFiles.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {referenceFiles.map((file) => (
                <div
                  key={file.name}
                  className="truncate rounded-lg border border-border/60 bg-background px-3 py-2 text-xs"
                >
                  {file.name}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-muted/20">
        <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <p>
              Saldo pendiente estimado:{" "}
              <CurrencyDisplay
                amount={Math.max(
                  Number(watchedTotal || 0) - Number(watchedAdvance || 0),
                  0
                )}
                size="sm"
              />
            </p>
          </div>

          <Button
            type="submit"
            className="bg-brand text-brand-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Creando pedido...
              </>
            ) : (
              "Crear pedido"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
