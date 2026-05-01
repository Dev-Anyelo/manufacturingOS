import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { requirePermission } from "@/lib/api/require-permission"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "view")

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [sales, production, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          saleDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          total: true,
          discount: true,
        },
      }),
      prisma.productionSession.findMany({
        where: {
          sessionDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          totalGarments: true,
          totalYardsUsed: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          total: true,
        },
      }),
    ])

    const totalSales = sales.reduce(
      (acc, row) =>
        acc + (decimalToNumber(row.total) - decimalToNumber(row.discount)),
      0
    )

    const totalExpenses = expenses.reduce(
      (acc, row) => acc + decimalToNumber(row.total),
      0
    )

    const totalGarments = production.reduce(
      (acc, row) => acc + row.totalGarments,
      0
    )

    const totalYards = production.reduce(
      (acc, row) => acc + decimalToNumber(row.totalYardsUsed),
      0
    )

    return apiSuccess({
      sales: {
        count: sales.length,
        amount: totalSales,
      },
      production: {
        sessions: production.length,
        total_garments: totalGarments,
        total_yards_used: totalYards,
      },
      expenses: {
        count: expenses.length,
        amount: totalExpenses,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
