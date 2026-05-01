import { UserRole } from "@/types"
import { prisma } from "@/lib/prisma"
import { ExpenseCategory } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"

import {
  apiSuccess,
  handleApiError,
  requireAuth,
  } from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "expenses", "view")

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startOfMonth,
        },
      },
      select: {
        category: true,
        concept: true,
        total: true,
      },
    })

    const byCategory = Object.values(ExpenseCategory).reduce(
      (acc, category) => {
        acc[category] = 0
        return acc
      },
      {} as Record<string, number>
    )

    const byConcept = new Map<string, number>()
    let monthlyTotal = 0

    for (const expense of expenses) {
      const total = decimalToNumber(expense.total)
      monthlyTotal += total
      byCategory[expense.category] = (byCategory[expense.category] ?? 0) + total
      byConcept.set(
        expense.concept,
        (byConcept.get(expense.concept) ?? 0) + total
      )
    }

    const topConcepts = [...byConcept.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept, total]) => ({ concept, total }))

    return apiSuccess({
      by_category: byCategory,
      monthly_total: monthlyTotal,
      top_concepts: topConcepts,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
