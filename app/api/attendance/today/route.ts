import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getTodayDateString } from "@/lib/attendance/utils"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
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
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
      })
      if (profile && ["admin", "manager"].includes(profile.role)) {
        // Return team summary instead
        const todayDateStr = getTodayDateString()
        const todayDate = new Date(todayDateStr)
        const teamRecords = await prisma.attendanceRecord.findMany({
          where: { date: todayDate },
        })
        const teamSummary = {
          total: teamRecords.length,
          present: teamRecords.filter((r) =>
            ["on_time", "late"].includes(r.status)
          ).length,
          late: teamRecords.filter((r) => r.status === "late").length,
          absent: teamRecords.filter((r) => r.status === "absent").length,
        }
        return NextResponse.json(
          {
            hasProfile: false,
            isAdmin: true,
            teamSummary,
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          error: "No employee profile linked to this user",
          hasProfile: false,
          isAdmin: false,
        },
        { status: 200 }
      )
    }

    const todayDateStr = getTodayDateString()
    const todayDate = new Date(todayDateStr)

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        date: todayDate,
      },
      include: {
        events: {
          orderBy: { happenedAt: "asc" },
        },
      },
    })

    return NextResponse.json({
      hasProfile: true,
      employeeId: employee.id,
      schedule: employee.schedule,
      record,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
