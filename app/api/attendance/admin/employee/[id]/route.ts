import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AttendanceStatus, AuditAction } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { adminCreateRecordSchema } from "@/lib/validations/attendance"

function toDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

function formatDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile || !["admin", "manager", "readonly"].includes(profile.role)) {
      // Check if it's the employee themselves
      const employee = await prisma.employee.findUnique({
        where: { id: params.id },
      })
      if (!employee || employee.profileId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // YYYY-MM

    let whereClause: Record<string, unknown> = { employeeId: params.id }

    if (month) {
      const [year, m] = month.split("-").map(Number)
      whereClause.date = {
        gte: new Date(year, m - 1, 1),
        lte: new Date(year, m, 0),
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ data: records })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = adminCreateRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { schedule: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      )
    }

    const recordDate = formatDateOnly(new Date(`${parsed.data.date}T00:00:00`))

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: params.id,
          date: recordDate,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un registro para esta fecha" },
        { status: 400 }
      )
    }

    const schedule = employee.schedule
    const weekday = recordDate.getDay()
    const hasSchedule = Boolean(
      schedule?.isActive && schedule.workDays.includes(weekday)
    )

    const checkInAt = toDateTime(parsed.data.date, parsed.data.checkInAt)
    const checkOutAt = parsed.data.checkOutAt
      ? toDateTime(parsed.data.date, parsed.data.checkOutAt)
      : null
    const lunchStartAt = parsed.data.lunchStartAt
      ? toDateTime(parsed.data.date, parsed.data.lunchStartAt)
      : null
    const lunchEndAt = parsed.data.lunchEndAt
      ? toDateTime(parsed.data.date, parsed.data.lunchEndAt)
      : null

    let checkInLateMinutes: number | null = null
    let lunchOvertimeMinutes: number | null = null
    let earlyExitMinutes: number | null = null
    let totalWorkedMinutes: number | null = null
    let status: AttendanceStatus = hasSchedule
      ? AttendanceStatus.on_time
      : AttendanceStatus.no_schedule

    if (schedule && hasSchedule) {
      const expectedCheckInMinutes = toMinutes(schedule.expectedCheckIn)
      const actualCheckInMinutes = toMinutes(parsed.data.checkInAt)
      const late = Math.max(
        0,
        actualCheckInMinutes - (expectedCheckInMinutes + schedule.lateTolerance)
      )
      checkInLateMinutes = late > 0 ? late : null

      if (!checkOutAt) {
        status = AttendanceStatus.incomplete
      } else {
        const expectedCheckOutMinutes = toMinutes(schedule.expectedCheckOut)
        const actualCheckOutMinutes = (parsed.data.checkOutAt && toMinutes(parsed.data.checkOutAt)) || 0
        const early = Math.max(
          0,
          expectedCheckOutMinutes - actualCheckOutMinutes
        )
        earlyExitMinutes = early > 0 ? early : null

        if (
          schedule.expectedLunchStart &&
          schedule.expectedLunchEnd &&
          lunchStartAt &&
          lunchEndAt
        ) {
          const expectedLunchDuration =
            toMinutes(schedule.expectedLunchEnd) -
            toMinutes(schedule.expectedLunchStart)
          const actualLunchEndMinutes = parsed.data.lunchEndAt ? toMinutes(parsed.data.lunchEndAt) : 0
          const actualLunchStartMinutes = parsed.data.lunchStartAt ? toMinutes(parsed.data.lunchStartAt) : 0
          const actualLunchDuration = actualLunchEndMinutes - actualLunchStartMinutes
          const overtime = Math.max(
            0,
            actualLunchDuration - expectedLunchDuration
          )
          lunchOvertimeMinutes = overtime > 0 ? overtime : null
        }

        if (earlyExitMinutes) {
          status = AttendanceStatus.early_exit
        } else if (checkInLateMinutes) {
          status = AttendanceStatus.late
        } else {
          status = AttendanceStatus.on_time
        }

        const workedMinutes = Math.max(
          0,
          actualCheckOutMinutes - actualCheckInMinutes
        )
        const lunchMinutes =
          lunchStartAt && lunchEndAt
            ? Math.max(
                0,
                (parsed.data.lunchEndAt ? toMinutes(parsed.data.lunchEndAt) : 0) -
                  (parsed.data.lunchStartAt ? toMinutes(parsed.data.lunchStartAt) : 0)
              )
            : 0
        totalWorkedMinutes = Math.max(0, workedMinutes - lunchMinutes)
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: params.id,
        date: recordDate,
        checkInAt,
        lunchStartAt,
        lunchEndAt,
        checkOutAt,
        status,
        checkInLateMinutes,
        lunchOvertimeMinutes,
        earlyExitMinutes,
        totalWorkedMinutes,
        notes: parsed.data.notes || parsed.data.reason,
      },
    })

    await prisma.auditLog.create({
      data: {
        tableName: "attendance_records",
        action: AuditAction.insert,
        recordId: record.id,
        newValues: {
          date: parsed.data.date,
          status,
          reason: parsed.data.reason,
        },
        createdBy: user.id,
      },
    })

    return NextResponse.json({ data: record })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
