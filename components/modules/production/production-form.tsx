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
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { EntitySelector } from "@/components/shared/entity-selector"
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form"
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
  Info,
  PackageOpen,
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

const productionItemSchema = z.object({
  inventory_item_id: z.string().uuid("El material seleccionado no es válido"),
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
  color: z.string().trim().max(80).optional().nullable(),
  quantity: z.number().int().min(1),
  yards_used: z.number().min(0),
  is_reuse: z.boolean(),
  notes: z.string().trim().max(500).optional().nullable(),
})

const productionFormSchema = z.object({
  employee_id: z.string().uuid("El empleado seleccionado no es válido"),
  session_date: z.string().min(1, "La fecha de sesión es obligatoria"),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(productionItemSchema)
    .min(1, "Debes agregar al menos un ítem a la sesión"),
})

export type ProductionFormValues = z.infer<typeof productionFormSchema>
type ProductionFormInput = ProductionFormValues

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
  sessionId?: string
  defaultValues?: Partial<ProductionFormInput>
  /** Called after successful submission — used when embedded in a Sheet */
  onSuccess?: () => void
  /** Called when the user cancels — used when embedded in a Sheet */
  onCancel?: () => void
  className?: string
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
    color: "",
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
  if (!value) return "Seleccionar fecha"
  const date = parseInputDate(value)
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  sessionId,
  defaultValues,
  onSuccess,
  onCancel,
  className,
}: ProductionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"session" | "items">(
    "session"
  )

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: defaultValues || {
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
    if (!currentUserId) return null
    return (
      employees.find((employee) => employee.profileId === currentUserId) ?? null
    )
  }, [currentUserId, employees])

  const employeeLinkError =
    isEmployeeRole && !linkedEmployee
      ? "Tu perfil no está vinculado a un empleado. Contacta al administrador."
      : null

  React.useEffect(() => {
    if (!linkedEmployee) return
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

  // Ref to the items scroll container — used to scroll newly-added items into view
  const itemsScrollRef = React.useRef<HTMLDivElement | null>(null)

  function handleAppend() {
    append(emptyItem())
    setActiveTab("items")
    // Defer scroll until the new node is rendered
    requestAnimationFrame(() => {
      const node = itemsScrollRef.current
      if (node) {
        node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
      }
    })
  }

  async function onSubmit(values: ProductionFormValues) {
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
          color: normalizeOptional(item.color),
          quantity: Number(item.quantity),
          yards_used: Number(item.yards_used),
          is_reuse: item.is_reuse,
          notes: normalizeOptional(item.notes),
        })),
      }

      const endpoint = sessionId
        ? `/api/production/${sessionId}`
        : "/api/production"
      const method = sessionId ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({
        success: false,
        error: "Respuesta inválida del servidor.",
      }))) as {
        success: boolean
        error?: string
        data?: { id: string }
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error ?? "No se pudo registrar la sesión.")
      }

      const pathsToRevalidate = [
        "/production",
        `/production/${result.data.id}`,
        "/inventory",
        "/reports",
        "/",
      ]

      await revalidatePaths(pathsToRevalidate)
      toast.success("Sesión de producción registrada")

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/production/${result.data.id}`)
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
    /*
     * Root layout
     * -----------
     * The form is a flex column that fills its parent. Critical pieces:
     *   - `min-h-0` on every flex container so children can actually shrink
     *     and trigger their inner overflow.
     *   - Header / summary / tabs-list / footer are `shrink-0`.
     *   - The ONLY scrollable area is the active tab's content (`overflow-y-auto`).
     *   - Footer is a sibling `shrink-0` block — NOT `sticky` — so it is always
     *     visible regardless of how many items are added.
     */
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("flex h-full min-h-0 flex-col", className)}
      noValidate
    >
      {/* ─── Summary bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-5">
            <SummaryStat
              label="Prendas"
              icon={<Scissors className="size-3.5 text-primary" />}
              value={totalGarments.toString()}
            />
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-8"
            />
            <SummaryStat
              label="Yardas"
              icon={<Ruler className="size-3.5 text-primary" />}
              value={totalYards.toFixed(1)}
            />
            <Separator
              orientation="vertical"
              className="hidden data-[orientation=vertical]:h-8 sm:block"
            />
            <SummaryStat
              label="Líneas"
              icon={<Layers2Icon className="size-3.5 text-primary" />}
              value={fields.length.toString()}
              className="hidden sm:flex"
            />
          </div>

          <div className="flex min-w-0 flex-col items-end">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Responsable
            </span>
            <div className="flex min-w-0 items-center gap-1.5">
              <UserCog2 className="size-3.5 shrink-0 text-primary" />
              <span className="max-w-[140px] truncate text-sm font-medium sm:max-w-[220px]">
                {selectedEmployee?.fullName || "Pendiente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs (fills remaining space) ────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "session" | "items")}
        className="flex min-h-0 flex-1 flex-col"
      >
        {/* Tabs list — sticky-like (it's a shrink-0 sibling) */}
        <div className="shrink-0 border-b border-border/70 bg-background px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <TabsList className="grid h-10 w-full grid-cols-2">
            <TabsTrigger value="session" className="gap-2 text-sm">
              <UserCog2 className="size-4" />
              <span>Datos</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2 text-sm">
              <Factory className="size-4" />
              <span>Detalle</span>
              {fields.length > 0 && (
                <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-xs font-bold text-primary">
                  {fields.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Scrollable area per tab ──────────────────────────────── */}
        <TabsContent
          value="session"
          forceMount
          className={cn(
            "m-0 min-h-0 flex-1 overflow-y-auto overscroll-contain focus-visible:ring-0 focus-visible:outline-none",
            activeTab === "session" ? "block" : "hidden"
          )}
        >
          <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="employee-selector"
                  className="text-sm font-semibold"
                >
                  Colaborador / Empleado
                </Label>
                <EntitySelector
                  entities={employees}
                  value={selectedEmployeeId}
                  onChange={(id) => {
                    form.setValue("employee_id", id || "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  label=""
                  placeholder="Seleccionar empleado..."
                  emptyMessage="No se encontraron empleados."
                  disabled={isEmployeeRole}
                />
                {form.formState.errors.employee_id && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.employee_id.message}
                  </p>
                )}
                {employeeLinkError ? (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {employeeLinkError}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-10 w-full justify-start border-input px-3 text-left font-normal",
                        !selectedSessionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4 text-primary" />
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

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Notas generales de la jornada
              </Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Observaciones, novedades o pendientes de esta sesión..."
                {...form.register("notes")}
                className="min-h-[120px] resize-none border-input focus-visible:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Máximo 1000 caracteres.
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Info className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-primary">
                    Información de registro
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-pretty text-muted-foreground">
                    Los materiales se descontarán automáticamente del inventario
                    al guardar, a menos que marques la opción de{" "}
                    <span className="font-medium text-foreground">
                      Reutilización
                    </span>{" "}
                    en cada línea.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="items"
          forceMount
          className={cn(
            "m-0 min-h-0 flex-1 flex-col focus-visible:ring-0 focus-visible:outline-none",
            activeTab === "items" ? "flex" : "hidden"
          )}
        >
          {/* Items sub-header */}
          <div className="shrink-0 border-b border-border/60 bg-background px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Layers2Icon className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    Líneas agregadas
                  </h3>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {fields.length} ítem{fields.length !== 1 ? "s" : ""}{" "}
                    registrado{fields.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAppend}
                className="h-9 shrink-0 gap-1.5 px-3"
              >
                <Plus className="size-4" />
                <span className="xs:inline hidden sm:inline">Agregar ítem</span>
                <span className="xs:hidden sm:hidden">Agregar</span>
              </Button>
            </div>
          </div>

          {/* Scrollable list — native overflow for reliable scroll on mobile */}
          <div
            ref={itemsScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="mx-auto max-w-3xl space-y-3 px-3 py-4">
              {fields.length === 0 ? (
                <EmptyItemsState onAdd={handleAppend} />
              ) : (
                fields.map((field, index) => (
                  <ItemCard
                    key={field.id}
                    index={index}
                    fieldId={field.id}
                    canRemove={fields.length > 1}
                    form={form}
                    inventoryItems={inventoryItems}
                    onRemove={() => remove(index)}
                  />
                ))
              )}

              {form.formState.errors.items?.message && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-xs font-medium text-destructive">
                  {form.formState.errors.items.message}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Sticky footer (always visible) ──────────────────────────── */}
      <div className="shrink-0 border-t border-border/70 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 sm:py-4 sm:pb-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              size="sm"
            >
              Cancelar
            </Button>
          ) : null}
          <Button
            type="submit"
            size="sm"
            variant="default"
            className="flex-1"
            disabled={isSubmitting || Boolean(employeeLinkError)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span className="truncate">
                  {sessionId ? "Guardar cambios" : "Crear sesión"}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ───────────────────────────── Subcomponents ──────────────────────────── */

function SummaryStat({
  label,
  icon,
  value,
  className,
}: {
  label: string
  icon: React.ReactNode
  value: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
    </div>
  )
}

function EmptyItemsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <PackageOpen className="size-6 text-primary" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">Sin líneas agregadas</h3>
      <p className="mt-1 max-w-xs text-xs text-pretty text-muted-foreground">
        Comienza agregando una línea de producción para registrar el material y
        las prendas elaboradas.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        className="mt-4 h-9 gap-1.5"
      >
        <Plus className="size-4" />
        Agregar primera línea
      </Button>
    </div>
  )
}

interface ItemCardProps {
  index: number
  fieldId: string
  canRemove: boolean
  form: UseFormReturn<ProductionFormValues>
  inventoryItems: InventoryOption[]
  onRemove: () => void
}

function ItemCard({
  index,
  fieldId,
  canRemove,
  form,
  inventoryItems,
  onRemove,
}: ItemCardProps) {
  const selectedItemId = form.watch(`items.${index}.inventory_item_id`)
  const selectedMaterial = inventoryItems.find(
    (item) => item.id === selectedItemId
  )
  const itemQuantity = Number(form.watch(`items.${index}.quantity`) || 0)
  const itemYards = Number(form.watch(`items.${index}.yards_used`) || 0)
  const itemIsReuse = Boolean(form.watch(`items.${index}.is_reuse`) || false)

  return (
    <div className="group rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30 sm:p-4">
      {/* Card header */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-foreground">
              Línea de producción
            </h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Scissors className="size-2.5" />
                {itemQuantity} und.
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span className="flex items-center gap-1">
                <Ruler className="size-2.5" />
                {itemYards.toFixed(1)} yd.
              </span>
              {itemIsReuse && (
                <>
                  <span className="size-1 rounded-full bg-border" />
                  <span className="font-medium text-amber-600">
                    Reutilización
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`Eliminar línea ${index + 1}`}
          className="size-9 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Field grid — mobile: 1 col, sm: 2 cols, lg: 3 cols */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Material / Tela
          </Label>
          <EntitySelector
            entities={inventoryItems.map((item) => ({
              id: item.id,
              fullName: item.name,
            }))}
            value={form.watch(`items.${index}.inventory_item_id`) || null}
            onChange={(value) =>
              form.setValue(`items.${index}.inventory_item_id`, value || "", {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            label=""
            placeholder="Seleccionar material..."
            emptyMessage="No se encontraron materiales."
          />
          {selectedMaterial && (
            <div className="flex items-center justify-between gap-x-2 pt-0.5">
              <span className="text-xs text-muted-foreground">Disponible:</span>
              <span
                className={cn(
                  "text-xs font-bold tabular-nums",
                  selectedMaterial.quantity < 5
                    ? "text-destructive"
                    : "text-emerald-600"
                )}
              >
                {selectedMaterial.quantity.toFixed(1)} {selectedMaterial.unit}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Tipo de prenda
          </Label>
          <Select
            value={form.watch(`items.${index}.garment_type`) || "shirt"}
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
            <SelectTrigger className="h-10 w-full text-sm">
              <SelectValue />
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

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Talla
          </Label>
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
            <SelectTrigger className="h-10 w-full text-sm">
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

        <div className="space-y-1.5">
          <Label
            htmlFor={`color-${fieldId}`}
            className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Color / Variante
          </Label>
          <Input
            id={`color-${fieldId}`}
            type="text"
            inputMode="text"
            {...form.register(`items.${index}.color`)}
            className="h-10 text-sm"
            placeholder="Ej. Rojo coral"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor={`quantity-${fieldId}`}
            className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Cantidad (piezas)
          </Label>
          <Input
            id={`quantity-${fieldId}`}
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            {...form.register(`items.${index}.quantity`, {
              valueAsNumber: true,
            })}
            className="h-10 text-sm font-semibold tabular-nums"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor={`yards-${fieldId}`}
            className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Consumo (yardas)
          </Label>
          <Input
            id={`yards-${fieldId}`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            {...form.register(`items.${index}.yards_used`, {
              valueAsNumber: true,
            })}
            className="h-10 text-sm font-semibold tabular-nums"
          />
        </div>
      </div>

      {/* Card footer */}
      <div className="mt-3.5 flex flex-col gap-3 border-t border-border/50 pt-3.5 sm:gap-4">
        <label
          htmlFor={`reuse-${fieldId}`}
          className="flex cursor-pointer items-start gap-2.5 select-none sm:items-center"
        >
          <Checkbox
            id={`reuse-${fieldId}`}
            checked={itemIsReuse}
            onCheckedChange={(checked) =>
              form.setValue(`items.${index}.is_reuse`, checked === true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className="mt-0.5 size-4 sm:mt-0"
          />
          <div className="grid gap-0.5 leading-none">
            <span className="text-xs font-semibold">
              Reutilización de material
            </span>
            <span className="text-[11px] text-muted-foreground">
              {itemIsReuse
                ? "No afectará el stock actual"
                : "Se descontará del inventario"}
            </span>
          </div>
        </label>

        <div className="w-full">
          <Input
            {...form.register(`items.${index}.notes`)}
            placeholder="Nota opcional por ítem..."
            className="h-12 border-dashed bg-transparent text-xs"
            aria-label={`Nota para línea ${index + 1}`}
          />
        </div>
      </div>
    </div>
  )
}
