'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { scheduleSchema } from '@/lib/validations/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const DAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
]

export function EmployeeScheduleForm({ employeeId, initialData }: { employeeId: string, initialData: any }) {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      expectedCheckIn: initialData?.expectedCheckIn || '07:00',
      expectedLunchStart: initialData?.expectedLunchStart || '12:00',
      expectedLunchEnd: initialData?.expectedLunchEnd || '13:00',
      expectedCheckOut: initialData?.expectedCheckOut || '17:00',
      lateTolerance: initialData?.lateTolerance ?? 15,
      workDays: initialData?.workDays || [1, 2, 3, 4, 5],
      isActive: initialData?.isActive ?? true,
    }
  })

  const onSubmit = async (values: any) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/settings/users/${employeeId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (!res.ok) throw new Error('Error al guardar el horario')
      toast.success('Horario guardado correctamente')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-xl border p-6 bg-card">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hora de entrada</Label>
          <Input type="time" {...form.register('expectedCheckIn')} />
        </div>
        <div className="space-y-2">
          <Label>Hora de salida</Label>
          <Input type="time" {...form.register('expectedCheckOut')} />
        </div>
        <div className="space-y-2">
          <Label>Inicio de almuerzo</Label>
          <Input type="time" {...form.register('expectedLunchStart')} />
        </div>
        <div className="space-y-2">
          <Label>Fin de almuerzo</Label>
          <Input type="time" {...form.register('expectedLunchEnd')} />
        </div>
        <div className="space-y-2">
          <Label>Tolerancia (minutos)</Label>
          <Input type="number" {...form.register('lateTolerance', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Días laborales</Label>
        <div className="flex flex-wrap gap-4">
          {DAYS.map(day => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`day-${day.value}`} 
                checked={form.watch('workDays').includes(day.value)}
                onCheckedChange={(checked) => {
                  const current = form.getValues('workDays')
                  if (checked) {
                    form.setValue('workDays', [...current, day.value])
                  } else {
                    form.setValue('workDays', current.filter((d: number) => d !== day.value))
                  }
                }}
              />
              <Label htmlFor={`day-${day.value}`} className="cursor-pointer">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is-active" 
          checked={form.watch('isActive')}
          onCheckedChange={(checked) => form.setValue('isActive', !!checked)}
        />
        <Label htmlFor="is-active">Horario activo</Label>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Guardar configuración
      </Button>
    </form>
  )
}
