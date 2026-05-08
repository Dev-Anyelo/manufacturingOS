import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AttendanceStatus } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { adminLeaveActionSchema } from "@/lib/validations/attendance"

export async function PATCH(
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
    const parsed = adminLeaveActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
      include: { employee: true },
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        approvalNote: parsed.data.approvalNote,
        approvedBy: user.id,
      },
    })

    // If approved, create or update AttendanceRecord with status "permission"
    if (parsed.data.status === "approved") {
      const leaveDate = new Date(leaveRequest.leaveDate)
      // Normalize to start of day for the date field
      const dateOnly = new Date(
        leaveDate.getFullYear(),
        leaveDate.getMonth(),
        leaveDate.getDate()
      )

      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          date: dateOnly,
        },
      })

      if (existingRecord) {
        // Update existing record to permission
        await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status: AttendanceStatus.permission,
            notes: `Permiso aprobado: ${leaveRequest.reason}`,
          },
        })
      } else {
        // Create a new record with permission status
        await prisma.attendanceRecord.create({
          data: {
            employeeId: leaveRequest.employeeId,
            date: dateOnly,
            status: AttendanceStatus.permission,
            notes: `Permiso aprobado: ${leaveRequest.reason}`,
          },
        })
      }
    }

    // Notify employee if they have a profile
    if (leaveRequest.employee.profileId) {
      await prisma.notification.create({
        data: {
          userId: leaveRequest.employee.profileId,
          type:
            parsed.data.status === "approved"
              ? "leave_approved"
              : "leave_rejected",
          title: `Permiso ${parsed.data.status === "approved" ? "aprobado" : "rechazado"}`,
          body: `Tu solicitud de permiso para el ${new Date(leaveRequest.leaveDate).toLocaleDateString()} ha sido ${parsed.data.status === "approved" ? "aprobada" : "rechazada"}.`,
          metadata: { leaveRequestId: updated.id, status: updated.status },
        },
      })
    }

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

