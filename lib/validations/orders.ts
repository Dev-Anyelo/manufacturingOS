import { z } from "zod"
import { Currency, WorkOrderStatus } from "@prisma/client"

const measurementSchema = z.object({
  bust: z.coerce.number().positive("El busto debe ser mayor a 0").optional(),
  waist: z.coerce.number().positive("La cintura debe ser mayor a 0").optional(),
  hips: z.coerce.number().positive("La cadera debe ser mayor a 0").optional(),
  length: z.coerce.number().positive("El largo debe ser mayor a 0").optional(),
  sleeve: z.coerce.number().positive("La manga debe ser mayor a 0").optional(),
})

const workOrderItemSchema = z.object({
  catalog_item_id: z.string().uuid().optional().nullable(),
  description: z
    .string()
    .trim()
    .min(2, "La descripcion debe tener al menos 2 caracteres"),
  size: z.string().trim().max(30).optional().nullable(),
  measurements: measurementSchema.optional().nullable(),
  inventory_item_id: z.string().uuid().optional().nullable(),
  color: z.string().trim().max(80).optional().nullable(),
  design_notes: z.string().trim().max(1000).optional().nullable(),
  quantity: z.coerce
    .number({ message: "La cantidad es obligatoria" })
    .int("La cantidad debe ser un numero entero")
    .min(1, "La cantidad debe ser mayor o igual a 1"),
  unit_price: z.coerce
    .number({ message: "El precio unitario es obligatorio" })
    .min(0, "El precio unitario no puede ser negativo"),
  unit_price_currency: z.nativeEnum(Currency).default(Currency.USD),
})

export const workOrderSchema = z
  .object({
    customer_id: z.string().uuid("El cliente seleccionado no es valido"),
    delivery_date: z.coerce.date({
      message: "La fecha de entrega es obligatoria",
    }),
    channel: z.enum(
      ["in_person", "referral", "social_media", "returning_customer", "other"],
      {
        message: "Selecciona un canal valido",
      }
    ),
    advance_paid: z.coerce
      .number({ message: "El adelanto no es valido" })
      .min(0, "El adelanto no puede ser negativo")
      .default(0),
    advance_paid_currency: z.nativeEnum(Currency),
    total: z.coerce
      .number({ message: "El total es obligatorio" })
      .min(0, "El total no puede ser negativo"),
    total_currency: z.nativeEnum(Currency),
    balance_due_currency: z.nativeEnum(Currency),
    notes: z.string().trim().max(1000).optional().nullable(),
    items: z
      .array(workOrderItemSchema)
      .min(1, "Debes agregar al menos un item"),
  })
  .superRefine((value, context) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { convertAmount } = require("@/lib/currency/exchange")

    if (value.delivery_date <= today) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["delivery_date"],
        message: "La fecha de entrega debe ser futura",
      })
    }

    const advanceInTotalCurrency = convertAmount(
      value.advance_paid,
      value.advance_paid_currency,
      value.total_currency
    )

    if (advanceInTotalCurrency > value.total) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["advance_paid"],
        message: "El adelanto no puede ser mayor al total",
      })
    }
  })

export const workOrderStatusSchema = z
  .object({
    status: z.nativeEnum(WorkOrderStatus),
    cancelled_reason: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.status === "cancelled" && !value.cancelled_reason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancelled_reason"],
        message: "El motivo de cancelacion es obligatorio",
      })
    }
  })

export type WorkOrderInput = z.infer<typeof workOrderSchema>
export type WorkOrderStatusInput = z.infer<typeof workOrderStatusSchema>
