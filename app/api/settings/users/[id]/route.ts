import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  is_active: z.boolean().optional(),
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .optional(),
})

type RouteParams = {
  id: string
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "edit")

    const payload = await parseBodyWithSchema(request, updateUserSchema)
    const { id } = await resolveRouteParams(context.params)

    const updated = await prisma.profile.update({
      where: { id },
      data: {
        role: payload.role,
        isActive: payload.is_active,
        fullName: payload.full_name,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
