"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { EXPENSE_CATEGORIES } from "@/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, UploadIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    total: z.coerce.number().min(0, "El total no puede ser negativo"),
    updates_inventory: z.boolean().default(false),
    inventory_item_id: z.string().uuid().optional().nullable(),
    inventory_quantity_added: z.coerce.number().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
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
  if (!value) {
    return "Seleccionar fecha"
  }

  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseInputDate(value))
}

export function ExpenseForm({ inventoryItems }: ExpenseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null)

  const form = useForm<ExpenseFormInput, unknown, ExpenseFormOutput>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expense_date: todayInputDate(),
      category: "supplies",
      concept: "",
      supplier: "",
      quantity: 0,
      unit_price: 0,
      total: 0,
      updates_inventory: false,
      inventory_item_id: null,
      inventory_quantity_added: null,
      notes: "",
    },
  })

  const quantity = form.watch("quantity")
  const unitPrice = form.watch("unit_price")
  const updatesInventory = form.watch("updates_inventory")
  const selectedExpenseDate = form.watch("expense_date")
  const calculatedTotal = Number(quantity ?? 0) * Number(unitPrice ?? 0)
  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  React.useEffect(() => {
    const nextTotal = Number.isFinite(calculatedTotal)
      ? Number(calculatedTotal.toFixed(2))
      : 0
    form.setValue("total", nextTotal, {
      shouldDirty: true,
    })
  }, [calculatedTotal, form])

  async function uploadReceipt(expenseId: string) {
    if (!receiptFile) {
      return
    }

    const formData = new FormData()
    formData.append("file", receiptFile)

    const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
      method: "POST",
      body: formData,
    })

    const result = (await response.json()) as {
      success: boolean
      error?: string
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error ?? "No se pudo subir el recibo.")
    }
  }

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
        total: Number(values.total),
        updates_inventory: values.updates_inventory,
        inventory_item_id: values.updates_inventory
          ? values.inventory_item_id
          : null,
        inventory_quantity_added: values.updates_inventory
          ? values.inventory_quantity_added
          : null,
        notes: normalizeOptional(values.notes),
        receipt_url: null,
      }

      const response = await fetch("/api/expenses", {
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
        throw new Error(result.error ?? "No se pudo registrar el gasto.")
      }

      if (receiptFile) {
        try {
          await uploadReceipt(result.data.id)
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "No se pudo subir el recibo."
          toast.warning(message)
        }
      }

      toast.success("Gasto registrado correctamente.")
      router.push("/expenses")
      router.refresh()
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
      className="space-y-6"
      noValidate
    >
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Datos del gasto</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {formatDateLabel(selectedExpenseDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  mode="single"
                  selected={
                    selectedExpenseDate
                      ? parseInputDate(selectedExpenseDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (!date) {
                      return
                    }

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
            {form.formState.errors.expense_date ? (
              <p className="text-danger text-xs">
                {form.formState.errors.expense_date.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoria</Label>
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
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="concept" className="text-sm font-medium">
              Concepto
            </Label>
            <Input
              id="concept"
              placeholder="Ej: Compra de hilo industrial"
              {...form.register("concept")}
            />
            {form.formState.errors.concept ? (
              <p className="text-danger text-xs">
                {form.formState.errors.concept.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Proveedor
            </Label>
            <Input
              id="supplier"
              placeholder="Opcional"
              {...form.register("supplier")}
            />
          </div>

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_price" className="text-sm font-medium">
              Precio unitario
            </Label>
            <Input
              id="unit_price"
              type="number"
              min={0}
              step="0.01"
              {...form.register("unit_price", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total" className="text-sm font-medium">
              Total
            </Label>
            <Input
              id="total"
              type="number"
              min={0}
              step="0.01"
              {...form.register("total", { valueAsNumber: true })}
            />
            {form.formState.errors.total ? (
              <p className="text-danger text-xs">
                {form.formState.errors.total.message}
              </p>
            ) : null}
          </div>

          <div className="bg-brand-muted rounded-lg border border-brand/20 p-4 text-center md:col-span-2">
            <p className="mb-1 text-xs font-medium tracking-wide text-brand/80 uppercase">
              Total calculado
            </p>
            <p className="text-2xl font-bold text-brand">
              {new Intl.NumberFormat("es-PA", {
                style: "currency",
                currency: "USD",
              }).format(Number.isFinite(calculatedTotal) ? calculatedTotal : 0)}
            </p>
            {Number(quantity ?? 0) > 0 && Number(unitPrice ?? 0) > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(quantity ?? 0)} x {Number(unitPrice ?? 0).toFixed(2)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 sm:p-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  Actualiza inventario
                </Label>
                <p className="text-xs text-muted-foreground">
                  Aumenta el stock del material seleccionado
                </p>
              </div>
              <Switch
                checked={updatesInventory}
                onCheckedChange={(checked) =>
                  form.setValue("updates_inventory", checked === true, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className="data-checked:bg-brand"
              />
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 md:col-span-2",
              updatesInventory ? "max-h-120 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Material</Label>
                <Select
                  value={form.watch("inventory_item_id") ?? ""}
                  onValueChange={(value) =>
                    form.setValue("inventory_item_id", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona material" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.inventory_item_id ? (
                  <p className="text-danger text-xs">
                    {form.formState.errors.inventory_item_id.message as string}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="inventory_quantity_added"
                  className="text-sm font-medium"
                >
                  Cantidad agregada
                </Label>
                <Input
                  id="inventory_quantity_added"
                  type="number"
                  min={0}
                  step="0.01"
                  {...form.register("inventory_quantity_added", {
                    valueAsNumber: true,
                  })}
                />
                {form.formState.errors.inventory_quantity_added ? (
                  <p className="text-danger text-xs">
                    {
                      form.formState.errors.inventory_quantity_added
                        .message as string
                    }
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <Textarea
              id="notes"
              className="min-h-24"
              {...form.register("notes")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="receipt_file" className="text-sm font-medium">
              Recibo (opcional)
            </Label>
            <label className="hover:bg-brand-muted flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm transition-colors hover:border-brand/60">
              <UploadIcon className="size-4 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {receiptFile ? receiptFile.name : "Seleccionar archivo"}
              </span>
              <Input
                id="receipt_file"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(event) => {
                  setReceiptFile(event.target.files?.[0] ?? null)
                }}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/expenses")}
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
          Guardar gasto
        </Button>
      </div>
    </form>
  )
}
