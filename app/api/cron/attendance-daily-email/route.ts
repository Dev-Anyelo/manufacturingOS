import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getTodayDateString } from "@/lib/attendance/utils"
import { sendAttendanceAdminDigest } from "@/lib/email/send"

export async function GET(request: Request) {
  // Validate CRON_SECRET for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const todayDate = new Date(getTodayDateString())

    // Summary logic
    const records = await prisma.attendanceRecord.findMany({
      where: { date: todayDate },
      include: { employee: true },
    })

    const summary = {
      on_time: 0,
      late: 0,
      absent: 0,
      permission: 0,
      other: 0,
    }

    records.forEach((r) => {
      if (r.status === "on_time") summary.on_time++
      else if (r.status === "late") summary.late++
      else if (r.status === "absent") summary.absent++
      else if (r.status === "permission") summary.permission++
      else summary.other++
    })

    const adminProfiles = await prisma.profile.findMany({
      where: { role: { in: ["admin", "manager"] }, isActive: true },
    })

    const adminIds = adminProfiles.map((a) => a.id)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const {
      data: { users },
      error: authError,
    } = await supabaseAdmin.auth.admin.listUsers()

    let adminEmails: string[] = []
    if (!authError && users) {
      adminEmails = users
        .filter((u) => adminIds.includes(u.id) && u.email)
        .map((u) => u.email as string)
    }

    const todayStr = getTodayDateString()
    const emailPromises = adminEmails.map((email) =>
      sendAttendanceAdminDigest(email, {
        date: todayStr,
        stats: {
          on_time: summary.on_time,
          late: summary.late,
          absent: summary.absent,
          permission: summary.permission,
        },
      })
    )

    await Promise.allSettled(emailPromises)

    return NextResponse.json({
      success: true,
      summary,
      emailsSent: adminEmails.length,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
