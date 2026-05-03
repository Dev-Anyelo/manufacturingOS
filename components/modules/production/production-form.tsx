"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { EntitySelector } from "@/components/shared/entity-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Scissors,
  Ruler,
  Factory,
  UserCog2,
  Layers2Icon,
  Loader2,
  Save,
} from "lucide-react"

const GARMENT_TYPES = {
  shirt: "Camisa",
  skirt: "Falda",
  shorts: "Shorts",
  leggings: "Leggings",
  pajamas: "Pijamas",
  suit: "Traje",
  sheets: "Sábanas",
  blankets: "Mantas",
  other: "Otro",
} as const

const productionFormSchema = z.object({
  employee_id: z.string().uuid("El empleado seleccionado no es válido"),
  session_date: z.string().min(1, "La fecha de sesión es obligatoria"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        inventory_item_id: z
          .string()
          .uuid("El material seleccionado no es válido"),
        garment_type: z.enum([
          "shirt",
          "skirt",
          "shorts",
          "leggings",
          "pajamas",
          "suit",
          "sheets",
          "blankets",
          "other",
        ]),
        size: z.enum([
          "XS",
          "S",
          "M",
          "L",
          "XL",
          "XXL",
          "3XL",
          "4XL",
          "Personalizada",
        ]),
        quantity: z.coerce.number().int().min(1),
        yards_used: z.coerce.number().min(0),
        is_reuse: z.boolean().default(false),
        notes: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1, "Debes agregar al menos un ítem a la sesión"),
})

type ProductionFormInput = z.input<typeof productionFormSchema>
type ProductionFormOutput = z.output<typeof productionFormSchema>
type ProductionFormValues = ProductionFormOutput

type EmployeeOption = {
  id: string
  fullName: string
  profileId?: string | null
}

type InventoryOption = {
  id: string
  name: string
  unit: string
  quantity: number
}

interface ProductionFormProps {
  employees: EmployeeOption[]
  inventoryItems: InventoryOption[]
  currentUserId?: string
  currentUserRole?: UserRole | string
  /** Called after successful submission — used when embedded in a Sheet */
  onSuccess?: () => void
  /** Called when the user cancels — used when embedded in a Sheet */
  onCancel?: () => void
}

const sizeOptions: ProductionFormValues["items"][number]["size"][] = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "Personalizada",
]

const garmentOptions = Object.entries(GARMENT_TYPES).map(([value, label]) => ({
  value: value as keyof typeof GARMENT_TYPES,
  label,
}))

function todayInputDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function emptyItem(): ProductionFormValues["items"][number] {
  return {
    inventory_item_id: "",
    garment_type: "shirt",
    size: "M",
    quantity: 1,
    yards_used: 0,
    is_reuse: false,
    notes: "",
  }
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function formatDateLabel(value: string) {
  if (!value) return "Seleccionar"

  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)

  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
  }).format(date)
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

export function ProductionForm({
  employees,
  inventoryItems,
  currentUserId,
  currentUserRole,
  onSuccess,
  onCancel,
}: ProductionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [employeeOpen, setEmployeeOpen] = React.useState(false)

  const form = useForm<ProductionFormInput, unknown, ProductionFormOutput>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      employee_id: "",
      session_date: todayInputDate(),
      notes: "",
      items: [emptyItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items")
  const selectedEmployeeId = form.watch("employee_id")
  const selectedSessionDate = form.watch("session_date")
  const isEmployeeRole = currentUserRole === UserRole.Employee

  const linkedEmployee = React.useMemo(() => {
    if (!currentUserId) {
      return null
    }

    return (
      employees.find((employee) => employee.profileId === currentUserId) ?? null
    )
  }, [currentUserId, employees])

  const employeeLinkError =
    isEmployeeRole && !linkedEmployee
      ? "Tu perfil no está vinculado a un empleado. Contacta al administrador."
      : null

  React.useEffect(() => {
    if (!linkedEmployee) {
      return
    }

    form.setValue("employee_id", linkedEmployee.id, {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [form, linkedEmployee])

  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const selectedEmployee = React.useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  const totalGarments = React.useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0
    )
  }, [watchedItems])

  const totalYards = React.useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => acc + Number(item.yards_used || 0),
      0
    )
  }, [watchedItems])

  async function onSubmit(values: ProductionFormOutput) {
    setIsSubmitting(true)

    try {
      const payload = {
        employee_id: values.employee_id,
        session_date: parseInputDate(values.session_date),
        notes: normalizeOptional(values.notes),
        items: values.items.map((item) => ({
          inventory_item_id: item.inventory_item_id,
          garment_type: item.garment_type,
          size: item.size,
          quantity: Number(item.quantity),
          yards_used: Number(item.yards_used),
          is_reuse: item.is_reuse,
          notes: normalizeOptional(item.notes),
        })),
      }

      const response = await fetch("/api/production", {
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
        throw new Error(result.error ?? "No se pudo registrar la sesión.")
      }

      toast.success("Sesión de producción registrada")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/production/${result.data.id}`)
        router.refresh()
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la sesión de producción."
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
          { label: "Total prendas", value: totalGarments },
          { label: "Total yardas", value: totalYards.toFixed(1) },
          {
            label: "Empleado",
            value: selectedEmployee?.fullName || "No seleccionado",
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
            <span className="mt-0.5 text-sm font-bold tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="session" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="session" className="gap-1.5 text-xs sm:text-sm">
            <UserCog2 className="size-3.5" />
            Sesión
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-1.5 text-xs sm:text-sm">
            <Scissors className="size-3.5" />
            Producción ({fields.length})
          </TabsTrigger>
        </TabsList>

        {/* Session Tab */}
        <TabsContent value="session" className="space-y-4">
          <div className="m-0 border-none bg-none p-0">
            <div className="space-y-4">
              {/* Employee + Date Row */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <EntitySelector
                    entities={employees}
                    value={selectedEmployeeId}
                    onChange={(id: string | null) => {
                      form.setValue("employee_id", id || "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                    label="Empleado"
                    placeholder="Seleccionar empleado..."
                    emptyMessage="No se encontraron empleados."
                    disabled={isEmployeeRole}
                  />
                  {form.formState.errors.employee_id && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.employee_id.message}
                    </p>
                  )}
                  {employeeLinkError ? (
                    <p className="text-xs text-destructive">
                      {employeeLinkError}
                    </p>
                  ) : null}
                </div>

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
                        {formatDateLabel(selectedSessionDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          selectedSessionDate
                            ? parseInputDate(selectedSessionDate)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return
                          form.setValue("session_date", toInputDate(date), {
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
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas generales
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Observaciones de la jornada..."
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
                  <Factory className="size-4" />
                </div>
                <span className="text-sm font-medium">
                  {fields.length} línea{fields.length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyItem())}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Agregar
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const selectedItemId = form.watch(
                  `items.${index}.inventory_item_id`
                )
                const selectedMaterial = inventoryItems.find(
                  (item) => item.id === selectedItemId
                )
                const itemQuantity = Number(
                  form.watch(`items.${index}.quantity`) || 0
                )
                const itemYards = Number(
                  form.watch(`items.${index}.yards_used`) || 0
                )
                const itemIsReuse = Boolean(
                  form.watch(`items.${index}.is_reuse`) || false
                )

                return (
                  <div
                    key={field.id}
                    className="rounded-lg border border-border bg-muted/30 p-3"
                  >
                    {/* Item Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-accent/10 text-xs font-bold dark:bg-accent">
                          {index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {itemQuantity} pz · {itemYards.toFixed(1)} yd
                        </span>
                      </div>
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

                    {/* Item Fields - Compact Grid */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Material
                        </Label>
                        <Select
                          value={
                            form.watch(`items.${index}.inventory_item_id`) || ""
                          }
                          onValueChange={(value) =>
                            form.setValue(
                              `items.${index}.inventory_item_id`,
                              value,
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              }
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-full text-xs">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                <div className="flex items-center gap-1">
                                  <Layers2Icon className="size-3 text-muted-foreground" />
                                  <span className="truncate">{item.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedMaterial && (
                          <p className="text-[10px] text-muted-foreground">
                            Stock: {selectedMaterial.quantity.toFixed(1)}{" "}
                            {selectedMaterial.unit}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Prenda
                        </Label>
                        <Select
                          value={
                            form.watch(`items.${index}.garment_type`) || "shirt"
                          }
                          onValueChange={(value) =>
                            form.setValue(
                              `items.${index}.garment_type`,
                              value as ProductionFormValues["items"][number]["garment_type"],
                              { shouldDirty: true, shouldValidate: true }
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {garmentOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          Talla
                        </Label>
                        <Select
                          value={form.watch(`items.${index}.size`) || "M"}
                          onValueChange={(value) =>
                            form.setValue(
                              `items.${index}.size`,
                              value as ProductionFormValues["items"][number]["size"],
                              { shouldDirty: true, shouldValidate: true }
                            )
                          }
                        >
                          <SelectTrigger className="h-9 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Scissors className="size-3" />
                          Piezas
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
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="size-3" />
                          Yardas
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          {...form.register(`items.${index}.yards_used`, {
                            valueAsNumber: true,
                          })}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-6">
                        <div className="flex items-center gap-2 pt-1">
                          <Checkbox
                            id={`reuse-${field.id}`}
                            checked={itemIsReuse}
                            onCheckedChange={(checked) =>
                              form.setValue(
                                `items.${index}.is_reuse`,
                                checked === true,
                                {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                }
                              )
                            }
                          />
                          <Label
                            htmlFor={`reuse-${field.id}`}
                            className="cursor-pointer text-xs text-muted-foreground"
                          >
                            Reutilizando material de sesión anterior
                          </Label>
                        </div>
                        {itemIsReuse ? (
                          <p className="text-warning mt-1 text-xs">
                            No se descontará del inventario
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
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
      </Tabs>

      <div className="mt-3 flex w-full items-center justify-center gap-2 md:mt-4">
        <Button
          type="submit"
          size="sm"
          disabled={isSubmitting || Boolean(employeeLinkError)}
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
              Crear sesión
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

