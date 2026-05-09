"use client"

import { toast } from "sonner"
import { useState } from "react"
import { es } from "date-fns/locale"
import { format, subMonths } from "date-fns"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TIMEZONE } from "@/lib/attendance/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AttendanceManualRecordPanel } from "./attendance-manual-record-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  AttendanceRecord,
  LeaveRequest,
  Employee,
  LeaveStatusType,
} from "@/types"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  ChevronDown,
  UserCheck,
  Clock,
  UserX,
  CalendarClock,
  MoreVertical,
  Edit,
  Plus,
  FileSpreadsheet,
  Loader2,
  Users,
  Check,
  X,
} from "lucide-react"

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

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  medical: "Médico",
  personal: "Personal",
  training: "Capacitación",
  other: "Otro",
}

function formatTime(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleTimeString("es-NI", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function AdminAttendanceView({
  teamEmployees,
}: {
  teamEmployees: Array<{ id: string; fullName: string }>
}) {
  const queryClient = useQueryClient()
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null
  const defaultTab =
    searchParams?.get("tab") === "permisos" ? "leaves" : "today"

  const [activeTab, setActiveTab] = useState(defaultTab)
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all")

  const [leaveToProcess, setLeaveToProcess] = useState<
    (LeaveRequest & { employee: Employee }) | null
  >(null)
  const [processAction, setProcessAction] = useState<
    "approve" | "reject" | null
  >(null)
  const [processNote, setProcessNote] = useState("")

  const [manualRecordOpen, setManualRecordOpen] = useState(false)
  const [selectedRecordToEdit, setSelectedRecordToEdit] = useState<Partial<
    AttendanceRecord & { employeeName?: string }
  > | null>(null)

  // 1. Fetch Today Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["attendance", "admin", "summary", "today"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/admin/summary/today")
      if (!res.ok) throw new Error("Error")
      return res.json()
    },
  })

  // 2. Fetch History (used for "Equipo Hoy" and "Historial")
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["attendance", "report", selectedEmployeeId, selectedMonth],
    queryFn: async () => {
      // Find start and end date for the selected month
      const start = `${selectedMonth}-01`
      const end = new Date(
        new Date(start).getFullYear(),
        new Date(start).getMonth() + 1,
        0
      )
        .toISOString()
        .slice(0, 10)
      const res = await fetch(
        `/api/reports/attendance?employeeId=${selectedEmployeeId}&startDate=${start}&endDate=${end}`
      )
      if (!res.ok) throw new Error("Error fetching report")
      return res.json()
    },
  })

  // 3. Fetch Leaves
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ["attendance", "admin", "leaves"],
    queryFn: async () => {
      // Get all leaves to manage
      // Need an API for this: /api/attendance/admin/leave
      const res = await fetch("/api/attendance/admin/leave")
      if (!res.ok) throw new Error("Error fetching leaves")
      return res.json()
    },
  })

  // Leave processing mutation
  const processLeaveMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string
      status: "approved" | "rejected"
      note: string
    }) => {
      const res = await fetch(`/api/attendance/admin/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, approvalNote: note }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      toast.success(
        processAction === "approve" ? "Permiso aprobado" : "Permiso rechazado"
      )
      setLeaveToProcess(null)
      queryClient.invalidateQueries({ queryKey: ["attendance", "admin"] })
      queryClient.invalidateQueries({ queryKey: ["attendance", "report"] })
    },
    onError: () => toast.error("Error al procesar la solicitud"),
  })

  const sum = summaryData?.data || {
    present: 0,
    late: 0,
    absent: 0,
    noRecord: 0,
    pendingLeaves: 0,
  }

  // Filter for "Equipo hoy"
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const todayRecords: Array<
    AttendanceRecord & {
      employeeName?: string
      totalHours?: number
      checkIn?: string
      checkOut?: string
    }
  > =
    reportData?.data?.records?.filter(
      (r: AttendanceRecord) => r.date === todayStr
    ) || []

  // Filter for pending leaves
  const pendingLeavesList: Array<LeaveRequest & { employee: Employee }> =
    leavesData?.data?.filter(
      (l: LeaveRequest) => l.status === LeaveStatusType.Pending
    ) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Asistencia"
        description="Gestiona el registro horario del equipo"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Asistencia" },
        ]}
        actions={
          <Button
            onClick={() => setManualRecordOpen(true)}
            size="sm"
            className="max-w-fit"
          >
            <Plus className="size-4" /> Registrar
          </Button>
        }
      />

      {/* Summary Collapsible */}
      <Collapsible
        defaultOpen
        className="mt-4 rounded-xl border border-border/70 bg-card md:mt-6"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl p-4 font-medium transition-colors hover:bg-muted/30 [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            Resumen del equipo hoy
          </div>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-3 p-4 pt-0 lg:grid-cols-5">
            {summaryLoading ? (
              <>
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-[72px] w-full" />
              </>
            ) : (
              <>
                <CompactKpiCard
                  label="Presentes"
                  value={sum.present}
                  icon={<UserCheck />}
                  iconClass="bg-emerald-500/10 text-emerald-600"
                />
                <CompactKpiCard
                  label="Con tardanza"
                  value={sum.late}
                  icon={<Clock />}
                  iconClass="bg-amber-500/10 text-amber-600"
                />
                <CompactKpiCard
                  label="Ausentes"
                  value={sum.absent}
                  icon={<UserX />}
                  iconClass="bg-destructive/10 text-destructive"
                />
                <CompactKpiCard
                  label="Sin registrar"
                  value={sum.noRecord}
                  icon={<Clock />}
                  iconClass="bg-slate-500/10 text-slate-600"
                />
                <CompactKpiCard
                  label="Permisos pendientes"
                  value={sum.pendingLeaves}
                  icon={<CalendarClock />}
                  iconClass={`bg-blue-500/10 text-blue-600 ${sum.pendingLeaves > 0 ? "animate-pulse" : ""}`}
                />
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="today">Equipo hoy</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="leaves">Permisos</TabsTrigger>
        </TabsList>

        {/* Tab: Equipo hoy */}
        <TabsContent value="today" className="pt-4">
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : teamEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay empleados activos
                    </TableCell>
                  </TableRow>
                ) : (
                  teamEmployees.map((emp) => {
                    const record = todayRecords.find(
                      (r) => r.employeeName === emp.fullName
                    )
                    const cfg = record
                      ? STATUS_CONFIG[record.status] || STATUS_CONFIG.incomplete
                      : STATUS_CONFIG.no_schedule
                    const statusLabel = record ? cfg.label : "Sin registrar"

                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">
                                {emp.fullName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {emp.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record ? formatTime(record.checkIn) : "—"}
                        </TableCell>
                        <TableCell>
                          {record ? formatTime(record.checkOut) : "—"}
                        </TableCell>
                        <TableCell>
                          {record && record.totalHours
                            ? `${record.totalHours}h`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              record
                                ? cfg.color
                                : "bg-slate-500/10 text-slate-600"
                            }
                          >
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {record ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRecordToEdit(record)
                                    setManualRecordOpen(true)
                                  }}
                                >
                                  <Edit className="size-4" /> Editar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRecordToEdit({
                                      employeeId: emp.id,
                                      employeeName: emp.fullName,
                                    })
                                    setManualRecordOpen(true)
                                  }}
                                >
                                  <Plus className="size-4" />
                                  Registrar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="history" className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {teamEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button variant="outline" className="ml-auto gap-2">
              <FileSpreadsheet className="size-4" /> Exportar Excel
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : reportData?.data?.records?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay registros
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData?.data?.records?.map(
                    (
                      record: AttendanceRecord & {
                        employeeName?: string
                        totalHours?: number
                        checkIn?: string
                        checkOut?: string
                      }
                    ) => {
                      const cfg =
                        STATUS_CONFIG[record.status] || STATUS_CONFIG.incomplete
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.employeeName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.date), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>{formatTime(record.checkIn)}</TableCell>
                          <TableCell>{formatTime(record.checkOut)}</TableCell>
                          <TableCell>
                            {record.totalHours ? `${record.totalHours}h` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cfg.color}>
                              {cfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRecordToEdit(record)
                                setManualRecordOpen(true)
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab: Permisos */}
        <TabsContent value="leaves" className="pt-2">
          <h3 className="mb-3 text-sm font-semibold">Solicitudes Pendientes</h3>
          {leavesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : pendingLeavesList.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay permisos pendientes.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingLeavesList.map((leave) => (
                <Card
                  key={leave.id}
                  className="flex flex-col overflow-hidden border-border/70 py-0"
                >
                  <CardContent className="flex-1 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {leave.employee?.fullName?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {leave.employee?.fullName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {LEAVE_TYPE_LABELS[leave.leaveType] ||
                            leave.leaveType}{" "}
                          ·{" "}
                          {format(new Date(leave.leaveDate), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground italic">
                      "{leave.reason}"
                    </p>
                  </CardContent>
                  <div className="grid grid-cols-2 gap-x-2 divide-x divide-border/70 border-t border-border/70 bg-muted/20 p-4">
                    <Button
                      onClick={() => {
                        setLeaveToProcess(leave)
                        setProcessAction("reject")
                        setProcessNote("")
                      }}
                      variant="destructive"
                    >
                      <X className="size-4" />
                      Rechazar
                    </Button>
                    <Button
                      onClick={() => {
                        setLeaveToProcess(leave)
                        setProcessAction("approve")
                        setProcessNote("")
                      }}
                      variant="default"
                    >
                      <Check className="size-4" />
                      Aprobar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Drawer for Leave Processing */}
      <Drawer
        open={!!leaveToProcess}
        onOpenChange={(open) => !open && setLeaveToProcess(null)}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>
                {processAction === "approve" ? "Aprobar" : "Rechazar"} permiso
              </DrawerTitle>
              <DrawerDescription>
                {processAction === "approve"
                  ? "Añade una nota opcional a la aprobación."
                  : "Por favor, indica el motivo del rechazo."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 p-4">
              <div className="rounded-lg bg-muted p-3 text-sm dark:bg-muted/30">
                <p className="mb-1 font-medium">
                  {leaveToProcess?.employee?.fullName}
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  {leaveToProcess &&
                    format(new Date(leaveToProcess.leaveDate), "dd MMMM yyyy", {
                      locale: es,
                    })}
                </p>
                <p className="text-pretty text-muted-foreground italic">
                  "{leaveToProcess?.reason}"
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  {processAction === "approve"
                    ? "Nota (opcional)"
                    : "Motivo (requerido)"}
                </label>
                <Input
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  autoFocus
                  placeholder={
                    processAction === "approve"
                      ? "Ej: Disfruta tu día..."
                      : "Motivo de rechazo..."
                  }
                />
              </div>
            </div>
            <DrawerFooter className="grid grid-cols-2 gap-2 pb-6">
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
              <Button
                variant={
                  processAction === "approve" ? "default" : "destructive"
                }
                className={
                  processAction === "approve"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : ""
                }
                disabled={
                  (processAction === "reject" && !processNote.trim()) ||
                  processLeaveMutation.isPending
                }
                onClick={() => {
                  if (!leaveToProcess) return
                  processLeaveMutation.mutate({
                    id: leaveToProcess.id,
                    status:
                      processAction === "approve" ? "approved" : "rejected",
                    note: processNote,
                  })
                }}
              >
                {processLeaveMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Confirmar{" "}
                {processAction === "approve" ? "aprobación" : "rechazo"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Sheet for Manual Record */}
      {manualRecordOpen && (
        <AttendanceManualRecordPanel
          open={manualRecordOpen}
          onOpenChange={(open) => {
            setManualRecordOpen(open)
            if (!open) setSelectedRecordToEdit(null)
          }}
          employeeId={selectedRecordToEdit?.employeeId || null}
          employeeName={selectedRecordToEdit?.employeeName || null}
          recordId={selectedRecordToEdit?.id || null}
        />
      )}
    </div>
  )
}
