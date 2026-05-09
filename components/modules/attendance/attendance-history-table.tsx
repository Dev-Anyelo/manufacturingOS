"use client"

import * as React from "react"
import { toast } from "sonner"
import { es } from "date-fns/locale"
import { useState, useMemo } from "react"
import { subMonths, format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/shared/stat-card"
import { formatZonedTime } from "@/lib/attendance/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AttendanceManualRecordPanel } from "@/components/modules/attendance/attendance-manual-record-panel"

import {
  MoreHorizontal,
  PencilLine,
  Plus,
  CalendarOff,
  CalendarRange,
  CalendarCheck,
  Clock,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendanceRecord {
  id: string
  date: string
  checkInAt: string | null
  checkOutAt: string | null
  lunchStartAt: string | null
  lunchEndAt: string | null
  totalWorkedMinutes: number | null
  checkInLateMinutes: number | null
  earlyExitMinutes: number | null
  status: string
  notes: string | null
}

interface AttendanceHistoryTableProps {
  employeeId: string
  employeeName?: string
  isAdmin?: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    label: "Salida temp.",
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
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    label: "Incompleto",
  },
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.incomplete
}

function formatTime(dateStr: string | null) {
  return formatZonedTime(dateStr, "hh:mm a")
}

function getWorkedHours(minutes: number | null) {
  if (!minutes || minutes === 0) return "—"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function getMonthOptions(count = 12) {
  return Array.from({ length: count }, (_, index) => {
    const date = subMonths(new Date(), index)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: es }),
    }
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttendanceHistoryTable({
  employeeId,
  employeeName,
  isAdmin = true,
}: AttendanceHistoryTableProps) {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [manualRecordOpen, setManualRecordOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null
  )
  const [editStatus, setEditStatus] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editLunchStart, setEditLunchStart] = useState("")
  const [editLunchEnd, setEditLunchEnd] = useState("")
  const monthOptions = useMemo(() => getMonthOptions(), [])

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "history", employeeId, selectedMonth],
    queryFn: async () => {
      const url = new URL(
        `/api/attendance/admin/employee/${employeeId}`,
        window.location.origin
      )
      if (selectedMonth) url.searchParams.set("month", selectedMonth)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error("Error fetching history")
      return res.json()
    },
  })

  // Records are already filtered server-side
  const records = useMemo(() => {
    return data?.data || []
  }, [data?.data])

  const handleSaveEdit = async () => {
    if (!editingRecord) return
    try {
      const res = await fetch(
        `/api/attendance/admin/employee/${employeeId}/record/${editingRecord.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: editStatus,
            notes: editNotes,
            checkInAt: editCheckIn || null,
            checkOutAt: editCheckOut || null,
            lunchStartAt: editLunchStart || null,
            lunchEndAt: editLunchEnd || null,
          }),
        }
      )
      if (!res.ok) throw new Error("Error al actualizar registro")
      toast.success("Registro actualizado")
      setEditingRecord(null)
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "history"] }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "admin", "summary"],
        }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "report"] }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "admin", "employee"],
        }),
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      toast.error(msg)
    }
  }

  // KPIs Calculation
  const kpis = useMemo(() => {
    let worked = 0
    let late = 0
    let absent = 0
    let totalMins = 0
    records.forEach((r: AttendanceRecord) => {
      if (r.status !== "absent" && r.status !== "no_schedule") worked++
      if (r.status === "late") late++
      if (r.status === "absent") absent++
      totalMins += r.totalWorkedMinutes || 0
    })
    return {
      workedDays: worked,
      lateDays: late,
      absentDays: absent,
      totalHours: Math.round(totalMins / 60),
    }
  }, [records])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const selectedMonthLabel =
    monthOptions.find((option) => option.value === selectedMonth)?.label ||
    selectedMonth

  return (
    <div className="space-y-6">
      {/* ── KPIs Compactos ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Días Lab."
          value={kpis.workedDays}
          icon={<CalendarCheck className="size-4" />}
        />
        <StatCard
          title="Tardanzas"
          value={kpis.lateDays}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          title="Ausencias"
          value={kpis.absentDays}
          icon={<CalendarOff className="size-4" />}
        />
        <StatCard
          title="Hs Totales"
          value={`${kpis.totalHours}h`}
          icon={<CalendarRange className="size-4" />}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-9 w-48 bg-card shadow-none">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <p className="text-sm font-medium text-muted-foreground">
            {records.length} registros encontrados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 shadow-none">
            <Plus className="size-4" /> Exportar
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              className="h-9 shadow-none"
              onClick={() => setManualRecordOpen(true)}
            >
              <Plus className="size-4" /> Nuevo registro
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabla / Cards ── */}
      {records.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="h-10 w-10 text-muted-foreground/20" />}
          title="Sin registros de asistencia"
          description={`No hay actividad registrada para ${selectedMonthLabel}.`}
        />
      ) : isMobile ? (
        <div className="grid gap-3">
          {records.map((record: AttendanceRecord) => {
            const config = getStatusConfig(record.status)
            return (
              <div
                key={record.id}
                className="rounded-xl border bg-card p-4 shadow-none"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-bold">
                      {format(new Date(record.date), "EEEE d 'de' MMMM", {
                        locale: es,
                      })}
                    </p>
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                      {format(new Date(record.date), "yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${config.color} h-6 font-medium`}
                  >
                    {config.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      Entrada
                    </p>
                    <p className="text-sm font-medium">
                      {formatTime(record.checkInAt)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      Salida
                    </p>
                    <p className="text-sm font-medium">
                      {formatTime(record.checkOutAt)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      Almuerzo
                    </p>
                    <p className="text-sm font-medium">
                      {formatTime(record.lunchStartAt)} -{" "}
                      {formatTime(record.lunchEndAt)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                      Hs. Trabajadas
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {getWorkedHours(record.totalWorkedMinutes)}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-2 text-[11px] text-muted-foreground italic">
                    "{record.notes}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-none">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="py-4 pl-6 text-[11px] font-bold tracking-wider uppercase">
                  Fecha
                </TableHead>
                <TableHead className="py-4 text-[11px] font-bold tracking-wider uppercase">
                  Entrada
                </TableHead>
                <TableHead className="py-4 text-center text-[11px] font-bold tracking-wider uppercase">
                  Almuerzo
                </TableHead>
                <TableHead className="py-4 text-[11px] font-bold tracking-wider uppercase">
                  Salida
                </TableHead>
                <TableHead className="py-4 text-[11px] font-bold tracking-wider uppercase">
                  Horas
                </TableHead>
                <TableHead className="py-4 text-[11px] font-bold tracking-wider uppercase">
                  Estado
                </TableHead>
                {isAdmin && (
                  <TableHead className="py-4 pr-6 text-right text-[11px] font-bold tracking-wider uppercase">
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record: AttendanceRecord) => {
                const config = getStatusConfig(record.status)
                return (
                  <TableRow
                    key={record.id}
                    className="group transition-colors hover:bg-muted/10"
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold capitalize">
                          {format(new Date(record.date), "eee d", {
                            locale: es,
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {format(new Date(record.date), "MMMM", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatTime(record.checkInAt)}
                        </span>
                        {record.checkInLateMinutes && (
                          <span className="text-[10px] font-bold text-red-500">
                            +{record.checkInLateMinutes} min tarde
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {record.lunchStartAt ? (
                          <>
                            {formatTime(record.lunchStartAt)} –{" "}
                            {formatTime(record.lunchEndAt)}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {formatTime(record.checkOutAt)}
                        </span>
                        {record.earlyExitMinutes && (
                          <span className="text-[10px] font-bold text-amber-600">
                            -{record.earlyExitMinutes} min antes
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm font-bold text-primary">
                        {getWorkedHours(record.totalWorkedMinutes)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`${config.color} border-none text-[11px] font-semibold shadow-none`}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-4 pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingRecord(record)
                                setEditStatus(record.status)
                                setEditNotes(record.notes || "")
                                setEditCheckIn(
                                  record.checkInAt
                                    ? formatZonedTime(record.checkInAt, "HH:mm")
                                    : ""
                                )
                                setEditCheckOut(
                                  record.checkOutAt
                                    ? formatZonedTime(
                                        record.checkOutAt,
                                        "HH:mm"
                                      )
                                    : ""
                                )
                                setEditLunchStart(
                                  record.lunchStartAt
                                    ? formatZonedTime(
                                        record.lunchStartAt,
                                        "HH:mm"
                                      )
                                    : ""
                                )
                                setEditLunchEnd(
                                  record.lunchEndAt
                                    ? formatZonedTime(
                                        record.lunchEndAt,
                                        "HH:mm"
                                      )
                                    : ""
                                )
                              }}
                            >
                              <PencilLine className="size-4" />
                              Editar registro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {isAdmin ? (
        <AttendanceManualRecordPanel
          open={manualRecordOpen}
          onOpenChange={setManualRecordOpen}
          employeeId={employeeId}
          employeeName={employeeName || employeeId}
        />
      ) : null}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingRecord}
        onOpenChange={(o) => !o && setEditingRecord(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Editar Registro de Asistencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Estado *</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_time">A tiempo</SelectItem>
                  <SelectItem value="late">Tarde</SelectItem>
                  <SelectItem value="early_exit">Salida temprana</SelectItem>
                  <SelectItem value="permission">Permiso</SelectItem>
                  <SelectItem value="absent">Ausente</SelectItem>
                  <SelectItem value="incomplete">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-checkin">Hora de entrada (Opcional)</Label>
              <Input
                id="edit-checkin"
                type="time"
                value={editCheckIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditCheckIn(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-checkout">Hora de salida (Opcional)</Label>
              <Input
                id="edit-checkout"
                type="time"
                value={editCheckOut}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditCheckOut(e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-lunch-start">Inicio almuerzo</Label>
                <Input
                  id="edit-lunch-start"
                  type="time"
                  value={editLunchStart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLunchStart(e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lunch-end">Fin almuerzo</Label>
                <Input
                  id="edit-lunch-end"
                  type="time"
                  value={editLunchEnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditLunchEnd(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas (Motivo manual)</Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditNotes(e.target.value)
                }
                placeholder="Ej. Olvidó marcar salida, corregido manual"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
