import { z } from "zod"
import { MaterialCategory, Currency } from "@prisma/client"

export const inventoryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede exceder 120 caracteres"),
  category: z.nativeEnum(MaterialCategory),
  fabric_type: z
    .string()
    .trim()
    .max(80, "El tipo de tela no puede exceder 80 caracteres")
    .optional()
    .nullable(),
  color: z
    .string()
    .trim()
    .max(80, "El color no puede exceder 80 caracteres")
    .optional()
    .nullable(),
  quantity: z.coerce
    .number({ message: "La cantidad es obligatoria" })
    .min(0, "La cantidad no puede ser negativa"),
  unit: z
    .string()
    .trim()
    .min(1, "La unidad es obligatoria")
    .max(20, "La unidad no puede exceder 20 caracteres"),
  unit_price: z.coerce
    .number({ message: "El precio unitario es obligatorio" })
    .min(0, "El precio unitario no puede ser negativo"),
  unit_price_currency: z.nativeEnum(Currency),
  minimum_stock: z.coerce
    .number({ message: "El stock minimo es obligatorio" })
    .min(0, "El stock minimo no puede ser negativo"),
  supplier: z
    .string()
    .trim()
    .max(120, "El proveedor no puede exceder 120 caracteres")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .nullable(),
  image_url: z.string().trim().max(500).optional().nullable(),
  is_active: z.boolean().optional().default(true),
})

export const inventoryAdjustSchema = z.object({
  inventory_item_id: z.string().uuid("El material seleccionado no es valido"),
  adjustment_type: z.enum(["add", "subtract", "set"], {
    message: "Selecciona un tipo de ajuste valido",
  }),
  quantity: z.coerce
    .number({ message: "La cantidad es obligatoria" })
    .gt(0, "La cantidad debe ser mayor que cero"),
  reason: z
    .string()
    .trim()
    .min(10, "El motivo debe tener al menos 10 caracteres")
    .max(250, "El motivo no puede exceder 250 caracteres"),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>
