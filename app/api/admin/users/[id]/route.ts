import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

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

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    await requireAuth()
    const { id } = await resolveRouteParams(context.params)

    const user = await prisma.profile.findUnique({
      where: { id },
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
      },
    })

    if (!user) {
      return apiSuccess(null)
    }

    return apiSuccess(user)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, updateUserSchema)

    const updated = await prisma.profile.update({
      where: { id },
      data: {
        role: payload.role,
        isActive: payload.is_active,
        fullName: payload.full_name,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
        fullName: true,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    await prisma.profile.update({
      where: { id },
      data: {
        isActive: false,
      },
    })

    return apiSuccess({ id, desactivated: true })
  } catch (error) {
    return handleApiError(error)
  }
}
