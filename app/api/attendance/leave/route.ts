import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { leaveRequestSchema } from '@/lib/validations/attendance'
import { LeaveType } from '@prisma/client'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { profileId: user.id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'No employee profile linked to this user' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = leaveRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { leaveDate, leaveType, reason } = parsed.data
    const dateObj = new Date(leaveDate)

    const existing = await prisma.leaveRequest.findFirst({
      where: { employeeId: employee.id, leaveDate: dateObj }
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe una solicitud de permiso para esta fecha' }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveDate: dateObj,
        leaveType: leaveType as LeaveType,
        reason
      }
    })

    // Notify admins
    const admins = await prisma.profile.findMany({ where: { role: { in: ['admin', 'manager'] }, isActive: true } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'leave_requested',
          title: 'Solicitud de permiso',
          body: `${employee.fullName} ha solicitado un permiso para el ${leaveDate}.`,
          metadata: { leaveRequestId: leaveRequest.id, employeeId: employee.id, leaveDate }
        }
      })
    }

    return NextResponse.json({ data: leaveRequest })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { profileId: user.id }
    })

    if (!employee) {
      return NextResponse.json({ error: 'No employee profile linked to this user' }, { status: 403 })
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { leaveDate: 'desc' }
    })

    return NextResponse.json({ data: requests })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
