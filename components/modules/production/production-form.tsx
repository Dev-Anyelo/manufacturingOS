"use client"

import { z } from "zod"
import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { GARMENT_TYPES } from "@/types"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { productionSessionSchema } from "@/lib/validations/production"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const productionFormSchema = z.object({
  employee_id: z.string().uuid("El empleado seleccionado no es valido"),
  session_date: z.string().min(1, "La fecha de sesion es obligatoria"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        inventory_item_id: z
          .string()
          .uuid("El material seleccionado no es valido"),
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
          "custom",
        ]),
        quantity: z.coerce.number().int().min(1),
        yards_used: z.coerce.number().min(0),
        notes: z.string().trim().max(500).optional().nullable(),
      })
    )
    .min(1, "Debes agregar al menos un item a la sesion"),
})

type ProductionSchemaInput = z.input<typeof productionSessionSchema>
type ProductionFormInput = z.input<typeof productionFormSchema>
type ProductionFormOutput = z.output<typeof productionFormSchema>
type ProductionFormValues = ProductionFormOutput

type EmployeeOption = {
  id: string
  fullName: string
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
  "custom",
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
    notes: "",
  }
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
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
  const today = React.useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const selectedEmployee = React.useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId),
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
      const payload: ProductionSchemaInput = {
        employee_id: values.employee_id,
        session_date: parseInputDate(values.session_date),
        notes: normalizeOptional(values.notes),
        items: values.items.map((item) => ({
          inventory_item_id: item.inventory_item_id,
          garment_type: item.garment_type,
          size: item.size,
          quantity: Number(item.quantity),
          yards_used: Number(item.yards_used),
          notes: normalizeOptional(item.notes),
        })),
      }

      const response = await fetch("/api/production", {
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
        throw new Error(result.error ?? "No se pudo registrar la sesion.")
      }

      toast.success("Sesion de produccion registrada.")
      router.push(`/production/${result.data.id}`)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar la sesion de produccion."
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
          <CardTitle className="text-base">Datos de sesion</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Empleado</Label>
            <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeeOpen}
                  className="w-full justify-between"
                >
                  <span className="truncate">
                    {selectedEmployee?.fullName ?? "Selecciona empleado"}
                  </span>
                  <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,26rem)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar empleado..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                    <CommandGroup>
                      {employees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          onClick={() => {
                            form.setValue("employee_id", employee.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                            setEmployeeOpen(false)
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 size-4",
                              employee.id === selectedEmployeeId
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="truncate">{employee.fullName}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.employee_id ? (
              <p className="text-danger text-xs">
                {form.formState.errors.employee_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Fecha de sesion</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {formatDateLabel(selectedSessionDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  mode="single"
                  selected={
                    selectedSessionDate
                      ? parseInputDate(selectedSessionDate)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (!date) {
                      return
                    }

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
            {form.formState.errors.session_date ? (
              <p className="text-danger text-xs">
                {form.formState.errors.session_date.message as string}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas generales
            </Label>
            <Textarea
              id="notes"
              className="min-h-24"
              placeholder="Observaciones de la jornada o rendimiento..."
              {...form.register("notes")}
            />
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-3 md:col-span-2">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Lineas</p>
                <p className="font-medium">{fields.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prendas totales</p>
                <p className="font-medium">{totalGarments}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Yardas usadas</p>
                <p className="font-medium">{totalYards.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Detalle de confeccion</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyItem())}
          >
            <PlusIcon className="size-4" />
            Agregar linea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const selectedItemId = form.watch(
              `items.${index}.inventory_item_id`
            )
            const selectedMaterial = inventoryItems.find(
              (item) => item.id === selectedItemId
            )

            return (
              <div
                key={field.id}
                className="space-y-4 rounded-xl border border-border/60 bg-card p-4"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Material</Label>
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
                    {form.formState.errors.items?.[index]?.inventory_item_id ? (
                      <p className="text-danger text-xs">
                        {
                          form.formState.errors.items[index]?.inventory_item_id
                            ?.message
                        }
                      </p>
                    ) : null}
                    {selectedMaterial ? (
                      <p className="text-xs text-muted-foreground">
                        Stock disponible: {selectedMaterial.quantity.toFixed(2)}{" "}
                        {selectedMaterial.unit}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Prenda</Label>
                    <Select
                      value={
                        form.watch(`items.${index}.garment_type`) || "shirt"
                      }
                      onValueChange={(value) =>
                        form.setValue(
                          `items.${index}.garment_type`,
                          value as ProductionFormValues["items"][number]["garment_type"],
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Tipo de prenda" />
                      </SelectTrigger>
                      <SelectContent>
                        {garmentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Talla</Label>
                    <Select
                      value={form.watch(`items.${index}.size`) || "M"}
                      onValueChange={(value) =>
                        form.setValue(
                          `items.${index}.size`,
                          value as ProductionFormValues["items"][number]["size"],
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Talla" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptions.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size === "custom" ? "Personalizada" : size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      step="1"
                      {...form.register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.items?.[index]?.quantity ? (
                      <p className="text-danger text-xs">
                        {form.formState.errors.items[index]?.quantity?.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Yardas usadas</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      {...form.register(`items.${index}.yards_used`, {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.items?.[index]?.yards_used ? (
                      <p className="text-danger text-xs">
                        {
                          form.formState.errors.items[index]?.yards_used
                            ?.message
                        }
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Notas</Label>
                    <Input
                      {...form.register(`items.${index}.notes`)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon className="size-4" />
                    Quitar linea
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/production")}
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
          Guardar sesion
        </Button>
      </div>
    </form>
  )
}
