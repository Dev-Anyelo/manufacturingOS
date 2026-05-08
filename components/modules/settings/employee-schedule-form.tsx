"use client"

import * as z from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Clock, Calendar } from "lucide-react"
import { scheduleSchema } from "@/lib/validations/attendance"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  { value: 1, label: "Lu" },
  { value: 2, label: "Ma" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Ju" },
  { value: 5, label: "Vi" },
  { value: 6, label: "Sa" },
  { value: 0, label: "Do" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployeeScheduleForm({
  employeeId,
  initialData,
}: EmployeeScheduleFormProps) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      expectedCheckIn: initialData?.expectedCheckIn || "07:00",
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
      {/* ── Vista Previa ── */}
      <section className="grid w-full grid-cols-1 gap-x-3 sm:grid-cols-2 md:grid-cols-4">
        <CompactKpiCard
          label="Entrada"
          value={checkIn || "—"}
          icon={<Clock className="size-4" />}
        />
        <CompactKpiCard
          label="Salida"
          value={checkOut || "—"}
          icon={<Clock className="size-4" />}
        />
        <CompactKpiCard
          label="Tolerancia"
          value={`${lateTolerance} min`}
          icon={<Clock className="size-4" />}
        />
        <CompactKpiCard
          label="Días"
          value={`${workDays.length}/7`}
          icon={<Calendar className="size-4" />}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── Horarios ── */}
        <Card className="px-0 pt-4 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight uppercase">
              Horarios de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn" className="text-xs">
                  Hora de Entrada <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="checkIn"
                    type="time"
                    className="pl-9"
                    {...form.register("expectedCheckIn")}
                  />
                  <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut" className="text-xs">
                  Hora de Salida <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="checkOut"
                    type="time"
                    className="pl-9"
                    {...form.register("expectedCheckOut")}
                  />
                  <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunchStart" className="text-xs">
                  Inicio Almuerzo
                </Label>
                <div className="relative">
                  <Input
                    id="lunchStart"
                    type="time"
                    className="pl-9"
                    {...form.register("expectedLunchStart")}
                  />
                  <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunchEnd" className="text-xs">
                  Fin Almuerzo
                </Label>
                <div className="relative">
                  <Input
                    id="lunchEnd"
                    type="time"
                    className="pl-9"
                    {...form.register("expectedLunchEnd")}
                  />
                  <Clock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>
            <p className="text-xs text-pretty text-muted-foreground">
              Opcional. Si se configura, este tiempo se considera no laborado.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* ── Tolerancia ── */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight text-pretty uppercase">
                Minutos de Gracia (Tolerancia)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0 min</span>
                  <span className="text-sm font-bold text-amber-600">
                    {lateTolerance} minutos actuales
                  </span>
                  <span className="text-xs text-muted-foreground">60 min</span>
                </div>
                <Slider
                  value={[lateTolerance]}
                  onValueChange={(v) => setTolerance(v[0])}
                  min={0}
                  max={60}
                  step={1}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 30].map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-7 px-3 text-xs ${lateTolerance === t ? "border-primary bg-primary/5 text-primary" : ""}`}
                    onClick={() => setTolerance(t)}
                  >
                    {t} min
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Días ── */}
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight uppercase">
                Días de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ToggleGroup
                type="multiple"
                value={workDays.map(String)}
                onValueChange={(v) => form.setValue("workDays", v.map(Number))}
                className="flex w-full"
              >
                {DAYS.map((day) => (
                  <ToggleGroupItem
                    key={day.value}
                    value={String(day.value)}
                    className="flex-1 rounded-md border text-xs data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    {day.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </CardContent>
          </Card>

          {/* ── Estado ── */}
          <div className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Horario Activo</p>
              <p className="text-[11px] text-muted-foreground">
                Habilita el control de asistencia para este empleado
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(c) => form.setValue("isActive", c)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-10 min-w-40 font-semibold"
        >
          {isSaving ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Calendar className="mr-2 size-4" />
          )}
          {initialData ? "Guardar Cambios" : "Configurar Horario"}
        </Button>
      </div>
    </form>
  )
}
