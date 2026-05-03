import { z } from "zod"
import { Currency } from "@prisma/client"

export const exchangeRateSchema = z.object({
  from_currency: z.nativeEnum(Currency),
  to_currency: z.nativeEnum(Currency),
  rate: z.coerce
    .number({ message: "La tasa es obligatoria" })
    .positive("La tasa debe ser un número positivo")
    .min(0.000001, "La tasa es demasiado pequeña"),
  valid_from: z.coerce.date({ message: "La fecha de inicio es obligatoria" }),
  valid_to: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
}).refine(data => data.from_currency !== data.to_currency, {
  message: "Las monedas de origen y destino deben ser diferentes",
  path: ["to_currency"],
})

export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>
