import { z } from "zod"

export const GARMENT_TYPES = [
  "shirt",
  "skirt",
  "shorts",
  "leggings",
  "pajamas",
  "suit",
  "sheets",
  "blankets",
  "other",
] as const

export const GARMENT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "custom",
] as const

const productionItemSchema = z
  .object({
    inventory_item_id: z.string().uuid("El material seleccionado no es valido"),
    garment_type: z.enum(GARMENT_TYPES, {
      message: "Selecciona un tipo de prenda valido",
    }),
    size: z.enum(GARMENT_SIZES, {
      message: "Selecciona una talla valida",
    }),
    quantity: z.coerce
      .number({ message: "La cantidad es obligatoria" })
      .int("La cantidad debe ser un numero entero")
      .min(1, "La cantidad debe ser mayor o igual a 1"),
    yards_used: z.coerce
      .number({ message: "Las yardas usadas son obligatorias" })
      .min(0, "Las yardas usadas no pueden ser negativas"),
    notes: z
      .string()
      .trim()
      .max(500, "Las notas no pueden exceder 500 caracteres")
      .optional()
      .nullable(),
  })
  .superRefine((item, context) => {
    if (item.garment_type !== "other" && item.yards_used === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yards_used"],
        message: "Las yardas usadas no pueden ser 0 para esta prenda",
      })
    }
  })

export const productionSessionSchema = z.object({
  employee_id: z.string().uuid("El empleado seleccionado no es valido"),
  session_date: z.coerce.date({
    message: "La fecha de sesion es obligatoria",
  }),
  notes: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .nullable(),
  items: z
    .array(productionItemSchema)
    .min(1, "Debes agregar al menos un item a la sesion"),
})

export type ProductionSessionInput = z.infer<typeof productionSessionSchema>
