import { z } from "zod"

export const scheduleSchema = z.object({
  expectedCheckIn: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
  expectedLunchStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido")
    .nullable(),
  expectedLunchEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido")
    .nullable(),
  expectedCheckOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
  lateTolerance: z.number().min(0).max(120),
  workDays: z.array(z.number().min(0).max(6)),
  isActive: z.boolean(),
}).refine(
  (data) => data.expectedCheckIn < data.expectedCheckOut,
  {
    path: ["expectedCheckOut"],
    message: "La hora de salida debe ser posterior a la hora de entrada",
  }
)

export const checkOutSchema = z.object({
  reason: z.string().optional(),
})

export const leaveRequestSchema = z.object({
  leaveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
  leaveType: z.enum(["vacation", "medical", "personal", "training", "other"]),
  reason: z.string().min(10, "Especifica un motivo válido"),
}).refine(
  (data) => {
    const today = new Date().toISOString().slice(0, 10)
    return data.leaveDate >= today
  },
  {
    path: ["leaveDate"],
    message: "La fecha del permiso debe ser hoy o una fecha futura",
  }
)

export const adminLeaveActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  approvalNote: z.string().optional(),
})

export const adminUpdateRecordSchema = z.object({
  checkInAt: z.string().datetime().optional(),
  lunchStartAt: z.string().datetime().nullable().optional(),
  lunchEndAt: z.string().datetime().nullable().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
  status: z.enum([
    "on_time",
    "late",
    "early_exit",
    "absent",
    "permission",
    "incomplete",
    "no_schedule",
  ]),
  notes: z.string().nullable().optional(),
})

export const adminCreateRecordSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD requerido"),
    checkInAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
    lunchStartAt: z
      .union([
        z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
        z.literal(""),
      ])
      .optional(),
    lunchEndAt: z
      .union([
        z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
        z.literal(""),
      ])
      .optional(),
    checkOutAt: z
      .union([
        z
          .string()
          .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm requerido"),
        z.literal(""),
      ])
      .optional(),
    notes: z.string().max(500).nullable().optional(),
    reason: z.string().min(10, "La razón es obligatoria"),
  })
  .refine(
    (data) => {
      if (!data.lunchEndAt || data.lunchEndAt === "") return true
      return Boolean(data.lunchStartAt && data.lunchStartAt !== "")
    },
    {
      path: ["lunchEndAt"],
      message: "El fin del almuerzo requiere un inicio de almuerzo",
    }
  )
