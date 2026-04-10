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

export type MonthlyExpenseOverview = {
  byCategory: Record<string, number>
  monthlyTotal: number
  topConcepts: Array<{ concept: string; total: number }>
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
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
    },
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

export async function getExpensesFormBootstrap() {
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true,
    },
  })

  return {
    inventoryItems,
  }
}

export async function getMonthlyExpenseOverview(): Promise<MonthlyExpenseOverview> {
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

  const byCategory: Record<string, number> = {}
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

  return {
    byCategory,
    monthlyTotal,
    topConcepts,
  }
}
