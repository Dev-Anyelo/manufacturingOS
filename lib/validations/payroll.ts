import { z } from "zod"

export const payrollPaymentSchema = z
  .object({
    employee_id: z.string().uuid("El empleado seleccionado no es valido"),
    period_start: z.coerce.date({
      message: "La fecha de inicio del periodo es obligatoria",
    }),
    period_end: z.coerce.date({
      message: "La fecha de fin del periodo es obligatoria",
    }),
    pieces_produced: z.coerce.number().int().min(0).optional().nullable(),
    hours_worked: z.coerce.number().min(0).optional().nullable(),
    base_amount: z.coerce
      .number()
      .min(0, "El monto base no puede ser negativo"),
    bonuses: z.coerce
      .number()
      .min(0, "Los bonos no pueden ser negativos")
      .default(0),
    deductions: z.coerce
      .number()
      .min(0, "Las deducciones no pueden ser negativas")
      .default(0),
    payment_method: z.enum(["cash", "transfer", "other"]).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.period_end < value.period_start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["period_end"],
        message:
          "La fecha de fin del periodo no puede ser menor a la fecha de inicio",
      })
    }
  })

export const payrollMarkPaidSchema = z.object({
  payment_date: z.coerce.date({ message: "La fecha de pago es obligatoria" }),
  payment_method: z.enum(["cash", "transfer", "other"], {
    message: "El metodo de pago es obligatorio",
  }),
  notes: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .nullable(),
})

export type PayrollPaymentInput = z.infer<typeof payrollPaymentSchema>
export type PayrollMarkPaidInput = z.infer<typeof payrollMarkPaidSchema>
