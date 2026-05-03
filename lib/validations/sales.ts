import { z } from "zod"
import { Currency } from "@prisma/client"

export const saleItemSchema = z.object({
  catalog_item_id: z
    .string()
    .uuid("El item de catalogo no es valido")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .min(2, "La descripcion debe tener al menos 2 caracteres"),
  size: z
    .string()
    .trim()
    .max(30, "La talla no puede exceder 30 caracteres")
    .optional()
    .nullable(),
  quantity: z.coerce
    .number({ message: "La cantidad es obligatoria" })
    .int("La cantidad debe ser un numero entero")
    .min(1, "La cantidad debe ser mayor o igual a 1"),
  unit_price: z.coerce
    .number({ message: "El precio unitario es obligatorio" })
    .min(0, "El precio unitario no puede ser negativo"),
  unit_price_currency: z.nativeEnum(Currency).default(Currency.USD),
  discount: z.coerce
    .number({ message: "El descuento no es valido" })
    .min(0, "El descuento no puede ser negativo")
    .default(0),
  discount_currency: z.nativeEnum(Currency).default(Currency.USD),
})

export const saleSchema = z
  .object({
    customer_id: z
      .string()
      .uuid("El cliente seleccionado no es valido")
      .optional()
      .nullable(),
    sale_date: z.coerce.date({ message: "La fecha de venta es obligatoria" }),
    channel: z.enum(
      ["in_person", "order", "whatsapp", "marketplace", "other"],
      {
        message: "Selecciona un canal de venta valido",
      }
    ),
    payment_method: z.enum(["cash", "transfer", "credit", "mixed"], {
      message: "Selecciona un metodo de pago valido",
    }),
    discount: z.coerce
      .number({ message: "El descuento no es valido" })
      .min(0, "El descuento no puede ser negativo")
      .default(0),
    discount_currency: z.nativeEnum(Currency).default(Currency.USD),
    amount_paid: z.coerce
      .number({ message: "El monto pagado no es valido" })
      .min(0, "El monto pagado no puede ser negativo"),
    amount_paid_currency: z.nativeEnum(Currency).default(Currency.USD),
    total: z.coerce.number().min(0).optional(),
    total_currency: z.nativeEnum(Currency).default(Currency.USD),
    change_given: z.coerce.number().min(0).optional(),
    change_given_currency: z.nativeEnum(Currency).default(Currency.USD),
    balance_due: z.coerce.number().min(0).optional(),
    balance_due_currency: z.nativeEnum(Currency).default(Currency.USD),
    notes: z
      .string()
      .trim()
      .max(1000, "Las notas no pueden exceder 1000 caracteres")
      .optional()
      .nullable(),
    items: z.array(saleItemSchema).min(1, "Debes agregar al menos un item"),
  })
  .superRefine((value, context) => {
    // Para validación síncrona usamos la tasa aproximada de lib/currency/exchange.ts
    const { convertAmount } = require("@/lib/currency/exchange")

    const itemsTotal = value.items.reduce((acc, item) => {
      const priceInTotalCurrency = convertAmount(
        item.unit_price,
        item.unit_price_currency,
        value.total_currency
      )
      const discountInTotalCurrency = convertAmount(
        item.discount,
        item.discount_currency,
        value.total_currency
      )
      return acc + priceInTotalCurrency * item.quantity - discountInTotalCurrency
    }, 0)

    const discountInTotalCurrency = convertAmount(
      value.discount,
      value.discount_currency,
      value.total_currency
    )

    if (discountInTotalCurrency >= itemsTotal && itemsTotal > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount"],
        message: "El descuento general debe ser menor al total de la venta",
      })
    }
  })

export const customerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre del cliente debe tener al menos 2 caracteres"),
  phone: z
    .string()
    .trim()
    .max(30, "El telefono no puede exceder 30 caracteres")
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .email("El correo electronico no es valido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  address: z
    .string()
    .trim()
    .max(250, "La direccion no puede exceder 250 caracteres")
    .optional()
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional()
    .nullable(),
})

export type SaleInput = z.infer<typeof saleSchema>
export type CustomerInput = z.infer<typeof customerSchema>
