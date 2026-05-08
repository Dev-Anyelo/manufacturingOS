"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leaveRequestSchema } from "@/lib/validations/attendance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LeaveRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveDate: "",
      leaveType: "personal" as "other" | "vacation" | "medical" | "personal" | "training",
      reason: "",
    },
  })

  const onSubmit = async (values: any) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/attendance/leave`, {
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
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input type="date" {...form.register("leaveDate")} />
        {form.formState.errors.leaveDate && (
          <p className="text-xs text-destructive">
            {form.formState.errors.leaveDate.message as string}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de Permiso</Label>
        <Select
          value={form.watch("leaveType")}
          onValueChange={(v) => form.setValue("leaveType", v as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona el tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vacation">Vacaciones</SelectItem>
            <SelectItem value="medical">Cita Médica</SelectItem>
            <SelectItem value="personal">Asunto Personal</SelectItem>
            <SelectItem value="training">Capacitación</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Motivo detallado</Label>
        <Textarea
          {...form.register("reason")}
          placeholder="Explica el motivo de tu ausencia..."
          rows={3}
        />
        {form.formState.errors.reason && (
          <p className="text-xs text-destructive">
            {form.formState.errors.reason.message as string}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSaving} className="w-full">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar Solicitud
      </Button>
    </form>
  )
}
