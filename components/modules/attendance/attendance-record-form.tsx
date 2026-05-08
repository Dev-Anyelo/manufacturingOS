"use client"

import * as z from "zod"
import { toast } from "sonner"
import * as React from "react"
import { cn } from "@/lib/utils"
import { es } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { adminCreateRecordSchema } from "@/lib/validations/attendance"

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
      checkInAt: "07:00",
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
        queryKey: ["attendance", "history", employeeId],
      })
      await queryClient.invalidateQueries({
        queryKey: ["attendance", "stats", employeeId],
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Empleado
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {employeeName}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Fecha del registro *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedDate
                ? toDateLabel(selectedDate)
                : "Selecciona una fecha"}
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
        {form.formState.errors.date ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.date.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkInAt">Hora de entrada *</Label>
            <Input id="checkInAt" type="time" {...form.register("checkInAt")} />
            {form.formState.errors.checkInAt ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.checkInAt.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutAt">Hora de salida</Label>
            <Input
              id="checkOutAt"
              type="time"
              {...form.register("checkOutAt")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lunchStartAt">Inicio almuerzo</Label>
            <Input
              id="lunchStartAt"
              type="time"
              {...form.register("lunchStartAt")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lunchEndAt">Fin almuerzo</Label>
            <Input
              id="lunchEndAt"
              type="time"
              {...form.register("lunchEndAt")}
            />
            {form.formState.errors.lunchEndAt ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.lunchEndAt.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-1 space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            rows={3}
            {...form.register("notes")}
            placeholder="Ingrese notas adicionales sobre el registro manual"
          />
        </div>
        <div className="col-span-1 space-y-2 md:col-span-2">
          <Label htmlFor="reason">Razón del registro manual *</Label>
          <Textarea
            id="reason"
            rows={3}
            {...form.register("reason")}
            placeholder="Ingrese la razón del registro manual"
          />
          {form.formState.errors.reason ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.reason.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={isSaving}
        >
          Limpiar
        </Button>
        <Button type="submit" disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          Guardar registro
        </Button>
      </div>
    </form>
  )
}
