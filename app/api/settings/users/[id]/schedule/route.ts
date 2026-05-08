import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { scheduleSchema } from "@/lib/validations/attendance"
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
    const schedule = await prisma.employeeSchedule.findUnique({
      where: { employeeId: params.id },
    })

    return NextResponse.json({ data: schedule })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
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

  // Need to verify if user has admin/manager role
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const employeeId = params.id
    const body = await request.json()
    const parsed = scheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const schedule = await prisma.employeeSchedule.upsert({
      where: { employeeId },
      update: {
        ...parsed.data,
        updatedAt: new Date(),
      },
      create: {
        employeeId,
        ...parsed.data,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ data: schedule })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
