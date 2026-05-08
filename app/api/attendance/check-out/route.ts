import { es } from "date-fns/locale"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { differenceInMinutes, format } from "date-fns"
import { checkOutSchema } from "@/lib/validations/attendance"
import { sendAttendanceEmployeeDaily } from "@/lib/email/send"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AttendanceStatus } from "@prisma/client"

import {
  getTodayDateString,
  calculateEarlyExitMinutes,
} from "@/lib/attendance/utils"

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { profileId: user.id },
      include: { schedule: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: "No employee profile linked to this user" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = checkOutSchema.safeParse(body)
    const reason = parsed.success ? parsed.data.reason : undefined

    const todayDateStr = getTodayDateString()
    const todayDate = new Date(todayDateStr)

    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId: employee.id, date: todayDate },
    })

    if (!record || !record.checkInAt) {
      return NextResponse.json(
        { error: "Debes marcar entrada primero" },
        { status: 400 }
      )
    }

    if (record.checkOutAt) {
      return NextResponse.json(
        { error: "Ya marcaste salida para hoy" },
        { status: 400 }
      )
    }

    const now = new Date()
    let earlyExitMinutes = 0
    let requiresReason = false
    let reasonMessage = ""

    if (employee.schedule && employee.schedule.isActive) {
      earlyExitMinutes = calculateEarlyExitMinutes(
        now,
        employee.schedule.expectedCheckOut
      )
      if (earlyExitMinutes > 0) {
        requiresReason = true
        reasonMessage = "Salida temprana"
      }

      // Check if skipped lunch
      if (
        employee.schedule.expectedLunchStart &&
        (!record.lunchStartAt || !record.lunchEndAt)
      ) {
        requiresReason = true
        reasonMessage = reasonMessage
          ? `${reasonMessage} y sin registro de almuerzo`
          : "Sin registro de almuerzo completo"
      }
    }

    if (requiresReason && !reason) {
      return NextResponse.json(
        {
          error: "Se requiere un motivo",
          code: "REASON_REQUIRED",
          message: `Por favor ingresa un motivo (${reasonMessage}).`,
        },
        { status: 400 }
      )
    }

    let status = record.status
    if (earlyExitMinutes > 0 && status === "on_time") {
      status = "early_exit"
    } else if (earlyExitMinutes > 0 && status === "late") {
      status = "incomplete" // late and early exit
    } else if (status === "permission") {
      // If had permission but worked anyway, we still keep it or mark as incomplete depending on hours
      status = "permission"
    }

    // Calculate total worked minutes
    const totalMinutes = differenceInMinutes(now, record.checkInAt)
    let lunchMinutes = 0
    if (record.lunchStartAt && record.lunchEndAt) {
      lunchMinutes = differenceInMinutes(record.lunchEndAt, record.lunchStartAt)
    }
    const actualWorked = totalMinutes - lunchMinutes

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutAt: now,
        earlyExitMinutes: earlyExitMinutes > 0 ? earlyExitMinutes : null,
        totalWorkedMinutes: actualWorked > 0 ? actualWorked : 0,
        status: status as AttendanceStatus,
        notes: reason
          ? record.notes
            ? `${record.notes} | Salida: ${reason}`
            : `Salida: ${reason}`
          : record.notes,
        events: {
          create: {
            eventType: "check_out",
            happenedAt: now,
            reason: reason,
            createdBy: user.id,
          },
        },
      },
      include: { events: true },
    })

    // Trigger daily summary email to the employee
    if (user.email) {
      const formatTime = (d: Date | null) => (d ? format(d, "hh:mm a") : "—")
      const h = Math.floor(actualWorked / 60)
      const m = actualWorked % 60

      let statusLabel: string = updated.status
      if (updated.status === "on_time") statusLabel = "A tiempo"
      else if (updated.status === "early_exit") statusLabel = "Salida temprana"
      else if (updated.status === "incomplete") statusLabel = "Incompleto"

      await sendAttendanceEmployeeDaily(user.email, {
        employeeName: employee.fullName || "Empleado",
        date: format(now, "d 'de' MMMM, yyyy", { locale: es }),
        checkIn: formatTime(updated.checkInAt),
        lunchOut: formatTime(updated.lunchStartAt),
        lunchIn: formatTime(updated.lunchEndAt),
        checkOut: formatTime(updated.checkOutAt),
        totalHours: `${h}h ${m}m`,
        status: statusLabel,
      }).catch(console.error)
    }

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
