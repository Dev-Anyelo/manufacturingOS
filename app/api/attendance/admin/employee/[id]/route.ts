import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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
