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
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"

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
  documentId: z.string().optional(),
  hireDate: z.string().optional(),
  contractType: z.enum(["fixed_salary", "per_piece", "hourly"]).optional(),
  baseSalary: z.number().optional(),
  baseSalaryCurrency: z.enum(["NIO", "USD"]).optional(),
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

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "view")

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
        employee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    // Get emails from Supabase Auth
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const authUsers = authData?.users ?? []

    const usersWithEmail = users.map((user) => {
      const authUser = authUsers.find((au) => au.id === user.id)
      return {
        ...user,
        email: authUser?.email ?? user.employee?.email ?? null,
      }
    })

    return apiSuccess(usersWithEmail)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "create")

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
      console.error("[api/settings/users] createUser failed", {
        code: error?.code,
        status: error?.status,
        message: error?.message,
      })

      return buildCreateUserErrorResponse(error)
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

    if (payload.role === "employee" && payload.documentId && payload.hireDate) {
      await prisma.employee.create({
        data: {
          profileId: data.user.id,
          fullName: payload.full_name,
          email: normalizedEmail,
          documentId: payload.documentId,
          hireDate: new Date(payload.hireDate),
          contractType: payload.contractType || "fixed_salary",
          baseSalary: payload.baseSalary || 0,
          baseSalaryCurrency: payload.baseSalaryCurrency || "NIO",
          isActive: true,
        },
      })
    }

    await sendWelcomeEmail(normalizedEmail, {
      fullName: payload.full_name,
      email: normalizedEmail,
      role: payload.role,
      accessUrl: `${getAccessUrl()}/login`,
    })

    return apiSuccess(created, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
