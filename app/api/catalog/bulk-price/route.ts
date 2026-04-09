import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { Prisma, UserRole } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

const bulkPriceSchema = z.object({
  percentage: z.coerce
    .number({ message: "El porcentaje es obligatorio" })
    .refine((value) => value !== 0, {
      message: "El porcentaje no puede ser 0",
    }),
  target: z.enum(["our_price_unit", "our_price_dozen", "all"], {
    message: "Selecciona un objetivo de precio valido",
  }),
})

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, bulkPriceSchema)

    const factor = 1 + payload.percentage / 100

    const updates: Prisma.CatalogItemUpdateManyMutationInput = {
      salePrice: {
        multiply: factor,
      },
    }

    if (payload.target === "our_price_unit" || payload.target === "all") {
      updates.ourPriceUnit = {
        multiply: factor,
      }
    }

    if (payload.target === "our_price_dozen" || payload.target === "all") {
      updates.ourPriceDozen = {
        multiply: factor,
      }
    }

    const result = await prisma.catalogItem.updateMany({
      where: {
        isActive: true,
      },
      data: updates,
    })

    return apiSuccess({
      updated_count: result.count,
      percentage: payload.percentage,
      target: payload.target,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
