import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { SaleStatus, UserRole } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

const updateStatusSchema = z.object({
  status: z.nativeEnum(SaleStatus),
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
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, updateStatusSchema)
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        status: payload.status,
      },
    })

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
