import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTodayDateString, calculateLunchOvertime } from '@/lib/attendance/utils'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { profileId: user.id },
      include: { schedule: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'No employee profile linked to this user' }, { status: 403 })
    }

    const todayDateStr = getTodayDateString()
    const todayDate = new Date(todayDateStr)

    const record = await prisma.attendanceRecord.findFirst({
      where: { employeeId: employee.id, date: todayDate }
    })

    if (!record || !record.lunchStartAt) {
      return NextResponse.json({ error: 'Debes marcar inicio de almuerzo primero' }, { status: 400 })
    }

    if (record.lunchEndAt) {
      return NextResponse.json({ error: 'Ya marcaste el retorno del almuerzo' }, { status: 400 })
    }

    const now = new Date()
    let overtime = 0

    if (employee.schedule && employee.schedule.expectedLunchStart && employee.schedule.expectedLunchEnd) {
      overtime = calculateLunchOvertime(
        record.lunchStartAt,
        now,
        employee.schedule.expectedLunchStart,
        employee.schedule.expectedLunchEnd
      )
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        lunchEndAt: now,
        lunchOvertimeMinutes: overtime > 0 ? overtime : null,
        events: {
          create: {
            eventType: 'lunch_end',
            happenedAt: now,
            createdBy: user.id
          }
        }
      },
      include: { events: true }
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
