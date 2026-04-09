import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"
import { getSearchParam, parseDateParam } from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))

    const where: Prisma.SaleWhereInput = {}

    if (dateFrom || dateTo) {
      where.saleDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        saleDate: "desc",
      },
    })

    return apiSuccess(sales)
  } catch (error) {
    return handleApiError(error)
  }
}
