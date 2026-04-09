import { z } from "zod"

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
  discount: z.coerce
    .number({ message: "El descuento no es valido" })
    .min(0, "El descuento no puede ser negativo")
    .default(0),
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
    amount_paid: z.coerce
      .number({ message: "El monto pagado no es valido" })
      .min(0, "El monto pagado no puede ser negativo"),
    notes: z
      .string()
      .trim()
      .max(1000, "Las notas no pueden exceder 1000 caracteres")
      .optional()
      .nullable(),
    items: z.array(saleItemSchema).min(1, "Debes agregar al menos un item"),
  })
  .superRefine((value, context) => {
    const itemsTotal = value.items.reduce(
      (acc, item) => acc + item.unit_price * item.quantity - item.discount,
      0
    )

    if (value.discount >= itemsTotal && itemsTotal > 0) {
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
