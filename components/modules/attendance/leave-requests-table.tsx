"use client"

import { toast } from "sonner"
import { useState } from "react"
import { es } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { format, formatDistanceToNow, subMonths } from "date-fns"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LeaveRequestPanel } from "@/components/modules/attendance/leave-request-panel"

import {
  Loader2,
  Check,
  X,
  Plus,
  CalendarOff,
  MoreHorizontal,
  Funnel,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

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
  const monthFrom = subMonths(new Date(), 6)

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const requests = (data?.data || []) as LeaveRequest[]
  const filteredRequests = requests.filter((request) => {
    if (statusFilter === "all") return true
    return request.status === statusFilter
  })

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Solicitudes de Permiso</h3>
          <p className="text-xs text-muted-foreground">
            Últimas solicitudes registradas.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">
              Filtros
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Funnel className="mr-2 size-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setPanelOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nueva solicitud
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={<CalendarOff className="size-4" />}
          title="No hay solicitudes de permiso"
          description="No se encontraron solicitudes con los filtros actuales."
          action={
            <Button variant="outline" onClick={() => setPanelOpen(true)}>
              <Plus className="mr-2 size-4" />
              Nueva solicitud
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 md:hidden">
          {filteredRequests.map((req) => {
            const statusConfig = getStatusConfig(req.status)
            const typeConfig = TYPE_CONFIG[req.leaveType] || TYPE_CONFIG.other
            return (
              <Card key={req.id} className="border-border/70">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {formatDistanceToNow(new Date(req.leaveDate), {
                          addSuffix: false,
                          locale: es,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(req.leaveDate), "dd MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={typeConfig.className}>
                      {typeConfig.label}
                    </Badge>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {req.reason}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>{req.reason}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {req.approvalNote ? (
                    <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                      {req.approvalNote}
                    </p>
                  ) : null}

                  {isAdmin ? (
                    <div className="flex justify-end gap-2">
                      {req.status === "pending" ? (
                        <>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleAction(req, "approved")}
                          >
                            {" "}
                            <Check className="size-4" />{" "}
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => handleAction(req, "rejected")}
                          >
                            {" "}
                            <X className="size-4" />{" "}
                          </Button>
                        </>
                      ) : (
                        <Button size="icon-sm" variant="ghost">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border md:block">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="whitespace-nowrap">Fecha</TableHead>
                <TableHead className="whitespace-nowrap">Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="whitespace-nowrap">Estado</TableHead>
                {isAdmin && (
                  <TableHead className="text-right whitespace-nowrap">
                    Acciones
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const statusConfig = getStatusConfig(req.status)
                const typeConfig =
                  TYPE_CONFIG[req.leaveType] || TYPE_CONFIG.other
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDistanceToNow(new Date(req.leaveDate), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className={typeConfig.className}>
                        {getLeaveTypeLabel(req.leaveType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate">{req.reason}</span>
                          </TooltipTrigger>
                          <TooltipContent>{req.reason}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        {req.approvalNote && (
                          <p className="max-w-xs truncate text-[10px] text-muted-foreground">
                            {req.approvalNote}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right whitespace-nowrap">
                        {req.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleAction(req, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleAction(req, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Procesado
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
