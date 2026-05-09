import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AttendanceStatus } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import {
  getTodayDateString,
  calculateLateMinutes,
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
        {
          error:
            "No se encontró un perfil de empleado vinculado a este usuario",
        },
        { status: 403 }
      )
    }

    const todayDateStr = getTodayDateString()
    const todayDate = new Date(todayDateStr)

    // Verify if already checked in
    const existing = await prisma.attendanceRecord.findFirst({
      where: { employeeId: employee.id, date: todayDate },
    })

    if (existing && existing.checkInAt) {
      return NextResponse.json(
        { error: "Ya has marcado tu entrada hoy" },
        { status: 400 }
      )
    }

    const now = new Date()
    let status = "on_time"
    let lateMinutes = 0

    if (employee.schedule && employee.schedule.isActive) {
      lateMinutes = calculateLateMinutes(
        now,
        employee.schedule.expectedCheckIn,
        employee.schedule.lateTolerance
      )
      if (lateMinutes > 0) {
        status = "late"
      }
    } else {
      status = "no_schedule"
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: employee.id,
        date: todayDate,
        checkInAt: now,
        status: status as AttendanceStatus,
        checkInLateMinutes: lateMinutes > 0 ? lateMinutes : null,
        events: {
          create: {
            eventType: "check_in",
            happenedAt: now,
            createdBy: user.id,
          },
        },
      },
      include: { events: true },
    })

    if (status === "late") {
      // Trigger notification to admin
      const admins = await prisma.profile.findMany({
        where: { role: { in: ["admin", "manager"] }, isActive: true },
      })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "attendance_late",
            title: "Llegada tardía",
            body: `${employee.fullName} ha marcado entrada tarde con ${lateMinutes} minutos de retraso.`,
            metadata: {
              employeeId: employee.id,
              lateMinutes,
              date: todayDateStr,
            },
          },
        })
      }
    }

    return NextResponse.json({ data: record })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
