import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import {
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!sale) {
      return apiSuccess(null)
    }

    if (profile.role === UserRole.employee && sale.createdBy !== profile.id) {
      return apiSuccess(null)
    }

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
