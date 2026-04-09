import { z } from "zod"

import { MaterialCategory } from "@/types"

export const inventoryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre no puede exceder 120 caracteres"),
  category: z.nativeEnum(MaterialCategory),
  fabricType: z
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
  quantity: z
    .number({ message: "La cantidad es obligatoria" })
    .min(0, "La cantidad no puede ser negativa"),
  unit: z
    .string()
    .trim()
    .min(1, "La unidad es obligatoria")
    .max(20, "La unidad no puede exceder 20 caracteres"),
  unitPrice: z
    .number({ message: "El precio unitario es obligatorio" })
    .min(0, "El precio unitario no puede ser negativo"),
  minimumStock: z
    .number({ message: "El stock minimo es obligatorio" })
    .int("El stock minimo debe ser un numero entero")
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
  imageUrl: z
    .string()
    .url("La URL de la imagen no es valida")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
})

export const inventoryAdjustSchema = z.object({
  inventoryItemId: z.string().uuid("El material seleccionado no es valido"),
  adjustmentType: z.enum(["in", "out", "adjustment"], {
    message: "Selecciona un tipo de ajuste valido",
  }),
  quantity: z
    .number({ message: "La cantidad es obligatoria" })
    .positive("La cantidad debe ser mayor que cero"),
  reason: z
    .string()
    .trim()
    .min(3, "Indica el motivo del ajuste")
    .max(250, "El motivo no puede exceder 250 caracteres"),
})

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>
