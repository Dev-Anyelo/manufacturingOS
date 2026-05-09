"use client"

import { toast } from "sonner"
import { es } from "date-fns/locale"
import { useState, useEffect } from "react"
import { format, subMonths } from "date-fns"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TIMEZONE } from "@/lib/attendance/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { LeaveRequestForm } from "./leave-request-form"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  LogIn,
  LogOut,
  UtensilsCrossed,
  CheckCheck,
  ChevronDown,
  Clock,
  Zap,
  CalendarCheck,
  CalendarDays,
  Loader2,
  Plus,
} from "lucide-react"

function formatTime(dateStr: string | null) {
  if (!dateStr) return "—"
  // Needs to convert UTC string to Nicaraguan time?
  // No, dateStr from Prisma is ISO, we assume it's correctly handled or we format it.
  const d = new Date(dateStr)
  return d.toLocaleTimeString("es-NI", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  on_time: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    label: "A tiempo",
  },
  late: {
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    label: "Tarde",
  },
  early_exit: {
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    label: "Salida temprana",
  },
  absent: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Ausente",
  },
  permission: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    label: "Permiso",
  },
  incomplete: {
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    label: "Incompleto",
  },
  no_schedule: {
    color: "bg-muted/50 text-muted-foreground border-border",
    label: "Sin horario",
  },
}

const LEAVE_STATUS: Record<string, { color: string; label: string }> = {
  pending: {
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    label: "Pendiente",
  },
  approved: {
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    label: "Aprobado",
  },
  rejected: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Rechazado",
  },
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  medical: "Médico",
  personal: "Personal",
  training: "Capacitación",
  other: "Otro",
}

export function EmployeeAttendanceView({ employeeId }: { employeeId: string }) {
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [earlyExitNote, setEarlyExitNote] = useState("")

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // 1. Fetch Today
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/today")
      if (!res.ok) throw new Error("Error fetching today")
      return res.json()
    },
  })

  // 2. Fetch History
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["attendance", "history", selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/history?month=${selectedMonth}`)
      if (!res.ok) throw new Error("Error fetching history")
      return res.json()
    },
  })

  // 3. Fetch Leaves
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ["attendance", "leaves"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/leave")
      if (!res.ok) throw new Error("Error fetching leaves")
      return res.json()
    },
  })

  const record = todayData?.data?.record
  const schedule = todayData?.data?.schedule

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ action, note }: { action: string; note?: string }) => {
      const res = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al procesar")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Registro actualizado")
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "history"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "summary"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "report"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "employee"] })
      ])
    },
    onError: (err) => toast.error(err.message),
  })

  // Resolve Header Badge
  let headerBadge = {
    label: "Sin registrar",
    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    pulsate: false,
  }
  if (record) {
    if (record.checkOutAt) {
      headerBadge = {
        label: "Completada",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        pulsate: false,
      }
    } else if (record.lunchStartAt && !record.lunchEndAt) {
      headerBadge = {
        label: "En almuerzo",
        color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        pulsate: false,
      }
    } else if (record.checkInAt) {
      headerBadge = {
        label: "En turno",
        color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        pulsate: true,
      }
    }
  }

  // Derived History Stats
  const records = historyData?.data || []
  const workedDays = records.filter((r: any) =>
    ["on_time", "late", "early_exit", "incomplete"].includes(r.status)
  ).length
  const tardiness = records.filter(
    (r: any) =>
      r.status === "late" || (r.checkInLateMinutes && r.checkInLateMinutes > 0)
  ).length
  const absences = records.filter((r: any) => r.status === "absent").length
  const totalMinutes = records.reduce(
    (acc: number, r: any) => acc + (r.totalWorkedMinutes || 0),
    0
  )
  const totalHours = Math.floor(totalMinutes / 60)

  // Determine main action button
  let mainAction = null
  let isEarlyExit = false

  if (todayLoading) {
    mainAction = <Skeleton className="h-12 w-full" />
  } else if (!record || !record.checkInAt) {
    mainAction = (
      <Button
        size="sm"
        onClick={() => actionMutation.mutate({ action: "check-in" })}
        disabled={actionMutation.isPending}
      >
        <LogIn className="size-4" /> Registrar entrada
      </Button>
    )
  } else if (!record.checkOutAt) {
    if (schedule?.expectedLunchStart && !record.lunchStartAt) {
      mainAction = (
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-full gap-2 border-amber-500/50 text-base text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
          onClick={() => actionMutation.mutate({ action: "lunch-start" })}
          disabled={actionMutation.isPending}
        >
          <UtensilsCrossed className="size-4" /> Iniciar almuerzo
        </Button>
      )
    } else if (
      schedule?.expectedLunchStart &&
      record.lunchStartAt &&
      !record.lunchEndAt
    ) {
      mainAction = (
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-full gap-2 border-amber-500/50 text-base text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
          onClick={() => actionMutation.mutate({ action: "lunch-end" })}
          disabled={actionMutation.isPending}
        >
          <CheckCheck className="size-4" /> Fin de almuerzo
        </Button>
      )
    } else {
      isEarlyExit = true
      mainAction = (
        <div className="space-y-3">
          <Button
            size="lg"
            className="h-14 w-full gap-2 bg-blue-600 text-base text-white hover:bg-blue-700"
            onClick={() =>
              actionMutation.mutate({
                action: "check-out",
                note: earlyExitNote,
              })
            }
            disabled={actionMutation.isPending}
          >
            <LogOut className="size-4" /> Registrar salida
          </Button>
          <Input
            placeholder="Motivo (si es salida temprana)..."
            value={earlyExitNote}
            onChange={(e) => setEarlyExitNote(e.target.value)}
            className="text-sm"
          />
        </div>
      )
    }
  } else {
    mainAction = (
      <Button
        size="lg"
        disabled
        className="h-14 w-full gap-2 bg-emerald-600 text-base text-white opacity-100"
      >
        <CheckCheck className="size-4" /> Jornada completada
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Asistencia"
        description="Registra tu jornada y consulta tu historial"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Asistencia" },
        ]}
        actions={
          <Badge
            variant="outline"
            className={`${headerBadge.color} ${headerBadge.pulsate ? "animate-pulse" : ""} px-3 py-1 text-sm`}
          >
            {headerBadge.label}
          </Badge>
        }
      />

      {/* Card principal del día */}
      <Card className="mt-4 overflow-hidden border-border/70 shadow-sm">
        <div className="grid divide-y divide-border/60 md:grid-cols-[1fr_300px] md:divide-x md:divide-y-0">
          <CardContent className="flex flex-col justify-center gap-3 px-4 py-0">
            <div className="space-y-1">
              <p className="text-xl font-light tracking-tight text-pretty tabular-nums md:text-3xl">
                {currentTime.toLocaleTimeString("es-NI", {
                  timeZone: TIMEZONE,
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm font-medium tracking-wider text-pretty text-muted-foreground uppercase">
                {format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div className="max-w-md">{mainAction}</div>
          </CardContent>

          <CardContent className="bg-muted/10 p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Timeline de hoy
            </h3>
            <div className="relative space-y-5 before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:-translate-x-px before:bg-linear-to-b before:from-transparent before:via-border before:to-transparent md:before:mx-auto md:before:translate-x-0">
              <div className="group is-active relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                <div className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground">
                  <LogIn className="size-3" />
                </div>
                <div className="ml-4 w-[calc(100%-2.5rem)] text-sm md:ml-0 md:w-[calc(50%-1.5rem)] md:group-odd:pr-6 md:group-even:pl-6">
                  <div className="font-medium">Entrada</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {formatTime(record?.checkInAt)}
                    {record?.checkInLateMinutes ? (
                      <Badge
                        variant="outline"
                        className="h-4 border-amber-500/20 bg-amber-500/10 px-1 py-0 text-[10px] text-amber-600"
                      >
                        {record.checkInLateMinutes}m tarde
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {schedule?.expectedLunchStart && (
                <>
                  <div className="group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                    <div className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground">
                      <UtensilsCrossed className="size-3" />
                    </div>
                    <div className="ml-4 w-[calc(100%-2.5rem)] text-sm md:ml-0 md:w-[calc(50%-1.5rem)] md:group-odd:pr-6 md:group-even:pl-6">
                      <div className="font-medium">Inicio almuerzo</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(record?.lunchStartAt)}
                      </div>
                    </div>
                  </div>

                  <div className="group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                    <div className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground">
                      <CheckCheck className="size-3" />
                    </div>
                    <div className="ml-4 w-[calc(100%-2.5rem)] text-sm md:ml-0 md:w-[calc(50%-1.5rem)] md:group-odd:pr-6 md:group-even:pl-6">
                      <div className="font-medium">Fin almuerzo</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(record?.lunchEndAt)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse">
                <div className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground">
                  <LogOut className="size-3" />
                </div>
                <div className="ml-4 w-[calc(100%-2.5rem)] text-sm md:ml-0 md:w-[calc(50%-1.5rem)] md:group-odd:pr-6 md:group-even:pl-6">
                  <div className="font-medium">Salida</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(record?.checkOutAt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Resumen del mes */}
      <Collapsible className="rounded-xl border border-border/70 bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl p-4 font-medium transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-muted-foreground" />
            Resumen del mes (
            {format(new Date(selectedMonth + "-01"), "MMMM", { locale: es })})
          </div>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-3 p-4 pt-0 grid-cols-2 lg:grid-cols-4">
            <CompactKpiCard
              label="Días trabajados"
              value={workedDays}
              icon={<CalendarDays />}
              iconClass="bg-emerald-500/10 text-emerald-600"
            />
            <CompactKpiCard
              label="Tardanzas"
              value={tardiness}
              icon={<Clock />}
              iconClass="bg-amber-500/10 text-amber-600"
            />
            <CompactKpiCard
              label="Ausencias"
              value={absences}
              icon={<Zap />}
              iconClass="bg-destructive/10 text-destructive"
            />
            <CompactKpiCard
              label="Horas totales"
              value={`${totalHours}h`}
              icon={<Clock />}
              iconClass="bg-blue-500/10 text-blue-600"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Mis solicitudes de permiso */}
      <Collapsible
        defaultOpen
        className="rounded-xl border border-border/70 bg-card"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl p-4 font-medium transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            Mis solicitudes de permiso
          </div>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 p-4 pt-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <Plus className="size-4" />
              Solicitar permiso
            </Button>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leavesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto size-4 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : leavesData?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Sin solicitudes
                      </TableCell>
                    </TableRow>
                  ) : (
                    leavesData?.data?.slice(0, 5).map((l: any) => {
                      const st = LEAVE_STATUS[l.status] || LEAVE_STATUS.pending
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(l.leaveDate), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            {LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={st.color}>
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {l.reason}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Mi historial */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border/70 p-4 sm:flex-row sm:items-center">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4 text-muted-foreground" />
            Mi historial
          </h3>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 6 }).map((_, i) => {
                const d = subMonths(new Date(), i)
                const val = format(d, "yyyy-MM")
                return (
                  <SelectItem key={val} value={val}>
                    {format(d, "MMMM yyyy", { locale: es })}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay registros para este mes.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r: any) => {
                  const cfg =
                    STATUS_CONFIG[r.status] || STATUS_CONFIG.incomplete
                  const hrs = r.totalWorkedMinutes
                    ? Math.floor(r.totalWorkedMinutes / 60)
                    : 0
                  const mins = r.totalWorkedMinutes
                    ? r.totalWorkedMinutes % 60
                    : 0
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(r.date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {formatTime(r.checkInAt)}
                        {r.checkInLateMinutes ? (
                          <span className="block text-[10px] text-amber-600">
                            +{r.checkInLateMinutes}m
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatTime(r.checkOutAt)}</TableCell>
                      <TableCell>
                        {r.totalWorkedMinutes ? `${hrs}h ${mins}m` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.color}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader className="px-4 py-4">
            <DialogTitle>Solicitar permiso</DialogTitle>
            <DialogDescription>
              Completa el formulario para solicitar un permiso.
            </DialogDescription>
          </DialogHeader>
          <LeaveRequestForm onSuccess={() => setLeaveDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
