import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import {
  apiSuccess,
  handleApiError,
  requireAuth,
  requireRole,
} from "@/lib/api/response"
import {
  decimalToNumber,
  getSearchParam,
  parseDateParam,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { searchParams } = new URL(request.url)
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))

    const payments = await prisma.payrollPayment.findMany({
      where: {
        periodStart: {
          gte: dateFrom,
        },
        periodEnd: {
          lte: dateTo,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        periodStart: "desc",
      },
    })

    const grouped = new Map<
      string,
      { employee_id: string; employee_name: string; total: number }
    >()

    for (const payment of payments) {
      const entry = grouped.get(payment.employeeId) ?? {
        employee_id: payment.employeeId,
        employee_name: payment.employee.fullName,
        total: 0,
      }

      entry.total += decimalToNumber(payment.total)
      grouped.set(payment.employeeId, entry)
    }

    return apiSuccess([...grouped.values()])
  } catch (error) {
    return handleApiError(error)
  }
}
