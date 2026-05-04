import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { Currency } from "@prisma/client"
import { getExchangeRate, convertAmount } from "@/lib/currency/exchange"
import { getSystemSettings } from "@/lib/data/settings"

export type ExpenseFilters = {
  dateFrom?: Date
  dateTo?: Date
  category?: string
}

export type ExpenseSummary = {
  byCategory: Record<string, number>
  total: number
  baseCurrency: Currency
}

export type MonthlyExpenseOverview = {
  byCategory: Record<string, number>
  monthlyTotal: number
  baseCurrency: Currency
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

  // Fetch system settings and current rate
  const settings = await getSystemSettings()
  const baseCurrency = settings.baseCurrency
  const rateNIO = decimalToNumber(await getExchangeRate(Currency.USD, Currency.NIO))

  const summary = expenses.reduce(
    (acc, expense) => {
      const amount = decimalToNumber(expense.total)
      const converted = convertAmount(amount, expense.totalCurrency, baseCurrency, rateNIO)
      
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

  return { ...summary, baseCurrency }
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

  // Fetch system settings and current rate
  const settings = await getSystemSettings()
  const baseCurrency = settings.baseCurrency
  const rateNIO = decimalToNumber(await getExchangeRate(Currency.USD, Currency.NIO))

  const byCategory: Record<string, number> = {}
  const byConcept = new Map<string, number>()
  let monthlyTotal = 0

  for (const expense of expenses) {
    const amount = decimalToNumber(expense.total)
    const converted = convertAmount(amount, expense.totalCurrency, baseCurrency, rateNIO)

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
    baseCurrency,
    topConcepts,
  }
}

export async function getExpenseById(id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      inventoryItem: true,
      payrollPayment: {
        include: {
          employee: true,
        },
      },
      createdByProfile: true,
    },
  })

  if (!expense) return null

  return {
    ...expense,
    total: decimalToNumber(expense.total),
    unitPrice: expense.unitPrice ? decimalToNumber(expense.unitPrice) : null,
    inventoryQuantityAdded: expense.inventoryQuantityAdded
      ? decimalToNumber(expense.inventoryQuantityAdded)
      : null,
  }
}
