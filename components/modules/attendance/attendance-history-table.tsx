'use client'

import { useQuery } from '@tanstack/react-query'
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
import { Loader2, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

export function AttendanceHistoryTable({ employeeId, isAdmin = true }: { employeeId: string, isAdmin?: boolean }) {
  const queryClient = useQueryClient()
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/attendance/admin/employee/${employeeId}/record/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, notes: editNotes })
      })
      if (!res.ok) throw new Error('Error al actualizar registro')
      toast.success('Registro actualizado')
      setEditingRecord(null)
      queryClient.invalidateQueries({ queryKey: ['attendance', 'history'] })
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'history', employeeId],
    queryFn: async () => {
      // In a real app we'd pass the employeeId to the API, but for now our API /api/attendance/history
      // only returns the current user's history unless we specify employeeId and have admin rights.
      // Let's assume we create an admin endpoint or modify history API to accept employeeId.
      const res = await fetch(`/api/attendance/admin/employee/${employeeId}`)
      if (!res.ok) throw new Error('Error fetching history')
      return res.json()
    }
  })

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
  }

  const records = data?.data || []

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Almuerzo</TableHead>
            <TableHead>Salida</TableHead>
            <TableHead>Horas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notas</TableHead>
            {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No hay registros de asistencia
              </TableCell>
            </TableRow>
          ) : (
            records.map((record: any) => {
              let statusColor = "bg-muted"
              let statusLabel = record.status

              switch (record.status) {
                case 'on_time': statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"; statusLabel = "A tiempo"; break;
                case 'late': statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"; statusLabel = "Tarde"; break;
                case 'early_exit': statusColor = "bg-amber-500/10 text-amber-500 border-amber-500/20"; statusLabel = "Salida temp."; break;
                case 'absent': statusColor = "bg-destructive/10 text-destructive border-destructive/20"; statusLabel = "Ausente"; break;
                case 'permission': statusColor = "bg-blue-500/10 text-blue-500 border-blue-500/20"; statusLabel = "Permiso"; break;
                case 'incomplete': statusColor = "bg-orange-500/10 text-orange-500 border-orange-500/20"; statusLabel = "Incompleto"; break;
              }

              const formatTime = (dateStr: string | null) => dateStr ? format(new Date(dateStr), 'hh:mm a') : '—'
              const hours = record.totalWorkedMinutes ? Math.floor(record.totalWorkedMinutes / 60) : 0
              const minutes = record.totalWorkedMinutes ? record.totalWorkedMinutes % 60 : 0

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.date), "EEE d MMM", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {formatTime(record.checkInAt)}
                    {record.checkInLateMinutes ? <span className="text-[10px] text-destructive block">+{record.checkInLateMinutes}m</span> : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatTime(record.lunchStartAt)} - {formatTime(record.lunchEndAt)}
                  </TableCell>
                  <TableCell>
                    {formatTime(record.checkOutAt)}
                    {record.earlyExitMinutes ? <span className="text-[10px] text-amber-500 block">-{record.earlyExitMinutes}m</span> : null}
                  </TableCell>
                  <TableCell>
                    {hours > 0 || minutes > 0 ? `${hours}h ${minutes}m` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor}>
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={record.notes || ''}>
                    {record.notes || '—'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                        setEditingRecord(record)
                        setEditStatus(record.status)
                        setEditNotes(record.notes || '')
                      }}>
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* Edit Modal */}
      <Dialog open={!!editingRecord} onOpenChange={(o) => !o && setEditingRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>Notas (Motivo manual)</Label>
              <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Ej. Olvidó marcar salida, corregido manual" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
