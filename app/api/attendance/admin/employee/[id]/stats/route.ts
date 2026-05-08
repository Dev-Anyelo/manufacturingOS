import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { TIMEZONE } from '@/lib/attendance/utils'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Need admin or manager or self
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !['admin', 'manager', 'readonly'].includes(profile.role)) {
    const employee = await prisma.employee.findUnique({ where: { id: params.id } })
    if (!employee || employee.profileId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const employeeId = params.id
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: sixMonthsAgo }
      },
      orderBy: { date: 'desc' }
    })

    let totalDays = records.length
    let presentDays = 0
    let lateDays = 0
    let absentWithoutReason = 0
    let earlyExitDays = 0

    let totalWorkedMinutes = 0

    // Distribution counters
    const distribution = {
      on_time: 0,
      late: 0,
      early_exit: 0,
      absent: 0,
      permission: 0,
    }

    // Collect recent late entries
    const recentLate: Array<{ date: string; minutes: number }> = []
    
    records.forEach(r => {
      // Count distribution
      if (r.status in distribution) {
        distribution[r.status as keyof typeof distribution]++
      }

      if (r.status === 'on_time' || r.status === 'late' || r.status === 'early_exit' || r.status === 'incomplete') {
        presentDays++
        totalWorkedMinutes += r.totalWorkedMinutes || 0
      }
      
      if (r.status === 'late' || r.checkInLateMinutes) {
        lateDays++
        if (r.checkInLateMinutes && r.checkInLateMinutes > 0) {
          recentLate.push({
            date: format(toZonedTime(r.date, TIMEZONE), 'dd MMM yyyy', { locale: es }),
            minutes: r.checkInLateMinutes,
          })
        }
      }
      if (r.status === 'early_exit' || r.earlyExitMinutes) earlyExitDays++
      if (r.status === 'absent') absentWithoutReason++
    })

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
    const avgMinutesPerDay = presentDays > 0 ? Math.round(totalWorkedMinutes / presentDays) : 0

    return NextResponse.json({
      data: {
        attendanceRate,
        totalDays,
        presentDays,
        lateDays,
        earlyExitDays,
        absentWithoutReason,
        avgMinutesPerDay,
        distribution,
        recentLate: recentLate.slice(0, 10), // last 10 entries
      }
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
