import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { toZonedTime } from 'date-fns-tz'
import { getTodayDateString } from '@/lib/attendance/utils'
import { AttendanceStatus } from '@prisma/client'

export async function POST(request: Request) {
  // Validate CRON_SECRET for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Determine today's date in Managua timezone
    const managua = toZonedTime(new Date(), 'America/Managua')
    const todayDayOfWeek = managua.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Get all active employees with their schedules
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { schedule: true }
    })

    const todayStr = getTodayDateString()
    const todayDate = new Date(todayStr)

    const results = {
      total: employees.length,
      processed: 0,
      absentCreated: 0,
      incompleteClosed: 0,
      permissionsApplied: 0,
      skipped: 0
    }

    for (const emp of employees) {
      if (!emp.schedule || !emp.schedule.isActive) {
        results.skipped++
        continue
      }

      // Check if today is a workday for this employee
      if (!emp.schedule.workDays.includes(todayDayOfWeek)) {
        results.skipped++
        continue
      }

      // Check leave requests first
      const leaveRequest = await prisma.leaveRequest.findFirst({
        where: { employeeId: emp.id, leaveDate: todayDate }
      })

      // Check attendance record
      const record = await prisma.attendanceRecord.findFirst({
        where: { employeeId: emp.id, date: todayDate }
      })

      if (!record) {
        // No record exists
        let status = 'absent'
        let notes = null

        if (leaveRequest) {
          if (leaveRequest.status === 'approved') {
            status = 'permission'
          } else if (leaveRequest.status === 'pending') {
            status = 'absent'
            notes = 'Permiso solicitado sin aprobación'
          }
        }

        const createdRecord = await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            date: todayDate,
            status: status as AttendanceStatus,
            notes
          }
        })

        if (status === 'permission') {
          results.permissionsApplied++
        } else {
          results.absentCreated++
          // Notify admin of absence
          const admins = await prisma.profile.findMany({ where: { role: { in: ['admin', 'manager'] }, isActive: true } })
          for (const admin of admins) {
            await prisma.notification.create({
              data: {
                userId: admin.id,
                type: 'attendance_absent',
                title: 'Ausencia sin justificar',
                body: `${emp.fullName} no ha registrado asistencia el día de hoy.`,
                metadata: { employeeId: emp.id, date: todayStr, recordId: createdRecord.id }
              }
            })
          }
        }
      } else {
        // Record exists, check if incomplete
        if (record.checkInAt && !record.checkOutAt) {
          await prisma.attendanceRecord.update({
            where: { id: record.id },
            data: {
              status: 'incomplete',
              notes: record.notes ? `${record.notes} | Cierre automático (incomplete)` : 'Cierre automático (incomplete)'
            }
          })
          results.incompleteClosed++
        }
      }
      
      results.processed++
    }

    // Trigger emails summary for admin
    // This could also be a separate fetch to the other cron route
    fetch(new URL('/api/cron/attendance-daily-email', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString(), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
    }).catch(console.error)

    return NextResponse.json({ success: true, results })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
