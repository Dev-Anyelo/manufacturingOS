import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"
import { toZonedTime } from "date-fns-tz"
import { format } from "date-fns"
import { TIMEZONE } from "@/lib/attendance/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "attendance", "view")

    // Get today's date in Nicaragua timezone
    const now = new Date()
    const managuaDate = toZonedTime(now, TIMEZONE)
    const todayStr = format(managuaDate, "yyyy-MM-dd")
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`)

    // 1. Get active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const totalActive = employees.length

    // 2. Get today's records
    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: todayDate,
      },
    })

    let present = 0
    let late = 0
    let absent = 0
    let pendingLeaves = 0

    // 3. Count records
    for (const record of records) {
      if (record.status === "on_time" || record.status === "incomplete" || record.status === "early_exit") {
        present++
      } else if (record.status === "late") {
        late++
        present++ // Late is also present
      } else if (record.status === "absent") {
        absent++
      }
    }

    // "Sin registrar" are employees without a record for today
    const employeesWithRecord = new Set(records.map((r) => r.employeeId))
    const noRecord = employees.filter((e) => !employeesWithRecord.has(e.id)).length

    // 4. Pending leave requests
    pendingLeaves = await prisma.leaveRequest.count({
      where: { status: "pending" },
    })

    return NextResponse.json({
      success: true,
      data: {
        present,
        late,
        absent,
        noRecord,
        pendingLeaves,
      },
    })
  } catch (error) {
    console.error("Error in attendance summary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
