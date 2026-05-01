import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"
import { getSearchParam, parseDateParam } from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "view")

    const { searchParams } = new URL(request.url)
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))

    const where: Prisma.ProductionSessionWhereInput = {}

    if (dateFrom || dateTo) {
      where.sessionDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    const sessions = await prisma.productionSession.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        items: true,
      },
      orderBy: {
        sessionDate: "desc",
      },
    })

    return apiSuccess(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}
