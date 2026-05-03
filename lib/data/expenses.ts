import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { Currency } from "@prisma/client"
import { getExchangeRate } from "@/lib/currency/exchange"

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
      totalCurrency: true,
    },
  })

  // Fetch current rate for conversion
  let rate = 36.5
  try {
    const rateDecimal = await getExchangeRate(Currency.USD, Currency.NIO)
    rate = Number(rateDecimal)
  } catch (e) {
    console.error("Could not fetch exchange rate for expense summary", e)
  }

  const summary = expenses.reduce(
    (acc, expense) => {
      const amount = decimalToNumber(expense.total)
      const converted = expense.totalCurrency === Currency.NIO ? amount / rate : amount
      
      acc.byCategory[expense.category] =
        (acc.byCategory[expense.category] ?? 0) + converted
      acc.total += converted
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
      totalCurrency: true,
    },
  })

  // Fetch current rate for conversion
  let rate = 36.5
  try {
    const rateDecimal = await getExchangeRate(Currency.USD, Currency.NIO)
    rate = Number(rateDecimal)
  } catch (e) {
    console.error("Could not fetch exchange rate for monthly expense overview", e)
  }

  const byCategory: Record<string, number> = {}
  const byConcept = new Map<string, number>()
  let monthlyTotal = 0

  for (const expense of expenses) {
    const amount = decimalToNumber(expense.total)
    const converted = expense.totalCurrency === Currency.NIO ? amount / rate : amount

    monthlyTotal += converted
    byCategory[expense.category] = (byCategory[expense.category] ?? 0) + converted
    byConcept.set(
      expense.concept,
      (byConcept.get(expense.concept) ?? 0) + converted
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
