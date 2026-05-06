import { z } from "zod"
import { Currency, GarmentType } from "@prisma/client"

const stockEntrySchema = z.object({
  size: z.string().trim().min(1, "La talla es obligatoria"),
  color: z.string().trim().optional(),
  quantity: z.coerce.number().min(0, "La cantidad debe ser >= 0"),
  minimumStock: z.coerce.number().min(0, "El stock mínimo debe ser >= 0"),
})

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().trim().max(1000).optional().nullable(),
  garment_type: z.nativeEnum(GarmentType),

  market_price_unit: z.coerce.number().min(0),
  market_price_unit_currency: z.nativeEnum(Currency),

  market_price_dozen: z.coerce.number().min(0).optional().nullable(),
  market_price_dozen_currency: z.nativeEnum(Currency),

  our_price_unit: z.coerce.number().min(0),
  our_price_unit_currency: z.nativeEnum(Currency),

  our_price_dozen: z.coerce.number().min(0).optional().nullable(),
  our_price_dozen_currency: z.nativeEnum(Currency),

  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  estimated_cost_currency: z.nativeEnum(Currency),

  stock_entries: z.array(stockEntrySchema).optional().default([]),

  image_url: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export type CatalogItemInput = z.infer<typeof catalogItemSchema>
