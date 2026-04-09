import type { z } from "zod"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export class ApiRouteError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "ApiRouteError"
    this.status = status
  }
}

export type AuthProfile = {
  id: string
  role: string
  fullName: string | null
  isActive: boolean
}

export type AuthContext = {
  user: User
  profile: AuthProfile
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function apiError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  )
}

export async function requireAuth(
  _request?: NextRequest | Request
): Promise<AuthContext> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.id || !user.email) {
    throw new ApiRouteError("Debes iniciar sesion para continuar.", 401)
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      fullName: true,
      isActive: true,
    },
  })

  if (!profile) {
    throw new ApiRouteError("No se encontro el perfil del usuario.", 403)
  }

  if (!profile.isActive) {
    throw new ApiRouteError("Tu cuenta se encuentra desactivada.", 403)
  }

  return {
    user,
    profile: {
      id: profile.id,
      role: String(profile.role),
      fullName: profile.fullName,
      isActive: profile.isActive,
    },
  }
}

export function requireRole(profile: AuthProfile, roles: string[]) {
  if (!roles.includes(profile.role)) {
    throw new ApiRouteError(
      "No tienes permisos para realizar esta accion.",
      403
    )
  }
}

export async function parseRequestBody<T>(
  request: Request,
  parser: (payload: unknown) => T
): Promise<T> {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    throw new ApiRouteError("El cuerpo de la solicitud no es valido.", 400)
  }

  try {
    return parser(payload)
  } catch {
    throw new ApiRouteError("Los datos enviados no son validos.", 422)
  }
}

export async function parseBodyWithSchema<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    throw new ApiRouteError("El cuerpo de la solicitud no es valido.", 400)
  }

  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    throw new ApiRouteError(
      parsed.error.issues[0]?.message ?? "Datos invalidos.",
      422
    )
  }

  return parsed.data
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return apiError(error.message, error.status)
  }

  return apiError("Ocurrio un error inesperado en el servidor.", 500)
}

export async function resolveRouteParams<T>(
  params: T | Promise<T>
): Promise<T> {
  return Promise.resolve(params)
}
