import { z } from "zod"

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().trim().max(1000).optional().nullable(),
  garment_type: z.string().trim().min(2, "El tipo de prenda es obligatorio"),
  market_price_unit: z.coerce
    .number()
    .gt(0, "El precio de mercado unitario debe ser mayor a 0"),
  market_price_dozen: z.coerce.number().gt(0).optional().nullable(),
  our_price_unit: z.coerce
    .number()
    .gt(0, "Nuestro precio unitario debe ser mayor a 0"),
  our_price_dozen: z.coerce.number().gt(0).optional().nullable(),
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export type CatalogItemInput = z.infer<typeof catalogItemSchema>
