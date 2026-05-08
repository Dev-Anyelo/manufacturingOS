'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea'

export function LeaveRequestsTable({ employeeId, isAdmin = false }: { employeeId: string, isAdmin?: boolean }) {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null)
  const [approvalNote, setApprovalNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['leave', employeeId],
    queryFn: async () => {
      // In a real scenario we'd pass employeeId to get specific employee leaves.
      // If we are admin, we need an endpoint to get an employee's leaves.
      // Since /api/attendance/leave gets own leaves, we assume if employeeId is passed,
      // and we are admin, we should fetch from an admin route. 
      // For brevity, let's assume we can fetch them via a GET route:
      const res = await fetch(`/api/attendance/admin/employee/${employeeId}/leave`)
      if (!res.ok) throw new Error('Error fetching leaves')
      return res.json()
    }
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note: string }) => {
      const res = await fetch(`/api/attendance/admin/leave/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approvalNote: note })
      })
      if (!res.ok) throw new Error('Error saving action')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave', employeeId] })
      setSelectedRequest(null)
      setApprovalNote('')
      toast.success('Permiso actualizado correctamente')
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  const handleAction = (request: any, type: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setActionType(type)
    setApprovalNote('')
  }

  const confirmAction = () => {
    if (selectedRequest && actionType) {
      actionMutation.mutate({
        id: selectedRequest.id,
        status: actionType,
        note: approvalNote
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
  }

  const requests = data?.data || []

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                  No hay solicitudes de permiso
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req: any) => {
                let statusBadge = null
                switch (req.status) {
                  case 'pending': statusBadge = <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>; break;
                  case 'approved': statusBadge = <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Aprobado</Badge>; break;
                  case 'rejected': statusBadge = <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Rechazado</Badge>; break;
                }

                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {format(new Date(req.leaveDate), "EEE d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="capitalize">{req.leaveType}</TableCell>
                    <TableCell className="max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      {statusBadge}
                      {req.approvalNote && <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-xs">{req.approvalNote}</p>}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="outline" className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleAction(req, 'approved')}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleAction(req, 'rejected')}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Procesado</span>}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approved' ? 'Aprobar' : 'Rechazar'} Permiso
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm">
              ¿Estás seguro de que deseas {actionType === 'approved' ? 'aprobar' : 'rechazar'} el permiso para el <strong>{selectedRequest && format(new Date(selectedRequest.leaveDate), "dd/MM/yyyy")}</strong>?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nota de {actionType === 'approved' ? 'aprobación' : 'rechazo'} (opcional)</label>
              <Textarea
                placeholder="Escribe un comentario..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancelar</Button>
            <Button 
              variant={actionType === 'approved' ? 'default' : 'destructive'} 
              onClick={confirmAction}
              disabled={actionMutation.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
