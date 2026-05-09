"use client"

import { z } from "zod"
import { toast } from "sonner"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { leaveRequestSchema } from "@/lib/validations/attendance"

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

type LeaveRequestValues = z.infer<typeof leaveRequestSchema>

type LeaveRequestFormProps = {
  onSuccess?: () => void
  employeeId?: string
  endpoint?: string
  submitLabel?: string
}

const LEAVE_TYPE_LABELS: Record<LeaveRequestValues["leaveType"], string> = {
  vacation: "Vacaciones",
  medical: "Permiso Médico",
  personal: "Asunto Personal",
  training: "Capacitación",
  other: "Otro",
}

function formatDateLabel(value: string) {
  return format(parseISO(value), "PPP", { locale: es })
}

export function LeaveRequestForm({
  onSuccess,
  employeeId,
  endpoint = "/api/attendance/leave",
  submitLabel = "Solicitar permiso",
}: LeaveRequestFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<LeaveRequestValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveDate: new Date().toISOString().slice(0, 10),
      leaveType: "personal",
      reason: "",
    },
  })

  const leaveDate = form.watch("leaveDate")

  const onSubmit = async (values: LeaveRequestValues) => {
    setIsSaving(true)
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Error al solicitar permiso")
      }
      toast.success("Permiso solicitado correctamente")
      form.reset()
      if (employeeId) {
         Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "history"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "summary"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "report"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "employee"] })
      ])
      }
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al solicitar permiso"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4">
      <div className="space-y-2">
        <Label>Fecha del permiso *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !leaveDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {leaveDate ? formatDateLabel(leaveDate) : "Selecciona una fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={leaveDate ? parseISO(leaveDate) : undefined}
              onSelect={(value) => {
                if (value) {
                  form.setValue("leaveDate", format(value, "yyyy-MM-dd"), {
                    shouldValidate: true,
                  })
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.leaveDate ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.leaveDate.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Tipo de permiso *</Label>
        <Select
          value={form.watch("leaveType")}
          onValueChange={(v) =>
            form.setValue("leaveType", v as LeaveRequestValues["leaveType"], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Motivo detallado *</Label>
        <Textarea
          {...form.register("reason")}
          placeholder="Explica el motivo de tu ausencia..."
          rows={4}
        />
        {form.formState.errors.reason ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.reason.message as string}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-center pb-4">
        <Button type="submit" disabled={isSaving} className="w-full gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
