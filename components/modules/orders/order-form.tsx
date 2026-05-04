"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, type FieldPath } from "react-hook-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerSelector } from "@/components/modules/sales/customer-selector"
import type { PosCustomer } from "@/components/modules/sales/types"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { Currency } from "@prisma/client"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { cn } from "@/lib/utils"
import { formatCurrencyNI, getCurrencySymbol, calculateBalanceDue } from "@/lib/currency/exchange"
import { useSettingsStore } from "@/stores/settingsStore"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Loader2,
  Calendar as CalendarIcon,
  User,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Store,
  Share2,
  MessageCircle,
  RotateCcw,
  MoreHorizontal,
  ChevronDown,
  Ruler,
  Save,
} from "lucide-react"

// Using PosCustomer from @/components/modules/sales/types

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

const channelOptions = [
  { value: "in_person", label: "Tienda", icon: Store },
  { value: "referral", label: "Referido", icon: Share2 },
  { value: "social_media", label: "Redes", icon: MessageCircle },
  { value: "returning_customer", label: "Recurrente", icon: RotateCcw },
  { value: "other", label: "Otro", icon: MoreHorizontal },
] as const

const lineSchema = z.object({
  catalog_item_id: z.string().optional().nullable(),
  description: z
    .string()
    .trim()
    .min(2, "La descripción debe tener al menos 2 caracteres"),
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
  unit_price_currency: z.nativeEnum(Currency),
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
  customer_id: z.string().uuid("Selecciona un cliente válido"),
  delivery_date: z.string().min(1, "La fecha de entrega es obligatoria"),
  channel: z.enum([
    "in_person",
    "referral",
    "social_media",
    "returning_customer",
    "other",
  ]),
  advance_paid: z.coerce.number().min(0, "El adelanto no puede ser negativo"),
  advance_paid_currency: z.nativeEnum(Currency),
  total: z.coerce.number().min(0, "El total no puede ser negativo"),
  total_currency: z.nativeEnum(Currency),
  balance_due_currency: z.nativeEnum(Currency),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(lineSchema).min(1, "Debes agregar al menos un item"),
})

type OrderFormValues = z.infer<typeof orderFormSchema>
type OrderFormInput = z.input<typeof orderFormSchema>
type OrderFormOutput = z.output<typeof orderFormSchema>
type MeasurementMode = "standard" | "exact"

interface OrderFormProps {
  customers: PosCustomer[]
  catalogItems: CatalogChoice[]
  inventoryItems: InventoryChoice[]
  /** Called after successful submission — used when embedded in a Sheet */
  onSuccess?: () => void
  /** Called when the user cancels — used when embedded in a Sheet */
  onCancel?: () => void
}

function getEmptyLine(currency?: Currency): OrderFormValues["items"][number] {
  return {
    catalog_item_id: null,
    description: "",
    size: "",
    inventory_item_id: null,
    color: "",
    design_notes: "",
    quantity: 1,
    unit_price: 0,
    unit_price_currency: currency || (Currency.USD as Currency),
    measurements: null,
  }
}

function toNullableString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function formatDateLabel(value: string) {
  if (!value) return "Seleccionar"

  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
  }).format(parseInputDate(value))
}

function normalizeMeasurements(
  mode: MeasurementMode,
  measurements?: Record<string, unknown> | null
) {
  if (mode === "standard" || !measurements) return null

  const entries = Object.entries(measurements).filter(([, value]) => {
    return typeof value === "number" && Number.isFinite(value)
  })

  if (entries.length === 0) return null
  return Object.fromEntries(entries)
}

export function OrderForm({
  customers,
  catalogItems,
  inventoryItems,
  onSuccess,
  onCancel,
}: OrderFormProps) {
  const router = useRouter()
  const { baseCurrency } = useSystemSettings()
  const { exchangeRate } = useSettingsStore()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [measurementModes, setMeasurementModes] = React.useState<
    Record<string, MeasurementMode>
  >({})
  const [expandedItems, setExpandedItems] = React.useState<
    Record<string, boolean>
  >({})

  const form = useForm<OrderFormInput, unknown, OrderFormOutput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: "",
      delivery_date: "",
      channel: "in_person",
      advance_paid: 0,
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
  const watchedDeliveryDate = form.watch("delivery_date")

  React.useEffect(() => {
    if (baseCurrency && !form.getValues("total_currency")) {
      form.setValue("advance_paid_currency", baseCurrency)
      form.setValue("total_currency", baseCurrency)
      form.setValue("balance_due_currency", baseCurrency)
      
      // Update first item currency
      const items = form.getValues("items")
      if (items.length > 0 && !items[0].unit_price_currency) {
        form.setValue("items.0.unit_price_currency", baseCurrency)
      }
    }
  }, [baseCurrency, form])

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === watchedCustomerId) ?? null,
    [customers, watchedCustomerId]
  )

  const estimatedTotal = React.useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      return acc + Number(item.quantity || 0) * Number(item.unit_price || 0)
    }, 0)
  }, [watchedItems])

  const orderCurrency = form.watch("total_currency")

  const totalUnits = React.useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0
    )
  }, [watchedItems])

  const pendingBalance = calculateBalanceDue(
    Number(watchedTotal || 0),
    form.watch("total_currency") || Currency.USD,
    Number(watchedAdvance || 0),
    form.watch("advance_paid_currency") || Currency.USD,
    exchangeRate
  )

  // Sync item and advance currencies when order currency changes
  React.useEffect(() => {
    form.setValue("advance_paid_currency", orderCurrency)
    form.setValue("balance_due_currency", orderCurrency)
    watchedItems.forEach((_, index) => {
      form.setValue(`items.${index}.unit_price_currency`, orderCurrency)
    })
  }, [orderCurrency, watchedItems.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCatalogChange(index: number, catalogItemId: string) {
    form.setValue(`items.${index}.catalog_item_id`, catalogItemId, {
      shouldValidate: true,
    })

    const selected = catalogItems.find((item) => item.id === catalogItemId)
    if (!selected) return

    form.setValue(`items.${index}.description`, selected.name, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue(`items.${index}.unit_price`, selected.salePrice, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true)

    try {
      const payload = {
        customer_id: values.customer_id,
        delivery_date: parseInputDate(values.delivery_date),
        channel: values.channel,
        advance_paid: Number(values.advance_paid),
        advance_paid_currency: values.advance_paid_currency,
        total: Number(values.total),
        total_currency: values.total_currency,
        balance_due_currency: values.balance_due_currency,
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
          unit_price_currency: item.unit_price_currency,
          measurements: normalizeMeasurements(
            measurementModes[fields[index].id] ?? "standard",
            item.measurements
          ),
        })),
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      toast.success("Pedido creado correctamente")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/orders/${result.data.id}`)
        router.refresh()
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el pedido."
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
      {/* Summary Stats - Compact Info Bar */}
      <div className="mb-4 flex items-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
        {[
          { label: "Total", amount: estimatedTotal },
          { label: "Unidades", value: totalUnits.toString() },
          { label: "Saldo", amount: pendingBalance },
          {
            label: "Entrega",
            value: watchedDeliveryDate
              ? formatDateLabel(watchedDeliveryDate)
              : "N/A",
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
              {"amount" in item ? (
                <CurrencyDisplay 
                  amount={Number(item.amount || 0)} 
                  currency={(orderCurrency as Currency) || Currency.USD}
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
      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="customer" className="gap-1.5 text-xs sm:text-sm">
            <User className="size-3.5" />
            Cliente
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-1.5 text-xs sm:text-sm">
            <Package className="size-3.5" />
            Artículos ({fields.length})
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1.5 text-xs sm:text-sm">
            <DollarSign className="size-3.5" />
            Pago
          </TabsTrigger>
        </TabsList>

        {/* Customer Tab */}
        <TabsContent value="customer" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="space-y-4">
              {/* Customer Selector */}
              <div className="space-y-2">
                <CustomerSelector
                  customers={customers}
                  value={selectedCustomer || null}
                  onChange={(customer) => {
                    form.setValue("customer_id", customer?.id || "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }}
                />
                {form.formState.errors.customer_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.customer_id.message}
                  </p>
                )}
              </div>

              {/* Date + Channel */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Fecha de entrega
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {formatDateLabel(watchedDeliveryDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          watchedDeliveryDate
                            ? parseInputDate(watchedDeliveryDate)
                            : undefined
                        }
                        onSelect={(date: Date | undefined) => {
                          if (!date) return
                          form.setValue("delivery_date", toInputDate(date), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.delivery_date && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.delivery_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Canal</Label>
                  <Select
                    value={form.watch("channel")}
                    onValueChange={(value) =>
                      form.setValue(
                        "channel",
                        value as OrderFormValues["channel"],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {channelOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="size-4 text-muted-foreground" />
                              {option.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas del pedido
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Instrucciones especiales..."
                  {...form.register("notes")}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10 dark:bg-accent">
                  <Package className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  {fields.length} artículo{fields.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(getEmptyLine())}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Agregar
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const itemSubtotal =
                  Number(form.watch(`items.${index}.quantity`) || 0) *
                  Number(form.watch(`items.${index}.unit_price`) || 0)
                const isExpanded = expandedItems[field.id] ?? false

                return (
                  <Collapsible
                    key={field.id}
                    open={isExpanded}
                    onOpenChange={(open) =>
                      setExpandedItems((prev) => ({
                        ...prev,
                        [field.id]: open,
                      }))
                    }
                  >
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      {/* Item Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-md bg-accent/10 text-xs font-bold dark:bg-accent">
                            {index + 1}
                          </span>
                          <div>
                            <p className="max-w-37.5 truncate text-sm font-medium sm:max-w-50">
                              {form.watch(`items.${index}.description`) ||
                                "Sin descripción"}
                            </p>
                            <div className="mt-0.5">
                              <CurrencyDisplay 
                                amount={Number(itemSubtotal || 0)} 
                                currency={(orderCurrency as Currency) || Currency.USD}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                            >
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                            className="size-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Compact Fields - Always Visible */}
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Producto
                          </Label>
                          <Select
                            value={
                              form.watch(`items.${index}.catalog_item_id`) ||
                              "custom"
                            }
                            onValueChange={(value) => {
                              if (value === "custom") {
                                form.setValue(
                                  `items.${index}.catalog_item_id`,
                                  null
                                )
                              } else {
                                handleCatalogChange(index, value)
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 w-full text-xs">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">
                                Personalizado
                              </SelectItem>
                              {catalogItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} - {getCurrencySymbol(Currency.USD)}{item.salePrice}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Cant.
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            {...form.register(`items.${index}.quantity`, {
                              valueAsNumber: true,
                            })}
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Precio
                          </Label>
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-[10px] font-bold text-muted-foreground">
                              {getCurrencySymbol(orderCurrency || Currency.USD)}
                            </span>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              {...form.register(`items.${index}.unit_price`, {
                                valueAsNumber: true,
                              })}
                              className="h-9 pl-6 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <CollapsibleContent className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Descripción
                            </Label>
                            <Input
                              {...form.register(`items.${index}.description`)}
                              placeholder="Descripción"
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Talla
                            </Label>
                            <Input
                              {...form.register(`items.${index}.size`)}
                              placeholder="S, M, L..."
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Color
                            </Label>
                            <Input
                              {...form.register(`items.${index}.color`)}
                              placeholder="Color"
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">
                              Material
                            </Label>
                            <Select
                              value={
                                form.watch(
                                  `items.${index}.inventory_item_id`
                                ) || "none"
                              }
                              onValueChange={(value) =>
                                form.setValue(
                                  `items.${index}.inventory_item_id`,
                                  value === "none" ? null : value
                                )
                              }
                            >
                              <SelectTrigger className="h-9 w-full text-xs">
                                <SelectValue placeholder="Ninguno" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Ninguno</SelectItem>
                                {inventoryItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Design Notes */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Notas de diseño
                          </Label>
                          <Textarea
                            {...form.register(`items.${index}.design_notes`)}
                            placeholder="Instrucciones especiales para este artículo..."
                            rows={2}
                            className="resize-none text-xs"
                          />
                        </div>

                        {/* Measurements Toggle */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={
                              measurementModes[field.id] === "exact"
                                ? "secondary"
                                : "outline"
                            }
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => {
                              setMeasurementModes((prev) => ({
                                ...prev,
                                [field.id]:
                                  prev[field.id] === "exact"
                                    ? "standard"
                                    : "exact",
                              }))
                            }}
                          >
                            <Ruler className="size-3" />
                            Medidas exactas
                          </Button>
                        </div>

                        {measurementModes[field.id] === "exact" && (
                          <div className="border-info/30 bg-info/5 grid grid-cols-5 gap-2 rounded-lg border border-dashed p-2">
                            {["bust", "waist", "hips", "length", "sleeve"].map(
                              (measure) => (
                                <div key={measure} className="space-y-1">
                                  <Label className="text-xs text-muted-foreground capitalize">
                                    {measure === "bust"
                                      ? "Busto"
                                      : measure === "waist"
                                        ? "Cintura"
                                        : measure === "hips"
                                          ? "Cadera"
                                          : measure === "length"
                                            ? "Largo"
                                            : "Manga"}
                                  </Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.1"
                                    placeholder="0.00"
                                    {...form.register(
                                      `items.${index}.measurements.${measure}` as FieldPath<OrderFormValues>,
                                      { valueAsNumber: true }
                                    )}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>

            {form.formState.errors.items && (
              <p className="mt-2 text-xs text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Moneda del pedido</Label>
                  <p className="text-xs text-muted-foreground">
                    Define la divisa para el total y los pagos
                  </p>
                </div>
                <CurrencySelector
                  value={orderCurrency || Currency.USD}
                  onChange={(val) => form.setValue("total_currency", val)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total" className="text-sm font-medium">
                    Total del pedido
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-bold text-muted-foreground">
                      {orderCurrency === Currency.USD ? "$" : "C$"}
                    </span>
                    <Input
                      id="total"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("total", { valueAsNumber: true })}
                      className="h-10 pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Calculado: 
                    <CurrencyDisplay 
                      amount={estimatedTotal} 
                      currency={orderCurrency || Currency.USD}
                      size="sm"
                    />
                  </p>
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="advance_paid" className="text-sm font-medium">
                    Adelanto recibido
                  </Label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-bold text-muted-foreground">
                      {orderCurrency === Currency.USD ? "$" : "C$"}
                    </span>
                    <Input
                      id="advance_paid"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("advance_paid", {
                        valueAsNumber: true,
                      })}
                      className="h-10 pl-8"
                    />
                  </div>
                </div>
              </div>
 
              {/* Payment Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <CurrencyDisplay 
                      amount={Number(watchedTotal || 0)} 
                      currency={orderCurrency || Currency.USD}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Adelanto</span>
                    <div className="text-success">
                      <CurrencyDisplay 
                        amount={-Number(watchedAdvance || 0)} 
                        currency={orderCurrency || Currency.USD}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Saldo pendiente</span>
                    <div
                      className={cn(
                        "text-lg font-bold",
                        pendingBalance > 0 ? "text-warning" : "text-success"
                      )}
                    >
                      <CurrencyDisplay 
                        amount={pendingBalance} 
                        currency={orderCurrency || Currency.USD}
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-3 flex w-full items-center justify-center gap-2 md:mt-4">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Crear pedido
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
