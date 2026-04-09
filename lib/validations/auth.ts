import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .email("Ingresa un correo electronico valido")
    .trim()
    .min(1, "El correo electronico es obligatorio"),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .max(128, "La contrasena no puede exceder 128 caracteres"),
})

export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre completo debe tener al menos 2 caracteres")
    .max(120, "El nombre completo no puede exceder 120 caracteres"),
  email: z
    .string()
    .email("Ingresa un correo electronico valido")
    .trim()
    .min(1, "El correo electronico es obligatorio"),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .max(128, "La contrasena no puede exceder 128 caracteres"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
