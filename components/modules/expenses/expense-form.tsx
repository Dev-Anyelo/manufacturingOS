"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Currency } from "@prisma/client"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { useExchangeRates } from "@/hooks/use-exchange-rates"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaUpload } from "@/components/shared/media-upload"

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
  Receipt,
  Package,
  ArrowUpRight,
  Calculator,
  Building2,
  ChevronDown,
  Save,
} from "lucide-react"

const EXPENSE_CATEGORIES = {
  fabrics: "Telas",
  supplies: "Insumos",
  tools: "Herramientas",
  machinery: "Maquinaria",
  outsourced_labor: "Mano de obra",
  services: "Servicios",
  packaging: "Empaque",
  office: "Oficina",
  payroll: "Nómina",
  other: "Otros",
} as const

const expenseFormSchema = z
  .object({
    expense_date: z.string().min(1, "La fecha del gasto es obligatoria"),
    category: z.enum([
      "fabrics",
      "supplies",
      "tools",
      "machinery",
      "outsourced_labor",
      "services",
      "packaging",
      "office",
      "payroll",
      "other",
    ]),
    concept: z
      .string()
      .trim()
      .min(3, "El concepto debe tener al menos 3 caracteres"),
    supplier: z.string().trim().max(120).optional().nullable(),
    quantity: z.coerce.number().min(0).optional().nullable(),
    unit_price: z.coerce.number().min(0).optional().nullable(),
    unit_price_currency: z.nativeEnum(Currency),
    total: z.coerce.number().min(0, "El total no puede ser negativo"),
    total_currency: z.nativeEnum(Currency),
    updates_inventory: z.boolean().default(false),
    inventory_item_id: z.string().uuid().optional().nullable(),
    inventory_quantity_added: z.coerce.number().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    receipt_url: z.string().trim().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.updates_inventory) {
      if (!value.inventory_item_id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inventory_item_id"],
          message: "Debes seleccionar un material.",
        })
      }
      if (
        !value.inventory_quantity_added ||
        value.inventory_quantity_added <= 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inventory_quantity_added"],
          message: "La cantidad agregada debe ser mayor a 0.",
        })
      }
    }
  })

type ExpenseFormInput = z.input<typeof expenseFormSchema>
type ExpenseFormOutput = z.output<typeof expenseFormSchema>

type InventoryOption = {
  id: string
  name: string
  unit: string
  quantity: number
}

interface ExpenseFormProps {
  inventoryItems: InventoryOption[]
  itemId?: string
  defaultValues?: Partial<ExpenseFormInput> & { receipt_url?: string | null }
  /** Called after successful submission — used when embedded in a Sheet */
  onSuccess?: () => void
  /** Called when the user cancels — used when embedded in a Sheet */
  onCancel?: () => void
}

function todayInputDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function normalizeOptional(value?: string | null) {
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

export function ExpenseForm({
  inventoryItems,
  itemId,
  defaultValues,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { baseCurrency, isLoading: settingsLoading } = useSystemSettings()
  const { getRate } = useExchangeRates()
  const [inventoryOpen, setInventoryOpen] = React.useState(false)

  const form = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expense_date: defaultValues?.expense_date || todayInputDate(),
      category: defaultValues?.category || "supplies",
      concept: defaultValues?.concept || "",
      supplier: defaultValues?.supplier || "",
      quantity: defaultValues?.quantity || 0,
      unit_price: defaultValues?.unit_price || 0,
      updates_inventory: defaultValues?.updates_inventory || false,
      inventory_item_id: defaultValues?.inventory_item_id || null,
      inventory_quantity_added: defaultValues?.inventory_quantity_added || null,
      notes: defaultValues?.notes || "",
      receipt_url: defaultValues?.receipt_url || null,
      total: defaultValues?.total || 0,
      total_currency: defaultValues?.total_currency,
      unit_price_currency: defaultValues?.unit_price_currency,
    },
  })

  const quantity = (form.watch("quantity") as number | null | undefined) ?? 0
  const unitPrice = (form.watch("unit_price") as number | null | undefined) ?? 0
  const updatesInventory = form.watch("updates_inventory")
  const selectedExpenseDate = form.watch("expense_date")
  const selectedInventoryItemId = form.watch("inventory_item_id")
  const watchedTotal = (form.watch("total") as number | null | undefined) ?? 0
  const totalCurrency = form.watch("total_currency")
  const unitPriceCurrency = form.watch("unit_price_currency")

  const rateForTotal = React.useMemo(() => {
    return (
      getRate(unitPriceCurrency as Currency, totalCurrency as Currency) || 1
    )
  }, [getRate, unitPriceCurrency, totalCurrency])

  const calculatedTotal =
    Number(quantity ?? 0) * Number(unitPrice ?? 0) * rateForTotal

  const selectedInventoryItem = React.useMemo(
    () =>
      inventoryItems.find((item) => item.id === selectedInventoryItemId) ??
      null,
    [inventoryItems, selectedInventoryItemId]
  )

  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  React.useEffect(() => {
    const nextTotal = Number.isFinite(calculatedTotal)
      ? Number(calculatedTotal.toFixed(2))
      : 0
    form.setValue("total", nextTotal, { shouldDirty: true })
  }, [calculatedTotal, form])

  React.useEffect(() => {
    if (baseCurrency && !form.getValues("total_currency")) {
      form.setValue("unit_price_currency", baseCurrency)
      form.setValue("total_currency", baseCurrency)
    }
  }, [baseCurrency, form])

  React.useEffect(() => {
    if (updatesInventory && !inventoryOpen) {
      setInventoryOpen(true)
    }
  }, [updatesInventory, inventoryOpen])

  async function onSubmit(values: ExpenseFormOutput) {
    setIsSubmitting(true)

    try {
      const payload = {
        expense_date: parseInputDate(values.expense_date),
        category: values.category,
        concept: values.concept.trim(),
        supplier: normalizeOptional(values.supplier),
        quantity: values.quantity ?? null,
        unit_price: values.unit_price ?? null,
        unit_price_currency: values.unit_price_currency,
        total: Number(values.total),
        total_currency: values.total_currency,
        updates_inventory: values.updates_inventory,
        inventory_item_id: values.updates_inventory
          ? values.inventory_item_id
          : null,
        inventory_quantity_added: values.updates_inventory
          ? values.inventory_quantity_added
          : null,
        notes: normalizeOptional(values.notes),
        receipt_url: values.receipt_url || null, // Asegurar inclusión
      }

      const endpoint = itemId ? `/api/expenses/${itemId}` : "/api/expenses"
      const method = itemId ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
        data?: { id: string }
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "No se pudo registrar el gasto.")
      }

      toast.success("Gasto registrado correctamente")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/expenses")
        router.refresh()
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el gasto."
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
      {/* Total Summary - Compact Info Bar */}
      <div className="mb-4 flex items-center justify-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
        <div className="flex shrink-0 flex-col items-center px-4 py-2">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Total a registrar
          </span>
          <div className="mt-0.5">
            <CurrencyDisplay
              amount={watchedTotal}
              currency={form.watch("total_currency") as any}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="basic">
            <Receipt className="size-3.5" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="amounts">
            <Calculator className="size-3.5" />
            Cálculo
          </TabsTrigger>
          <TabsTrigger value="extras">
            <Package className="size-3.5" />
            Extras
          </TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="dborder-none m-0 bg-none p-0">
            <div className="space-y-4">
              {/* Date + Category Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                        {formatDateLabel(selectedExpenseDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          selectedExpenseDate
                            ? parseInputDate(selectedExpenseDate)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return
                          form.setValue("expense_date", toInputDate(date), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                        disabled={(date) => date > today}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categoría</Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(value) =>
                      form.setValue(
                        "category",
                        value as ExpenseFormOutput["category"],
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORIES).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Concept */}
              <div className="space-y-2">
                <Label htmlFor="concept" className="text-sm font-medium">
                  Concepto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="concept"
                  placeholder="Ej: Compra de hilo industrial"
                  {...form.register("concept")}
                  className="h-10"
                />
                {form.formState.errors.concept && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.concept.message}
                  </p>
                )}
              </div>

              {/* Supplier */}
              <div className="space-y-2">
                <Label
                  htmlFor="supplier"
                  className="flex items-center gap-1 text-sm font-medium"
                >
                  <Building2 className="size-3.5" />
                  Proveedor
                </Label>
                <Input
                  id="supplier"
                  placeholder="Nombre del proveedor (opcional)"
                  {...form.register("supplier")}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Amounts Tab */}
        <TabsContent value="amounts" className="space-y-4">
          <div className="dborder-none m-0 bg-none p-0">
            <div className="space-y-4">
              {/* Quantity + Unit Price + Total */}
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
                    placeholder="0"
                    {...form.register("quantity", { valueAsNumber: true })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_price" className="text-sm font-medium">
                    Precio unit.
                  </Label>
                  <div className="flex gap-2">
                    <CurrencySelector
                      value={form.watch("unit_price_currency") || Currency.USD}
                      onChange={(val) => {
                        form.setValue("unit_price_currency", val)
                        form.setValue("total_currency", val)
                      }}
                    />
                    <Input
                      id="unit_price"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("unit_price", { valueAsNumber: true })}
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total" className="text-sm font-medium">
                    Total
                  </Label>
                  <div className="flex gap-2">
                    <CurrencySelector
                      value={form.watch("total_currency") || Currency.USD}
                      onChange={(val) => form.setValue("total_currency", val)}
                    />
                    <Input
                      id="total"
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register("total", { valueAsNumber: true })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Display */}
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Total calculado
                </p>
                <div className="mt-1 flex justify-center">
                  <CurrencyDisplay
                    amount={
                      Number.isFinite(calculatedTotal) ? calculatedTotal : 0
                    }
                    currency={form.watch("total_currency") as Currency}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Extras Tab */}
        <TabsContent value="extras" className="space-y-4">
          <div className="dborder-none m-0 bg-none p-0">
            <div className="space-y-4">
              {/* Inventory Toggle */}
              <Collapsible open={inventoryOpen} onOpenChange={setInventoryOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          updatesInventory ? "bg-success/10" : "bg-muted"
                        )}
                      >
                        <Package
                          className={cn(
                            "size-4",
                            updatesInventory
                              ? "text-success"
                              : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Actualizar inventario
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vincular este gasto con el stock
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={updatesInventory}
                        onCheckedChange={(checked) => {
                          form.setValue("updates_inventory", checked, {
                            shouldDirty: true,
                          })
                          if (!checked) {
                            form.setValue("inventory_item_id", null)
                            form.setValue("inventory_quantity_added", null)
                          }
                        }}
                      />
                      {updatesInventory && (
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform",
                            inventoryOpen && "rotate-180"
                          )}
                        />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {updatesInventory && (
                    <div className="border-success/30 bg-success/5 grid grid-cols-1 gap-3 rounded-lg border border-dashed p-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Material</Label>
                        <Select
                          value={selectedInventoryItemId ?? ""}
                          onValueChange={(value) =>
                            form.setValue("inventory_item_id", value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedInventoryItem && (
                          <p className="text-xs text-muted-foreground">
                            Stock: {selectedInventoryItem.quantity.toFixed(2)}{" "}
                            {selectedInventoryItem.unit}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="inventory_quantity_added"
                          className="text-sm font-medium"
                        >
                          Cantidad a agregar
                        </Label>
                        <div className="relative">
                          <ArrowUpRight className="text-success pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                          <Input
                            id="inventory_quantity_added"
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0"
                            {...form.register("inventory_quantity_added", {
                              valueAsNumber: true,
                            })}
                            className="h-10 pl-8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Receipt Upload */}
              <div className="space-y-2">
                {/* Campo oculto para asegurar captura */}
                <input type="hidden" {...form.register("receipt_url")} />
                
                <MediaUpload
                  bucketType="expenses"
                  currentValue={form.watch("receipt_url") || undefined}
                  onUploadComplete={(path) => {
                    form.setValue("receipt_url", path as string, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  label="Comprobante / Recibo"
                  multiple={false}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Observaciones adicionales..."
                  {...form.register("notes")}
                  className="resize-none"
                />
              </div>
            </div>
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
          Registrar gasto
        </Button>
      </div>
    </form>
  )
}
