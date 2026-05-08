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

  // Need admin or manager or self
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager", "readonly"].includes(profile.role)) {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
    })
    if (!employee || employee.profileId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  try {
    const records = await prisma.leaveRequest.findMany({
      where: { employeeId: params.id },
      orderBy: { leaveDate: "desc" },
    })

    return NextResponse.json({ data: records })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
