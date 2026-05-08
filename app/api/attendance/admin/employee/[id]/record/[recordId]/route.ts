import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { differenceInMinutes } from "date-fns"
import { AuditAction, AttendanceStatus } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { adminUpdateRecordSchema } from "@/lib/validations/attendance"
import { calculateLateMinutes, calculateEarlyExitMinutes } from "@/lib/attendance/utils"

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

    const recordId = params.recordId

    const existing = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: { employee: { include: { schedule: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status: parsed.data.status as AttendanceStatus,
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes
    }

    // Update timestamps if provided
    if (parsed.data.checkInAt !== undefined) {
      updateData.checkInAt = parsed.data.checkInAt ? new Date(parsed.data.checkInAt) : null
    }
    if (parsed.data.lunchStartAt !== undefined) {
      updateData.lunchStartAt = parsed.data.lunchStartAt ? new Date(parsed.data.lunchStartAt) : null
    }
    if (parsed.data.lunchEndAt !== undefined) {
      updateData.lunchEndAt = parsed.data.lunchEndAt ? new Date(parsed.data.lunchEndAt) : null
    }
    if (parsed.data.checkOutAt !== undefined) {
      updateData.checkOutAt = parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : null
    }

    // Recalculate derived fields based on final timestamps
    const finalCheckIn = (updateData.checkInAt !== undefined ? updateData.checkInAt : existing.checkInAt) as Date | null
    const finalCheckOut = (updateData.checkOutAt !== undefined ? updateData.checkOutAt : existing.checkOutAt) as Date | null
    const finalLunchStart = (updateData.lunchStartAt !== undefined ? updateData.lunchStartAt : existing.lunchStartAt) as Date | null
    const finalLunchEnd = (updateData.lunchEndAt !== undefined ? updateData.lunchEndAt : existing.lunchEndAt) as Date | null
    const schedule = existing.employee?.schedule

    if (finalCheckIn && finalCheckOut) {
      const totalMinutes = differenceInMinutes(finalCheckOut, finalCheckIn)
      let lunchMinutes = 0
      if (finalLunchStart && finalLunchEnd) {
        lunchMinutes = differenceInMinutes(finalLunchEnd, finalLunchStart)
      }
      updateData.totalWorkedMinutes = Math.max(0, totalMinutes - lunchMinutes)
    }

    if (finalCheckIn && schedule?.isActive) {
      const late = calculateLateMinutes(finalCheckIn, schedule.expectedCheckIn, schedule.lateTolerance)
      updateData.checkInLateMinutes = late > 0 ? late : null
    }

    if (finalCheckOut && schedule?.isActive) {
      const early = calculateEarlyExitMinutes(finalCheckOut, schedule.expectedCheckOut)
      updateData.earlyExitMinutes = early > 0 ? early : null
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: updateData,
    })

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        tableName: "attendance_records",
        action: AuditAction.update,
        recordId: existing.id,
        oldValues: {
          status: existing.status,
          notes: existing.notes,
          checkInAt: existing.checkInAt,
          checkOutAt: existing.checkOutAt,
        },
        newValues: {
          status: updated.status,
          notes: updated.notes,
          checkInAt: updated.checkInAt,
          checkOutAt: updated.checkOutAt,
        },
        createdBy: user.id,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

