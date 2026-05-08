"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Clock, AlertCircle, CheckCircle2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"

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
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const stats: AttendanceStatsData = data?.data

  if (!stats)
    return (
      <EmptyState
        icon={<AlertCircle className="h-10 w-10 text-muted-foreground/20" />}
        title="Sin estadísticas"
        description="No hay datos suficientes."
      />
    )

  const avgHours = Math.floor(stats.avgMinutesPerDay / 60)
  const avgMinutes = stats.avgMinutesPerDay % 60

  const statusData = [
    {
      name: "A tiempo",
      value: stats.distribution?.on_time || 0,
      color: "#10b981",
    },
    {
      name: "Tardanzas",
      value: stats.distribution?.late || 0,
      color: "#f59e0b",
    },
    {
      name: "Ausencias",
      value: stats.distribution?.absent || 0,
      color: "#ef4444",
    },
    {
      name: "Permisos",
      value: stats.distribution?.permission || 0,
      color: "#3b82f6",
    },
  ].filter((d) => d.value > 0)

  const getHealthLevel = () => {
    if (stats.attendanceRate >= 95)
      return {
        label: "Excelente",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200 dark:border-emerald-800",
      }
    if (stats.attendanceRate >= 85)
      return {
        label: "Bueno",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-200 dark:border-blue-800",
      }
    if (stats.attendanceRate >= 70)
      return {
        label: "Regular",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
      }
    return {
      label: "Crítico",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
    }
  }

  const health = getHealthLevel()

  return (
    <div className="space-y-6 pb-10">
      {/* ── Health & Rate ── */}
      <div
        className={cn(
          "rounded-xl border p-3 shadow-none",
          health.bg,
          health.border
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p
              className={cn(
                "text-xs font-bold tracking-wider uppercase",
                health.color
              )}
            >
              Índice de Asistencia General
            </p>
            <div className="flex items-baseline gap-2">
              <h2
                className={cn(
                  "text-xl font-black tracking-tight tabular-nums",
                  health.color
                )}
              >
                {stats.attendanceRate}%
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "border-none text-xs font-bold uppercase",
                  health.bg,
                  health.color
                )}
              >
                {health.label}
              </Badge>
            </div>
            <p className="text-sm font-medium text-pretty text-muted-foreground/70">
              Registrado en {stats.presentDays} de {stats.totalDays} días
              laborables
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <span>Eficiencia de Puntualidad</span>
              <span>
                {Math.round(
                  ((stats.distribution?.on_time || 0) /
                    (stats.presentDays || 1)) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={stats.attendanceRate}
              className="h-3 bg-white/50"
            />
          </div>
        </div>
      </div>

      {/* ── Key Metrics ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Clock className="size-4" />}
          title="Promedio de Horas"
          value={`${avgHours}h ${avgMinutes}m`}
        />
        <StatCard
          icon={<AlertCircle className="size-4" />}
          title="Tardanzas Totales"
          value={stats.lateDays.toString()}
        />
        <StatCard
          icon={<X className="size-4" />}
          title="Inasistencias"
          value={stats.absentWithoutReason.toString()}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución Circular */}
        <Card className="rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Distribución de Estados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.name}:
                  </span>
                  <span className="text-xs font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Últimas Tardanzas (Tendencia) */}
        <Card className="rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
              Frecuencia de Tardanzas (Minutos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {stats.recentLate && stats.recentLate.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.recentLate.slice(-7)}>
                    <defs>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#999" }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMin)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-2 size-8 text-emerald-500/20" />
                  <p className="text-sm text-muted-foreground">
                    ¡Excelente puntualidad!
                  </p>
                  <p className="text-xs text-pretty text-muted-foreground/60">
                    No hay tardanzas recientes registradas.
                  </p>
                </div>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-pretty text-muted-foreground italic">
              Tendencia de los últimos 7 registros de impuntualidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
