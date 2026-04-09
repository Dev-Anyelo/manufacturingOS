import { z } from "zod"
import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendWelcomeEmail } from "@/lib/email/send"
import {
  apiError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

const createUserSchema = z.object({
  email: z.string().trim().email("El correo electronico no es valido"),
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  role: z.nativeEnum(UserRole),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres")
    .optional(),
})

function getAccessUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export async function GET() {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const users = await prisma.profile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
    })

    return apiSuccess(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, createUserSchema)

    const supabaseAdmin = createSupabaseAdminClient()

    const generatedPassword =
      payload.password ?? `${Math.random().toString(36).slice(2)}A1!`

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name,
      },
    })

    if (error || !data.user?.id) {
      return apiError(
        "No se pudo crear el usuario en autenticacion. Verifica los datos e intenta nuevamente.",
        400
      )
    }

    const created = await prisma.profile.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        fullName: payload.full_name,
        role: payload.role,
        isActive: true,
      },
      update: {
        fullName: payload.full_name,
        role: payload.role,
        isActive: true,
      },
    })

    await sendWelcomeEmail(payload.email, {
      fullName: payload.full_name,
      email: payload.email,
      role: payload.role,
      accessUrl: `${getAccessUrl()}/login`,
    })

    return apiSuccess(created, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
