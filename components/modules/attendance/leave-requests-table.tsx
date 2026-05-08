"use client"

import { toast } from "sonner"
import { es } from "date-fns/locale"
import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { format, formatDistanceToNow } from "date-fns"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Loader2, Check, X, Plus, CalendarOff, Clock } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LeaveRequestPanel } from "@/components/modules/attendance/leave-request-panel"

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

interface LeaveRequest {
  id: string
  leaveDate: string
  leaveType: string
  reason: string
  status: string
  approvalNote: string | null
}

interface LeaveRequestsTableProps {
  employeeId: string
  isAdmin?: boolean
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  medical: "Licencia Médica",
  personal: "Permiso Personal",
  other: "Otro",
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
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

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  vacation: {
    label: "Vacaciones",
    className: "bg-sky-500/10 text-sky-700 border-sky-500/20",
  },
  medical: {
    label: "Médico",
    className: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
  personal: {
    label: "Personal",
    className: "bg-muted/40 text-foreground border-border/60",
  },
  training: {
    label: "Capacitación",
    className: "bg-violet-500/10 text-violet-700 border-violet-500/20",
  },
  other: {
    label: "Otro",
    className: "bg-muted/40 text-foreground border-border/60",
  },
}

function getLeaveTypeLabel(leaveType: string): string {
  return LEAVE_TYPE_LABELS[leaveType] || leaveType
}

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeaveRequestsTable({
  employeeId,
  isAdmin = false,
}: LeaveRequestsTableProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  )
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null
  )
  const [approvalNote, setApprovalNote] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["leave", employeeId],
    queryFn: async () => {
      const res = await fetch(
        `/api/attendance/admin/employee/${employeeId}/leave`
      )
      if (!res.ok) throw new Error("Error fetching leaves")
      return res.json()
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      note,
    }: {
      id: string
      status: string
      note: string
    }) => {
      const res = await fetch(`/api/attendance/admin/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, approvalNote: note }),
      })
      if (!res.ok) throw new Error("Error saving action")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave", employeeId] })
      setSelectedRequest(null)
      setApprovalNote("")
      toast.success("Permiso actualizado correctamente")
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      toast.error(msg)
    },
  })

  const handleAction = (
    request: LeaveRequest,
    type: "approved" | "rejected"
  ) => {
    setSelectedRequest(request)
    setActionType(type)
    setApprovalNote("")
  }

  const confirmAction = () => {
    if (selectedRequest && actionType) {
      actionMutation.mutate({
        id: selectedRequest.id,
        status: actionType,
        note: approvalNote,
      })
    }
  }

  const requests = (data?.data || []) as LeaveRequest[]

  // KPI Calculation
  const kpis = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }
  }, [requests])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "all") return true
    return request.status === statusFilter
  })

  return (
    <>
      <div className="space-y-4">
        {/* ── KPIs de Permisos ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Pendientes"
            value={kpis.pending}
            icon={<Clock className="size-4" />}
          />
          <StatCard
            title="Aprobados"
            value={kpis.approved}
            icon={<Check className="size-4" />}
          />
          <StatCard
            title="Rechazados"
            value={kpis.rejected}
            icon={<X className="size-4" />}
          />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-40 bg-card shadow-none">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <p className="text-sm font-medium text-muted-foreground">
              {filteredRequests.length} solicitudes
            </p>
          </div>

          <Button
            size="sm"
            className="h-9 shadow-none"
            onClick={() => setPanelOpen(true)}
          >
            <Plus className="size-4" /> Solicitar permiso
          </Button>
        </div>

        {/* ── Card List ── */}
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={
              <CalendarOff className="h-10 w-10 text-muted-foreground/20" />
            }
            title="Sin solicitudes"
            description="No se encontraron permisos registrados con estos criterios."
          />
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((req) => {
              const statusCfg = getStatusConfig(req.status)
              const typeCfg = TYPE_CONFIG[req.leaveType] || TYPE_CONFIG.other
              const borderColor =
                req.status === "pending"
                  ? "border-l-amber-500"
                  : req.status === "approved"
                    ? "border-l-emerald-500"
                    : "border-l-red-500"

              return (
                <div
                  key={req.id}
                  className={`group relative rounded-xl border border-l-4 bg-card p-5 shadow-none transition-all hover:border-l-4 hover:border-border hover:shadow-sm ${borderColor}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">
                            {format(new Date(req.leaveDate), "PPP", {
                              locale: es,
                            })}
                          </span>
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                            {formatDistanceToNow(new Date(req.leaveDate), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${typeCfg.className} h-6 border-none text-[10px]`}
                        >
                          {typeCfg.label}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                          Motivo de la solicitud
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {req.reason}
                        </p>
                      </div>

                      {req.approvalNote && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="mb-1 text-[10px] font-bold text-muted-foreground uppercase">
                            Respuesta de Administración
                          </p>
                          <p className="text-xs leading-relaxed text-muted-foreground italic">
                            "{req.approvalNote}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-4 sm:flex-col sm:items-end">
                      <Badge
                        className={`${statusCfg.color} h-7 border-none px-3 font-semibold shadow-none`}
                      >
                        {statusCfg.label}
                      </Badge>

                      {isAdmin && req.status === "pending" && (
                        <div className="flex items-center gap-2 sm:mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-200 text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleAction(req, "rejected")}
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 shadow-none hover:bg-emerald-700"
                            onClick={() => handleAction(req, "approved")}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Aprobar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <LeaveRequestPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        employeeName="Empleado"
        employeeId={employeeId}
        endpoint={`/api/attendance/admin/employee/${employeeId}/leave`}
      />

      {/* Dialog: Approbal/Rejection */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(o) => !o && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-[90vw] md:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approved" ? "Aprobar" : "Rechazar"} Permiso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-pretty text-muted-foreground">
              ¿Estás seguro de que deseas{" "}
              <strong>
                {actionType === "approved" ? "aprobar" : "rechazar"}
              </strong>{" "}
              el permiso para el{" "}
              <strong>
                {selectedRequest &&
                  format(new Date(selectedRequest.leaveDate), "dd/MM/yyyy")}
              </strong>
              ?
            </p>
            <div className="space-y-2">
              <Label htmlFor="approval-note">
                Nota de {actionType === "approved" ? "aprobación" : "rechazo"}{" "}
                (opcional)
              </Label>
              <Textarea
                id="approval-note"
                placeholder="Escribe un comentario..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancelar
            </Button>
            <Button
              variant={actionType === "approved" ? "default" : "destructive"}
              onClick={confirmAction}
              disabled={actionMutation.isPending}
            >
              {actionMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
