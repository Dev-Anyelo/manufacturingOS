import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "view")

    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get("employeeId") || "all"
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(`${startDateStr}T00:00:00.000Z`)
    const endDate = new Date(`${endDateStr}T23:59:59.999Z`)

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (employeeId !== "all") {
      whereClause.employeeId = employeeId
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ date: "desc" }, { employee: { fullName: "asc" } }],
    })

    // Prepare calculations
    const employeesSet = new Set(records.map(r => r.employeeId))
    const totalEmployees = employeesSet.size
    
    // Unique work dates (for calculating total possible work days)
    const datesSet = new Set(records.map(r => r.date.toISOString().slice(0, 10)))
    const totalWorkDays = datesSet.size

    let totalTardinessCount = 0
    let totalAbsences = 0
    let totalPermissions = 0

    // Group by employee
    const byEmployeeMap = new Map<string, any>()

    for (const employeeId of Array.from(employeesSet)) {
      const emp = records.find(r => r.employeeId === employeeId)?.employee
      byEmployeeMap.set(employeeId, {
        employeeId,
        employeeName: emp?.fullName || "Desconocido",
        workedDays: 0,
        tardiness: 0,
        absences: 0,
        permissions: 0,
        totalHours: 0,
      })
    }

    const formattedRecords = []

    for (const r of records) {
      const stats = byEmployeeMap.get(r.employeeId)
      
      const isWorked = ["on_time", "late", "early_exit", "incomplete"].includes(r.status)
      const isLate = r.status === "late" || (r.checkInLateMinutes && r.checkInLateMinutes > 0)
      const isAbsent = r.status === "absent"
      const isPermission = r.status === "permission"
      
      if (isWorked) stats.workedDays += 1
      if (isLate) {
        stats.tardiness += 1
        totalTardinessCount += 1
      }
      if (isAbsent) {
        stats.absences += 1
        totalAbsences += 1
      }
      if (isPermission) {
        stats.permissions += 1
        totalPermissions += 1
      }
      
      if (r.totalWorkedMinutes) {
        stats.totalHours += r.totalWorkedMinutes / 60
      }

      formattedRecords.push({
        id: r.id,
        employeeName: r.employee.fullName,
        date: r.date.toISOString().slice(0, 10),
        checkIn: r.checkInAt ? r.checkInAt.toISOString() : null,
        checkOut: r.checkOutAt ? r.checkOutAt.toISOString() : null,
        totalHours: r.totalWorkedMinutes ? r.totalWorkedMinutes / 60 : 0,
        status: r.status,
      })
    }

    const avgTardiness = totalEmployees > 0 ? Number((totalTardinessCount / totalEmployees).toFixed(2)) : 0

    const byEmployee = Array.from(byEmployeeMap.values()).map(e => ({
      ...e,
      totalHours: Number(e.totalHours.toFixed(2))
    }))

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          totalWorkDays,
          avgTardiness,
          totalAbsences,
          totalPermissions,
        },
        byEmployee,
        records: formattedRecords,
      },
    })
  } catch (error) {
    console.error("Error generating attendance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
