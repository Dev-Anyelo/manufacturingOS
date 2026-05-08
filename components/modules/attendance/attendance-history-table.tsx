"use client"

import * as React from "react"
import { toast } from "sonner"
import { es } from "date-fns/locale"
import { useState, useMemo } from "react"
import { subMonths, format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AttendanceManualRecordPanel } from "@/components/modules/attendance/attendance-manual-record-panel"

import {
  MoreHorizontal,
  PencilLine,
  Plus,
  CalendarOff,
  CalendarRange,
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
  return dateStr ? format(new Date(dateStr), "hh:mm a") : "—"
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
            checkInAt: editCheckIn ? new Date(editCheckIn) : null,
            checkOutAt: editCheckOut ? new Date(editCheckOut) : null,
          }),
        }
      )
      if (!res.ok) throw new Error("Error al actualizar registro")
      toast.success("Registro actualizado")
      setEditingRecord(null)
      queryClient.invalidateQueries({
        queryKey: ["attendance", "history"],
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      toast.error(msg)
    }
  }

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Filtrar por mes
          </Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-56">
              <CalendarRange className="mr-2 size-4" />
              <SelectValue placeholder="Selecciona mes" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{selectedMonthLabel}</p>
        </div>

        {isAdmin ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 sm:w-auto"
            onClick={() => setManualRecordOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Agregar registro manual
          </Button>
        ) : null}
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="size-4 text-muted-foreground" />}
          title="No hay registros de asistencia"
          description={`No se encontraron registros para ${selectedMonthLabel}.`}
          action={
            isAdmin ? (
              <Button
                variant="outline"
                onClick={() => setManualRecordOpen(true)}
              >
                <Plus className="mr-2 size-4" />
                Agregar registro manual
              </Button>
            ) : null
          }
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {records.map((record: AttendanceRecord) => {
            const statusConfig = getStatusConfig(record.status)
            return (
              <Card key={record.id} className="border-border/70">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDistanceToNow(new Date(record.date), {
                          addSuffix: false,
                          locale: es,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Entrada</p>
                      <p className="font-medium">
                        {formatTime(record.checkInAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Salida</p>
                      <p className="font-medium">
                        {formatTime(record.checkOutAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Almuerzo</p>
                      <p className="font-medium">
                        {formatTime(record.lunchStartAt)} -{" "}
                        {formatTime(record.lunchEndAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horas</p>
                      <p className="font-medium">
                        {getWorkedHours(record.totalWorkedMinutes ?? null)}
                      </p>
                    </div>
                  </div>

                  {record.notes ? (
                    <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      {record.notes}
                    </p>
                  ) : null}

                  {isAdmin ? (
                    <div className="flex justify-end">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRecord(record)
                          setEditStatus(record.status)
                          setEditNotes(record.notes || "")
                          setEditCheckIn(record.checkInAt || "")
                          setEditCheckOut(record.checkOutAt || "")
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="whitespace-nowrap">Fecha</TableHead>
                <TableHead className="whitespace-nowrap">Entrada</TableHead>
                <TableHead className="whitespace-nowrap">Almuerzo</TableHead>
                <TableHead className="whitespace-nowrap">Salida</TableHead>
                <TableHead className="whitespace-nowrap">Horas</TableHead>
                <TableHead className="whitespace-nowrap">Estado</TableHead>
                <TableHead className="max-w-37.5">Notas</TableHead>
                {isAdmin && (
                  <TableHead className="text-right whitespace-nowrap">
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record: AttendanceRecord) => {
                const statusConfig = getStatusConfig(record.status)
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDistanceToNow(new Date(record.date), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        {formatTime(record.checkInAt)}
                        {record.checkInLateMinutes && (
                          <span className="block text-[10px] text-destructive">
                            +{record.checkInLateMinutes}m
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatTime(record.lunchStartAt)} -{" "}
                      {formatTime(record.lunchEndAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        {formatTime(record.checkOutAt)}
                        {record.earlyExitMinutes && (
                          <span className="block text-[10px] text-amber-600">
                            -{record.earlyExitMinutes}m
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getWorkedHours(record.totalWorkedMinutes ?? null)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-37.5 truncate text-xs text-muted-foreground"
                      title={record.notes || ""}
                    >
                      {record.notes || "—"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingRecord(record)
                                setEditStatus(record.status)
                                setEditNotes(record.notes || "")
                                setEditCheckIn(record.checkInAt || "")
                                setEditCheckOut(record.checkOutAt || "")
                              }}
                            >
                              <PencilLine className="mr-2 size-4" />
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
          employeeName={employeeId}
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
