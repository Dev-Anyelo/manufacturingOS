"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Zap,
  TrendingDown,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendanceStatsData {
  attendanceRate: number
  presentDays: number
  totalDays: number
  avgMinutesPerDay: number
  lateDays: number
  absentWithoutReason: number
  distribution?: {
    on_time: number
    late: number
    early_exit: number
    absent: number
    permission: number
  }
  recentLate?: Array<{
    date: string
    minutes: number
  }>
}

interface AttendanceStatsProps {
  employeeId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttendanceStats({ employeeId }: AttendanceStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "stats", employeeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/attendance/admin/employee/${employeeId}/stats`
      )
      if (!res.ok) throw new Error("Error fetching stats")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const stats: AttendanceStatsData = data?.data

  if (!stats)
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No hay datos de asistencia disponibles
          </p>
        </CardContent>
      </Card>
    )

  const avgHours = Math.floor(stats.avgMinutesPerDay / 60)
  const avgMinutes = stats.avgMinutesPerDay % 60

  // Calcular porcentaje de cada estado
  const total =
    Object.values(stats.distribution || {}).reduce((a, b) => a + b, 0) || 1
  const statusPercentages = {
    on_time: Math.round(((stats.distribution?.on_time || 0) / total) * 100),
    late: Math.round(((stats.distribution?.late || 0) / total) * 100),
    early_exit: Math.round(
      ((stats.distribution?.early_exit || 0) / total) * 100
    ),
    absent: Math.round(((stats.distribution?.absent || 0) / total) * 100),
    permission: Math.round(
      ((stats.distribution?.permission || 0) / total) * 100
    ),
  }

  // Determinar estado general basado en porcentaje de asistencia
  const getHealthStatus = () => {
    if (stats.attendanceRate >= 95)
      return {
        status: "excellent",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200",
      }
    if (stats.attendanceRate >= 85)
      return {
        status: "good",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
      }
    if (stats.attendanceRate >= 75)
      return {
        status: "warning",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
      }
    return {
      status: "critical",
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/30",
    }
  }

  const health = getHealthStatus()

  return (
    <div className="space-y-6">
      {/* Health Summary Card */}
      <Card className={cn("border-2", health.bg)}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p
                className={cn(
                  "text-sm font-medium tracking-wide uppercase",
                  health.color
                )}
              >
                Estado General de Asistencia
              </p>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-4xl font-bold", health.color)}>
                  {stats.attendanceRate}%
                </span>
                <span className="text-sm text-muted-foreground">
                  ({stats.presentDays} de {stats.totalDays} días)
                </span>
              </div>
            </div>
            <div className={cn("rounded-lg p-3", health.bg)}>
              {health.status === "excellent" && (
                <TrendingUp className={cn("size-6", health.color)} />
              )}
              {health.status === "good" && (
                <CheckCircle2 className={cn("size-6", health.color)} />
              )}
              {health.status === "warning" && (
                <AlertCircle className={cn("size-6", health.color)} />
              )}
              {health.status === "critical" && (
                <TrendingDown className={cn("size-6", health.color)} />
              )}
            </div>
          </div>
          <div className="mt-4">
            <Progress value={stats.attendanceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Promedio Diario"
          value={`${avgHours}h ${avgMinutes}m`}
          icon={<Clock className="size-5 text-blue-500" />}
        />
        <StatCard
          title="Tardanzas"
          value={`${stats.lateDays}`}
          icon={<AlertCircle className="size-5 text-amber-500" />}
        />
        <StatCard
          title="Ausentes"
          value={`${stats.absentWithoutReason}`}
          icon={<Zap className="size-5 text-destructive" />}
        />
      </div>

      {/* Distribución de estados */}
      {stats.distribution &&
        Object.values(stats.distribution).some((v) => v > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Distribución de Registros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* On Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">A tiempo</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    {stats.distribution.on_time} · {statusPercentages.on_time}%
                  </Badge>
                </div>
                <Progress value={statusPercentages.on_time} className="h-2" />
              </div>

              {/* Late */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Tardanza</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700"
                  >
                    {stats.distribution.late} · {statusPercentages.late}%
                  </Badge>
                </div>
                <Progress value={statusPercentages.late} className="h-2" />
              </div>

              {/* Early Exit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Salida Temprana</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-orange-200 bg-orange-50 text-orange-700"
                  >
                    {stats.distribution.early_exit} ·{" "}
                    {statusPercentages.early_exit}%
                  </Badge>
                </div>
                <Progress
                  value={statusPercentages.early_exit}
                  className="h-2"
                />
              </div>

              {/* Permission */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Permiso Autorizado</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700"
                  >
                    {stats.distribution.permission} ·{" "}
                    {statusPercentages.permission}%
                  </Badge>
                </div>
                <Progress
                  value={statusPercentages.permission}
                  className="h-2"
                />
              </div>

              {/* Absent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Ausente</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 text-destructive"
                  >
                    {stats.distribution.absent} · {statusPercentages.absent}%
                  </Badge>
                </div>
                <Progress value={statusPercentages.absent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

      {/* Últimas tardanzas */}
      {stats.recentLate && stats.recentLate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Últimas Tardanzas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentLate.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm transition-colors hover:bg-amber-100/50"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 font-semibold text-amber-700"
                  >
                    +{item.minutes}m
                  </Badge>
                </div>
              ))}
              {stats.recentLate.length > 5 && (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  +{stats.recentLate.length - 5} registros más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
