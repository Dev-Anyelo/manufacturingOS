import { prisma } from "@/lib/prisma"
import { LeaveType } from "@prisma/client"
import { NextResponse } from "next/server"
import { leaveRequestSchema } from "@/lib/validations/attendance"
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

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager", "readonly"].includes(profile.role)) {
    const employee = await prisma.employee.findUnique({ where: { id: params.id } })
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

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = leaveRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
    })

    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    const leaveDate = new Date(`${parsed.data.leaveDate}T00:00:00`)

    const existing = await prisma.leaveRequest.findUnique({
      where: {
        employeeId_leaveDate: {
          employeeId: params.id,
          leaveDate,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una solicitud de permiso para esta fecha" },
        { status: 400 }
      )
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: params.id,
        leaveDate,
        leaveType: parsed.data.leaveType as LeaveType,
        reason: parsed.data.reason,
      },
    })

    if (employee.profileId) {
      await prisma.notification.create({
        data: {
          userId: employee.profileId,
          type: "leave_requested",
          title: "Nueva solicitud de permiso",
          body: `Se registró una solicitud para ${employee.fullName} el ${parsed.data.leaveDate}.`,
          metadata: { leaveRequestId: leaveRequest.id, employeeId: employee.id },
        },
      })
    }

    return NextResponse.json({ data: leaveRequest })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}