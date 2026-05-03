import { z } from "zod"
import { Currency } from "@prisma/client"

export const expenseSchema = z
  .object({
    expense_date: z.coerce.date({
      message: "La fecha del gasto es obligatoria",
    }),
    category: z.enum([
      "fabrics",
      "supplies",
      "tools",
      "machinery",
      "outsourced_labor",
      "services",
      "packaging",
      "office",
      "payroll",
      "other",
    ]),
    concept: z
      .string()
      .trim()
      .min(3, "El concepto debe tener al menos 3 caracteres"),
    supplier: z.string().trim().max(120).optional().nullable(),
    quantity: z.coerce.number().min(0).optional().nullable(),
    unit_price: z.coerce.number().min(0).optional().nullable(),
    unit_price_currency: z.nativeEnum(Currency).default(Currency.USD),
    total: z.coerce
      .number({ message: "El total es obligatorio" })
      .min(0, "El total no puede ser negativo"),
    total_currency: z.nativeEnum(Currency).default(Currency.USD),
    updates_inventory: z.boolean().default(false),
    inventory_item_id: z.string().uuid().optional().nullable(),
    inventory_quantity_added: z.coerce.number().optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    receipt_url: z.string().url().optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.updates_inventory) {
      if (!value.inventory_item_id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inventory_item_id"],
          message:
            "Debes seleccionar un material cuando el gasto actualiza inventario",
        })
      }

      if (
        !value.inventory_quantity_added ||
        value.inventory_quantity_added <= 0
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["inventory_quantity_added"],
          message: "La cantidad agregada al inventario debe ser mayor que cero",
        })
      }
    }
  })

export type ExpenseInput = z.infer<typeof expenseSchema>
