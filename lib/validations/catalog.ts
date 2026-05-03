import { z } from "zod"
import { Currency } from "@prisma/client"

export const catalogItemSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().trim().max(1000).optional().nullable(),
  garment_type: z.string().trim().min(2, "El tipo de prenda es obligatorio"),
  
  market_price_unit: z.coerce.number().min(0),
  market_price_unit_currency: z.nativeEnum(Currency).default(Currency.USD),
  
  market_price_dozen: z.coerce.number().min(0).optional().nullable(),
  market_price_dozen_currency: z.nativeEnum(Currency).default(Currency.USD),
  
  our_price_unit: z.coerce.number().min(0),
  our_price_unit_currency: z.nativeEnum(Currency).default(Currency.USD),
  
  our_price_dozen: z.coerce.number().min(0).optional().nullable(),
  our_price_dozen_currency: z.nativeEnum(Currency).default(Currency.USD),
  
  estimated_cost: z.coerce.number().min(0).optional().nullable(),
  estimated_cost_currency: z.nativeEnum(Currency).default(Currency.USD),
  
  image_url: z.string().url().optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
})

export type CatalogItemInput = z.infer<typeof catalogItemSchema>
