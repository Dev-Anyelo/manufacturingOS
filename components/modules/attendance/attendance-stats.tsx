'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

export function AttendanceStats({ employeeId }: { employeeId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'stats', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/admin/employee/${employeeId}/stats`)
      if (!res.ok) throw new Error('Error fetching stats')
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
  }

  const stats = data?.data
  if (!stats) return null

  const avgHours = Math.floor(stats.avgMinutesPerDay / 60)
  const avgMinutes = stats.avgMinutesPerDay % 60

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asistencia (6m)</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.presentDays} días presentes de {stats.totalDays}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio Diario</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgHours}h {avgMinutes}m</div>
          <p className="text-xs text-muted-foreground">
            Basado en días laborados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tardanzas</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">{stats.lateDays}</div>
          <p className="text-xs text-muted-foreground">
            Días con llegada tarde
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ausencias sin justificar</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.absentWithoutReason}</div>
          <p className="text-xs text-muted-foreground">
            Días sin marcaje o permiso
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
