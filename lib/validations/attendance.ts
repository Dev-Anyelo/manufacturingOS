import { z } from 'zod'

export const scheduleSchema = z.object({
  expectedCheckIn: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido'),
  expectedLunchStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido').nullable().optional(),
  expectedLunchEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido').nullable().optional(),
  expectedCheckOut: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato HH:mm requerido'),
  lateTolerance: z.number().min(0).max(120),
  workDays: z.array(z.number().min(0).max(6)),
  isActive: z.boolean().default(true),
})

export const checkOutSchema = z.object({
  reason: z.string().optional(),
})

export const leaveRequestSchema = z.object({
  leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  leaveType: z.enum(['vacation', 'medical', 'personal', 'training', 'other']),
  reason: z.string().min(5, 'Especifica un motivo válido'),
})

export const adminLeaveActionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  approvalNote: z.string().optional(),
})

export const adminUpdateRecordSchema = z.object({
  checkInAt: z.string().datetime().optional(),
  lunchStartAt: z.string().datetime().nullable().optional(),
  lunchEndAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
  status: z.enum(['on_time', 'late', 'early_exit', 'absent', 'permission', 'incomplete', 'no_schedule']),
  notes: z.string().nullable().optional(),
})
