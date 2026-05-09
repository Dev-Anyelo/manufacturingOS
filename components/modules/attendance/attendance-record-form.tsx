"use client"

import * as z from "zod"
import { toast } from "sonner"
import * as React from "react"
import { cn } from "@/lib/utils"
import { es } from "date-fns/locale"
import { format, parseISO } from "date-fns"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { Separator } from "@/components/ui/separator"
import { useQueryClient } from "@tanstack/react-query"
import { adminCreateRecordSchema } from "@/lib/validations/attendance"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  CalendarIcon,
  Loader2,
  CheckCircle2,
  User,
  Clock,
  Coffee,
  Info,
  CalendarDays,
  FileText,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type AttendanceRecordInput = z.infer<typeof adminCreateRecordSchema>

type AttendanceRecordFormProps = {
  employeeId: string
  employeeName: string
  recordId?: string
  onSuccess?: () => void
}

function toDateLabel(value: string) {
  return format(parseISO(value), "PPP", { locale: es })
}

function toDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

/**
 * Custom Time Selector (Uniform with EmployeeScheduleForm)
 */
function TimeField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string
  value: string | null
  onChange: (val: string) => void
  required?: boolean
}) {
  const [h24Str, minStr] = (value || "08:00").split(":")
  const h24 = parseInt(h24Str) || 0
  const minutes = minStr || "00"

  const period = h24 >= 12 ? "PM" : "AM"
  const h12 = h24 % 12 || 12
  const hourString = h12.toString().padStart(2, "0")

  const handleHourChange = (newH12: string) => {
    let newH24 = parseInt(newH12)
    if (period === "PM" && newH24 < 12) newH24 += 12
    if (period === "AM" && newH24 === 12) newH24 = 0
    onChange(`${newH24.toString().padStart(2, "0")}:${minutes}`)
  }

  const handleMinuteChange = (newMin: string) => {
    onChange(`${h24.toString().padStart(2, "0")}:${newMin}`)
  }

  const handlePeriodChange = (newPeriod: string) => {
    if (!newPeriod) return
    let newH24 = h24
    if (newPeriod === "PM" && h24 < 12) newH24 += 12
    if (newPeriod === "AM" && h24 >= 12) newH24 -= 12
    onChange(`${newH24.toString().padStart(2, "0")}:${minutes}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-1">
        <div className="flex flex-1 items-center rounded-xl border bg-background px-1 py-0.5 shadow-sm focus-within:ring-1 focus-within:ring-primary/20">
          <Select value={hourString} onValueChange={handleHourChange}>
            <SelectTrigger className="h-8 border-none bg-transparent font-bold tabular-nums shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[70px]">
              {Array.from({ length: 12 }, (_, i) =>
                (i + 1).toString().padStart(2, "0")
              ).map((h) => (
                <SelectItem key={h} value={h} className="text-xs font-medium">
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="px-0.5 font-bold text-muted-foreground/30">:</span>

          <Select value={minutes} onValueChange={handleMinuteChange}>
            <SelectTrigger className="h-8 border-none bg-transparent font-bold tabular-nums shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[70px]">
              {Array.from({ length: 60 }, (_, i) =>
                i.toString().padStart(2, "0")
              ).map((m) => (
                <SelectItem key={m} value={m} className="text-xs font-medium">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ToggleGroup
          type="single"
          value={period}
          onValueChange={handlePeriodChange}
          className="flex h-10 items-center rounded-xl border bg-muted/10 p-1"
        >
          <ToggleGroupItem
            value="AM"
            className="h-full px-2 text-[10px] font-bold data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-xs"
          >
            AM
          </ToggleGroupItem>
          <ToggleGroupItem
            value="PM"
            className="h-full px-2 text-[10px] font-bold data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-xs"
          >
            PM
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

export function AttendanceRecordForm({
  employeeId,
  employeeName,
  recordId,
  onSuccess,
}: AttendanceRecordFormProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const queryClient = useQueryClient()

  const form = useForm<AttendanceRecordInput>({
    resolver: zodResolver(adminCreateRecordSchema),
    defaultValues: {
      date: toDateInputValue(),
      checkInAt: "08:00",
      lunchStartAt: "",
      lunchEndAt: "",
      checkOutAt: "17:00",
      notes: "",
      reason: "Registro manual autorizado",
    },
  })

  const selectedDate = form.watch("date")

  const onSubmit = async (values: AttendanceRecordInput) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/attendance/admin/employee/${employeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || "No se pudo guardar el registro")
      }

      toast.success("Registro manual guardado")
      await queryClient.invalidateQueries({
        queryKey: ["attendance"],
      })
      onSuccess?.()
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Información del Empleado */}
      <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card px-4 py-3 transition-all hover:border-primary/20 hover:shadow-sm">
        <div className="relative flex items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <User className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground/80 uppercase">
              Empleado Seleccionado
            </p>
            <p className="text-base font-black tracking-tight text-foreground">
              {employeeName || (
                <span className="text-xs text-muted-foreground italic">
                  Selecciona un empleado
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Metadata: Fecha y Razón */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            <CalendarDays className="size-3" /> Fecha del registro
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 w-full justify-start rounded-xl border-dashed px-4 text-left font-semibold hover:border-primary/30 hover:bg-primary/5",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 size-4 text-primary" />
                {selectedDate ? toDateLabel(selectedDate) : "Selecciona fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? parseISO(selectedDate) : undefined}
                onSelect={(value) => {
                  if (value) {
                    form.setValue("date", format(value, "yyyy-MM-dd"), {
                      shouldValidate: true,
                    })
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            <FileText className="size-3" /> Motivo / Razón
          </Label>
          <Input
            {...form.register("reason")}
            className="h-11 rounded-xl border-none bg-muted/20 px-4 font-medium focus-visible:ring-primary/30"
            placeholder="Ej: Olvidó marcar entrada"
          />
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Sección de Horarios */}
      <div className="grid gap-6">
        {/* Jornada Principal */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-emerald-500/10 p-1 text-emerald-600">
                <Clock className="size-3.5" />
              </div>
              <span className="text-[11px] font-black tracking-widest text-foreground/80 uppercase">
                Horario de Trabajo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Controller
              name="checkInAt"
              control={form.control}
              render={({ field }) => (
                <TimeField
                  label="Entrada"
                  value={field.value}
                  onChange={field.onChange}
                  required
                />
              )}
            />
            <Controller
              name="checkOutAt"
              control={form.control}
              render={({ field }) => (
                <TimeField
                  label="Salida"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        {/* Receso */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-amber-500/10 p-1 text-amber-600">
              <Coffee className="size-3.5" />
            </div>
            <span className="text-[11px] font-black tracking-widest text-foreground/80 uppercase">
              Receso de Almuerzo
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              name="lunchStartAt"
              control={form.control}
              render={({ field }) => (
                <TimeField
                  label="Inicia Almuerzo"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              name="lunchEndAt"
              control={form.control}
              render={({ field }) => (
                <TimeField
                  label="Termina Almuerzo"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-pretty">
            <Info className="mt-0.5 size-3 text-amber-600" />
            <p className="text-xs leading-relaxed font-medium text-pretty text-amber-800 dark:text-amber-300">
              Opcional. El sistema deducirá automáticamente este tiempo del
              total laborado.
            </p>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label className="text-xs font-bold tracking-widest text-muted-foreground/70 uppercase">
          Observaciones Adicionales
        </Label>
        <Textarea
          id="notes"
          rows={3}
          {...form.register("notes")}
          placeholder="Escriba aquí cualquier detalle extra..."
        />
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3 pt-2 pb-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => form.reset()}
          disabled={isSaving}
        >
          Limpiar
        </Button>
        <Button type="submit" disabled={isSaving} size="sm">
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Guardar registro
        </Button>
      </div>
    </form>
  )
}
