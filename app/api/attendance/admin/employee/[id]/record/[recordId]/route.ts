import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { AuditAction, AttendanceStatus } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { adminUpdateRecordSchema } from "@/lib/validations/attendance"

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string; recordId: string }> }
) {
  const params = await props.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Need admin or manager
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || !["admin", "manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = adminUpdateRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const status = parsed.data.status
    const notes = parsed.data.notes

    const recordId = params.recordId

    const existing = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: status as AttendanceStatus,
        notes,
      },
    })

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        tableName: "attendance_records",
        action: AuditAction.update,
        oldValues: { status: existing.status, notes: existing.notes },
        newValues: { status, notes },
        createdBy: user.id,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
