import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"

export type ExpenseFilters = {
  dateFrom?: Date
  dateTo?: Date
  category?: string
}

export type ExpenseSummary = {
  byCategory: Record<string, number>
  total: number
}

export async function getExpenses(filters?: ExpenseFilters) {
  const where: Prisma.ExpenseWhereInput = {}

  if (filters?.dateFrom || filters?.dateTo) {
    where.expenseDate = {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    }
  }

  if (filters?.category) {
    where.category = filters.category as never
  }

  return prisma.expense.findMany({
    where,
    orderBy: {
      expenseDate: "desc",
    },
  })
}

export async function getExpenseSummary(
  dateFrom: Date,
  dateTo: Date
): Promise<ExpenseSummary> {
  const expenses = await prisma.expense.findMany({
    where: {
      expenseDate: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      category: true,
      total: true,
    },
  })

  const summary = expenses.reduce(
    (acc, expense) => {
      const total = decimalToNumber(expense.total)
      acc.byCategory[expense.category] =
        (acc.byCategory[expense.category] ?? 0) + total
      acc.total += total
      return acc
    },
    {
      byCategory: {} as Record<string, number>,
      total: 0,
    }
  )

  return summary
}
