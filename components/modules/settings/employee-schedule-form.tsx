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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

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

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
}

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Resumen Visual del Horario ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Resumen del Horario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Entrada</p>
              <p className="font-semibold">{checkIn}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Salida</p>
              <p className="font-semibold">{checkOut}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tolerancia</p>
              <p className="font-semibold">{lateTolerance} min</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Días laborales</p>
              <p className="font-semibold">{workDays.length}/7</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Horarios ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Horarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Entrada */}
            <div className="space-y-2">
              <Label htmlFor="checkIn">Hora de Entrada *</Label>
              <Input
                id="checkIn"
                type="time"
                {...form.register("expectedCheckIn")}
              />
            </div>

            {/* Salida */}
            <div className="space-y-2">
              <Label htmlFor="checkOut">Hora de Salida *</Label>
              <Input
                id="checkOut"
                type="time"
                {...form.register("expectedCheckOut")}
              />
            </div>

            {/* Inicio almuerzo */}
            <div className="space-y-2">
              <Label htmlFor="lunchStart">Inicio Almuerzo (Opcional)</Label>
              <Input
                id="lunchStart"
                type="time"
                {...form.register("expectedLunchStart")}
              />
            </div>

            {/* Fin almuerzo */}
            <div className="space-y-2">
              <Label htmlFor="lunchEnd">Fin Almuerzo (Opcional)</Label>
              <Input
                id="lunchEnd"
                type="time"
                {...form.register("expectedLunchEnd")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Tolerancia ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tolerancia de Retraso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minutos permitidos</Label>
              <span className="text-sm font-semibold text-primary">
                {lateTolerance} min
              </span>
            </div>
            <Slider
              value={[lateTolerance]}
              onValueChange={(value) =>
                form.setValue("lateTolerance", value[0])
              }
              min={0}
              max={60}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Rango: 0 a 60 minutos. Después de este tiempo, se registra como
              tardanza.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Días Laborales ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            Días Laborales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup
            type="multiple"
            value={workDays.map(String)}
            onValueChange={(values) =>
              form.setValue("workDays", values.map(Number))
            }
            className="justify-start"
          >
            {DAYS.map((day) => (
              <ToggleGroupItem
                key={day.value}
                value={String(day.value)}
                aria-label={DAY_LABELS[day.value]}
                className="h-9 w-9 text-xs"
                title={DAY_LABELS[day.value]}
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            Selecciona los días en que el empleado trabaja.
          </p>
        </CardContent>
      </Card>

      {/* ── Estado ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Horario activo</Label>
              <p className="text-xs text-muted-foreground">
                Habilita el registro de asistencia para este horario.
              </p>
            </div>
            <Switch
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ── Botón de Envío ── */}
      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {initialData ? "Guardar cambios" : "Crear horario"}
      </Button>
    </form>
  )
}
