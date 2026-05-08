import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { UserRole, ContractType, Currency, Prisma } from "@prisma/client"

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
  documentId: z.string().optional(),
  hireDate: z.string().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  baseSalary: z.number().optional(),
  baseSalaryCurrency: z.nativeEnum(Currency).optional(),
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

    const updateData: Prisma.ProfileUpdateInput = {
      role: payload.role,
      isActive: payload.is_active,
      fullName: payload.full_name,
    }

    if (payload.role === UserRole.employee && payload.documentId && payload.hireDate) {
      updateData.employee = {
        upsert: {
          create: {
            documentId: payload.documentId,
            hireDate: new Date(payload.hireDate),
            contractType: payload.contractType || "fixed_salary",
            baseSalary: payload.baseSalary || 0,
            baseSalaryCurrency: payload.baseSalaryCurrency || "NIO",
            fullName: payload.full_name || "Empleado",
          },
          update: {
            documentId: payload.documentId,
            hireDate: new Date(payload.hireDate),
            contractType: payload.contractType,
            baseSalary: payload.baseSalary,
            baseSalaryCurrency: payload.baseSalaryCurrency,
            fullName: payload.full_name,
          }
        }
      }
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: updateData,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
