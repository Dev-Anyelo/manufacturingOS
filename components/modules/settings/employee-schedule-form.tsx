"use client"

import * as z from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { scheduleSchema } from "@/lib/validations/attendance"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  Loader2,
  Clock,
  Calendar,
  Info,
  Timer,
  CheckCircle2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ScheduleFormValues = z.infer<typeof scheduleSchema>

interface EmployeeScheduleFormProps {
  employeeId: string
  initialData: {
    id: string
    expectedCheckIn: string
    expectedLunchStart: string | null
    expectedLunchEnd: string | null
    expectedCheckOut: string
    lateTolerance: number
    workDays: number[]
    isActive: boolean
  } | null
}

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Custom Time Selector using Selects for a professional look
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
  // Safe parsing for HH:mm
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
    <div className="space-y-2">
      <Label className="text-xs font-bold tracking-wider text-pretty text-muted-foreground/80 uppercase">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-lg border bg-background p-1 shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-primary/20">
          <Select value={hourString} onValueChange={handleHourChange}>
            <SelectTrigger className="h-8 w-[64px] border-none bg-transparent font-bold tabular-nums shadow-none focus:ring-0">
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

          <span className="px-0.5 font-bold text-muted-foreground/50">:</span>

          <Select value={minutes} onValueChange={handleMinuteChange}>
            <SelectTrigger className="h-8 w-[64px] border-none bg-transparent font-bold tabular-nums shadow-none focus:ring-0">
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
          className="flex h-10 items-center rounded-lg border bg-muted/20 p-1"
        >
          <ToggleGroupItem
            value="AM"
            className="h-full px-2.5 text-xs font-bold data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
          >
            AM
          </ToggleGroupItem>
          <ToggleGroupItem
            value="PM"
            className="h-full px-2.5 text-xs font-bold data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
          >
            PM
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EmployeeScheduleForm({
  employeeId,
  initialData,
}: EmployeeScheduleFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      expectedCheckIn: initialData?.expectedCheckIn || "08:00",
      expectedLunchStart: initialData?.expectedLunchStart || "12:00",
      expectedLunchEnd: initialData?.expectedLunchEnd || "13:00",
      expectedCheckOut: initialData?.expectedCheckOut || "17:00",
      lateTolerance: initialData?.lateTolerance ?? 15,
      workDays: initialData?.workDays || [1, 2, 3, 4, 5],
      isActive: initialData?.isActive ?? true,
    },
  })

  const lateTolerance = form.watch("lateTolerance")
  const workDays = form.watch("workDays")
  const checkIn = form.watch("expectedCheckIn")
  const checkOut = form.watch("expectedCheckOut")
  const isActive = form.watch("isActive")

  const onSubmit = async (values: ScheduleFormValues) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/settings/users/${employeeId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Error al guardar el horario")
      toast.success("Horario guardado correctamente")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const setTolerance = (val: number) => form.setValue("lateTolerance", val)

  const formatTime12 = (time24: string) => {
    if (!time24) return "—"
    const [h, m] = time24.split(":")
    const hNum = parseInt(h)
    const period = hNum >= 12 ? "PM" : "AM"
    const h12 = hNum % 12 || 12
    return `${h12}:${m} ${period}`
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
      {/* ── Dashboard Stats ── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CompactKpiCard
          label="Entrada"
          value={formatTime12(checkIn)}
          icon={<Clock className="size-4 text-emerald-500" />}
        />
        <CompactKpiCard
          label="Salida"
          value={formatTime12(checkOut)}
          icon={<Clock className="size-4 text-blue-500" />}
        />
        <CompactKpiCard
          label="Gracia"
          value={`${lateTolerance} min`}
          icon={<Info className="size-4 text-amber-500" />}
        />
        <CompactKpiCard
          label="Días"
          value={`${workDays.length}/7`}
          icon={<Calendar className="size-4 text-primary" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Columna Principal: Horarios */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="overflow-hidden pt-0 shadow-none transition-all hover:border-border/80">
            <CardHeader className="bg-muted/30 px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                  <Clock className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight uppercase">
                    Jornada Laboral
                  </CardTitle>
                  <CardDescription className="text-xs text-pretty">
                    Define las horas exactas de entrada y salida del empleado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Controller
                  name="expectedCheckIn"
                  control={form.control}
                  render={({ field }) => (
                    <TimeField
                      label="Hora de Entrada"
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />
                <Controller
                  name="expectedCheckOut"
                  control={form.control}
                  render={({ field }) => (
                    <TimeField
                      label="Hora de Salida"
                      value={field.value}
                      onChange={field.onChange}
                      required
                    />
                  )}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 font-bold text-muted-foreground">
                    Tiempo de Almuerzo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Controller
                  name="expectedLunchStart"
                  control={form.control}
                  render={({ field }) => (
                    <TimeField
                      label="Inicio Almuerzo"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  name="expectedLunchEnd"
                  control={form.control}
                  render={({ field }) => (
                    <TimeField
                      label="Fin Almuerzo"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="rounded-lg bg-amber-50/50 p-3 dark:bg-amber-500/5">
                <div className="flex gap-2">
                  <Info className="mt-0.5 size-3.5 text-amber-600" />
                  <p className="text-xs leading-relaxed font-medium text-pretty text-amber-800 dark:text-amber-300">
                    <strong>Nota:</strong> El tiempo configurado entre el inicio
                    y fin de almuerzo será descontado automáticamente de las
                    horas laboradas totales del día.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Días de Trabajo */}
          <Card className="pt-0 shadow-none transition-all hover:border-border/80">
            <CardHeader className="px-4 py-4">
              <CardTitle className="text-sm font-bold tracking-tight uppercase">
                Días de Trabajo
              </CardTitle>
              <CardDescription className="text-xs text-pretty">
                Selecciona los días en los que el empleado debe registrar
                asistencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                type="multiple"
                value={workDays.map(String)}
                onValueChange={(v) => form.setValue("workDays", v.map(Number))}
                className="flex w-full flex-wrap gap-2"
              >
                {DAYS.map((day) => {
                  const isActiveDay = workDays.includes(day.value)
                  return (
                    <ToggleGroupItem
                      key={day.value}
                      value={String(day.value)}
                      className={cn(
                        "min-w-[60px] flex-1 rounded-xl border border-muted-foreground/20 text-xs font-semibold transition-all",
                        "hover:bg-muted/50 data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:text-primary"
                      )}
                    >
                      {day.label}
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral: Configuración Adicional */}
        <div className="space-y-3 lg:col-span-2">
          {/* Tolerancia */}
          <Card className="overflow-hidden pt-0 shadow-none transition-all hover:border-border/80">
            <CardHeader className="px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-amber-50/10 p-1.5 text-amber-600">
                  <Timer className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold tracking-tight uppercase">
                    Tolerancia de Entrada
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    0m
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black text-amber-600 tabular-nums">
                      {lateTolerance}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      minutos
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    60m
                  </span>
                </div>
                <Slider
                  value={[lateTolerance]}
                  onValueChange={(v) => setTolerance(v[0])}
                  min={0}
                  max={60}
                  step={1}
                  className="[&_.bg-primary]:bg-amber-600 **:[[role=slider]]:border-amber-600 **:[[role=slider]]:bg-amber-600"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 30].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 rounded-lg border-muted-foreground/20 text-xs font-bold uppercase transition-all",
                      lateTolerance === t &&
                        "border-amber-600 bg-amber-600/5 text-amber-600"
                    )}
                    onClick={() => setTolerance(t)}
                  >
                    {t} min
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estado de Activación */}
          <Card
            className={cn(
              "border-l-4 shadow-none transition-all",
              isActive ? "border-l-emerald-500" : "border-l-muted"
            )}
          >
            <CardContent className="px-3 py-0">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Estado del Horario</p>
                  <p className="text-xs text-pretty text-muted-foreground">
                    {isActive
                      ? "Activo y registrando asistencia"
                      : "Inactivo - El empleado no será controlado"}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(c) => form.setValue("isActive", c)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {initialData ? "Actualizar Horario" : "Configurar Horario"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
