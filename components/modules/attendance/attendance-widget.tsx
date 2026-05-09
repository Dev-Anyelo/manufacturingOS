"use client"

import { toast } from "sonner"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAttendance } from "@/hooks/use-attendance"
import { LeaveRequestForm } from "./leave-request-form"

import {
  Clock,
  Play,
  Pause,
  Square,
  AlertCircle,
  Loader2,
  CalendarPlus,
  Users,
  CircleCheck,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback

  if (typeof error === "object" && error !== null) {
    if ("message" in error && typeof error.message === "string") {
      return error.message
    }

    if ("error" in error && typeof error.error === "string") {
      return error.error
    }
  }

  return fallback
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof error.code === "string" ? error.code : undefined
  }

  return undefined
}

export function AttendanceWidget() {
  const { data, isLoading, checkIn, lunchStart, lunchEnd, checkOut } =
    useAttendance()
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState("")

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
  }

  // If no profile and not admin, return null
  if (!data?.hasProfile && !data?.isAdmin) {
    return null
  }

  // If admin without profile, show team summary
  if (!data?.hasProfile && data?.isAdmin && data?.teamSummary) {
    const { present, late, total } = data.teamSummary
    return (
      <div
        className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground md:inline-flex"
        title="Resumen del equipo hoy"
      >
        <Users className="size-3.5" />
        <span className="hidden sm:inline">Equipo hoy:</span>
        <span className="flex items-center gap-1 text-emerald-600">
          {present} <CircleCheck className="size-3.5" />
        </span>
        {late > 0 && <span className="ml-1 text-amber-600">| {late}</span>}
      </div>
    )
  }

  const record = data.record
  const schedule = data.schedule

  const handleCheckIn = async () => {
    try {
      const res = await checkIn.mutateAsync()
      if (res.data?.checkInLateMinutes) {
        toast.warning(
          `Entrada registrada. Llegaste ${res.data.checkInLateMinutes} minutos tarde.`
        )
      } else {
        toast.success("Entrada registrada exitosamente")
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error al marcar entrada"))
    }
  }

  const handleLunchStart = async () => {
    try {
      await lunchStart.mutateAsync()
      toast.success("Almuerzo iniciado")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error"))
    }
  }

  const handleLunchEnd = async () => {
    try {
      await lunchEnd.mutateAsync()
      toast.success("Almuerzo finalizado. ¡De vuelta al trabajo!")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error"))
    }
  }

  const handleCheckOut = async (checkoutReason?: string) => {
    try {
      await checkOut.mutateAsync(checkoutReason)
      toast.success("Salida registrada exitosamente. ¡Buen trabajo!")
      setReasonDialogOpen(false)
      setReason("")
    } catch (err: unknown) {
      const code = getErrorCode(err)
      const message = getErrorMessage(err, "Error al marcar salida")

      if (code === "REASON_REQUIRED") {
        setReasonError(message)
        setReasonDialogOpen(true)
      } else {
        toast.error(message)
      }
    }
  }

  // Define what to render based on current state
  let content = null

  if (!record || !record.checkInAt) {
    content = (
      <Button size="sm" onClick={handleCheckIn} disabled={checkIn.isPending}>
        {checkIn.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        <span className="hidden sm:inline">Marcar Entrada</span>
      </Button>
    )
  } else if (!record.checkOutAt) {
    // Currently working
    if (schedule?.expectedLunchStart && !record.lunchStartAt) {
      // Waiting for lunch
      content = (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleLunchStart}
            disabled={lunchStart.isPending}
            className="gap-2"
          >
            {lunchStart.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pause className="size-4" />
            )}
            <span className="hidden sm:inline">Ir a Almorzar</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleCheckOut()}
            disabled={checkOut.isPending}
            className="gap-2"
          >
            {checkOut.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Square className="size-4" />
            )}
            <span className="hidden sm:inline">Salida</span>
          </Button>
        </div>
      )
    } else if (
      schedule?.expectedLunchStart &&
      record.lunchStartAt &&
      !record.lunchEndAt
    ) {
      // Currently on lunch
      content = (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleLunchEnd}
          disabled={lunchEnd.isPending}
          className="gap-2"
        >
          {lunchEnd.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          <span className="hidden sm:inline">Regresar de Almuerzo</span>
        </Button>
      )
    } else {
      // Returned from lunch or doesn't have lunch scheduled
      content = (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleCheckOut()}
          disabled={checkOut.isPending}
          className="gap-2"
        >
          {checkOut.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Square className="size-4" />
          )}
          <span className="hidden sm:inline">Marcar Salida</span>
        </Button>
      )
    }
  } else {
    // Already checked out
    const hours = Math.floor((record.totalWorkedMinutes || 0) / 60)
    const minutes = (record.totalWorkedMinutes || 0) % 60
    content = (
      <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
        <Clock className="size-4" />
        <span className="hidden sm:inline">Día finalizado:</span>
        <span>
          {hours}h {minutes}m
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {content}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLeaveDialogOpen(true)}
        >
          <CalendarPlus className="size-4" />
          Solicitar permiso
        </Button>
      </div>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader className="px-4 py-4">
            <DialogTitle className="text-left text-pretty">
              Solicitar Permiso
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-pretty">
              Rellena este formulario para ausentarte justificadamente.
            </DialogDescription>
            <DialogDescription className="text-left text-sm text-pretty text-red-400">
              {reasonError}
            </DialogDescription>
          </DialogHeader>
          <LeaveRequestForm onSuccess={() => setLeaveDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 py-4">
            <DialogTitle className="text-left text-pretty">
              Motivo requerido
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-left text-pretty">
              <AlertCircle className="size-4" />
              Debes indicar el motivo de tu salida detalladamente.
            </DialogDescription>
            <DialogDescription className="text-left text-sm text-pretty text-red-400">
              {reasonError}
            </DialogDescription>
          </DialogHeader>
          <div className="px-4">
            <Textarea
              className="h-full"
              placeholder="Explica el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={10}
            />
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 px-4 py-4">
            <Button
              variant="outline"
              onClick={() => setReasonDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleCheckOut(reason)}
              disabled={reason.length < 5 || checkOut.isPending}
            >
              Confirmar Salida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
