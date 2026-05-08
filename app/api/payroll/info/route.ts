import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "payroll", "view")

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employee_id")
    const fromStr = searchParams.get("from")
    const toStr = searchParams.get("to")

    if (!employeeId || !fromStr || !toStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const fromDate = new Date(`${fromStr}T00:00:00`)
    const toDate = new Date(`${toStr}T23:59:59`)

    // 1. Get pieces produced
    const sessions = await prisma.productionSession.findMany({
      where: {
        employeeId,
        sessionDate: { gte: fromDate, lte: toDate },
      },
      select: { totalGarments: true },
    })
    const piecesProduced = sessions.reduce((acc, s) => acc + s.totalGarments, 0)

    // 2. Get hours worked
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: fromDate, lte: toDate },
        totalWorkedMinutes: { not: null },
        status: {
          notIn: ["absent", "no_schedule"],
        },
      },
      select: { totalWorkedMinutes: true },
    })

    const totalMinutes = attendanceRecords.reduce(
      (acc, r) => acc + (r.totalWorkedMinutes || 0),
      0
    )
    // Round to nearest quarter hour for payroll (optional, but standard practice)
    const exactHours = totalMinutes / 60
    const hoursWorked = Math.round(exactHours * 4) / 4

    return NextResponse.json({
      success: true,
      data: {
        piecesProduced,
        hoursWorked,
        attendanceRecordsCount: attendanceRecords.length,
      },
    })
  } catch (error) {
    console.error("Error in payroll info endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
