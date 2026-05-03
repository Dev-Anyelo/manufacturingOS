import { z } from "zod"
import { Currency } from "@prisma/client"

export const systemSettingsSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  company_phone: z.string().trim().max(40).optional().nullable(),
  company_email: z
    .string()
    .trim()
    .email("El correo de la empresa no es valido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  company_address: z.string().trim().max(250).optional().nullable(),
  low_stock_threshold: z.coerce
    .number()
    .int("El umbral debe ser un numero entero")
    .min(1, "El umbral minimo es 1")
    .max(1000, "El umbral maximo es 1000"),
  base_currency: z.nativeEnum(Currency).default(Currency.USD),
  display_currency: z.nativeEnum(Currency).default(Currency.USD),
  timezone: z.string().trim().min(3, "La zona horaria es obligatoria").max(100),
})

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>
