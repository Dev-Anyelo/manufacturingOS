import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { sendWelcomeEmail } from "@/lib/email/send"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

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

type SupabaseAdminError = {
  code?: string
  message?: string
  status?: number
}

function buildCreateUserErrorResponse(error: SupabaseAdminError | null) {
  if (!error) {
    return apiError(
      "No se pudo crear el usuario en autenticacion. Verifica los datos e intenta nuevamente.",
      400
    )
  }

  const errorText = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase()

  if (
    errorText.includes("already been registered") ||
    errorText.includes("already registered") ||
    errorText.includes("email_exists")
  ) {
    return apiError("Ya existe un usuario con ese correo electronico.", 409)
  }

  if (errorText.includes("invalid email") || errorText.includes("email")) {
    return apiError("El correo electronico no es valido.", 422)
  }

  if (errorText.includes("password")) {
    return apiError(
      "La contrasena no cumple con los requisitos de seguridad.",
      422
    )
  }

  return apiError(
    "No se pudo crear el usuario en autenticacion. Verifica los datos e intenta nuevamente.",
    error.status && error.status >= 400 && error.status < 500
      ? error.status
      : 400
  )
}

function getAccessUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, createUserSchema)
    const supabaseAdmin = createSupabaseAdminClient()

    const generatedPassword =
      payload.password ?? `${Math.random().toString(36).slice(2)}A1!`

    const normalizedEmail = payload.email.toLowerCase()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name,
      },
    })

    if (error || !data.user?.id) {
      console.error("[api/admin/users] createUser failed", {
        code: error?.code,
        status: error?.status,
        message: error?.message,
      })

      return buildCreateUserErrorResponse(error)
    }

    await prisma.profile.upsert({
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

    await sendWelcomeEmail(normalizedEmail, {
      fullName: payload.full_name,
      email: normalizedEmail,
      role: payload.role,
      accessUrl: `${getAccessUrl()}/login`,
    })

    return apiSuccess(
      {
        id: data.user.id,
        email: normalizedEmail,
        full_name: payload.full_name,
        role: payload.role,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}

// Get all users - only for admin
export async function GET() {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])
    const users = await prisma.profile.findMany({
      select: {
        id: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        employee: true,
        notifications: true,
        inventoryMovementsCreated: true,
        productionSessionsCreated: true,
        salesCreated: true,
        workOrdersCreated: true,
        expensesCreated: true,
        payrollPaymentsCreated: true,
        auditLogsCreated: true,
        _count: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiSuccess(users)
  } catch (error) {
    return handleApiError(error)
  }
}
