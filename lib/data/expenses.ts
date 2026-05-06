import { prisma } from "@/lib/prisma"
import { Prisma, Currency } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { getSystemSettings } from "@/lib/data/settings"
import { convertAmount, getExchangeRate } from "@/lib/currency/exchange"
import { CurrencyRateService } from "@/lib/currency/currency-rate-service"

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

  // Get all currencies used in expenses
  const allCurrencies = new Set<Currency>()
  expenses.forEach((expense) => allCurrencies.add(expense.totalCurrency))

  // Build rate map for all currency pairs to base currency
  const ratePairs = Array.from(allCurrencies).map((currency) => ({
    from: currency,
    to: baseCurrency,
  }))
  const rateMap = await CurrencyRateService.fetchNormalizedRates(ratePairs)

  const summary = expenses.reduce(
    (acc, expense) => {
      const amount = decimalToNumber(expense.total)
      const converted = convertAmount(
        amount,
        expense.totalCurrency,
        baseCurrency,
        rateMap
      )

      acc.byCategory[expense.category] =
        (acc.byCategory[expense.category] ?? 0) + (converted ?? 0)
      acc.total += converted ?? 0
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

  // Get all currencies used in expenses
  const allCurrencies = new Set<Currency>()
  expenses.forEach((expense) => allCurrencies.add(expense.totalCurrency))

  // Build rate map for all currency pairs to base currency
  const ratePairs = Array.from(allCurrencies).map((currency) => ({
    from: currency,
    to: baseCurrency,
  }))
  const rateMap = await CurrencyRateService.fetchNormalizedRates(ratePairs)

  const byCategory: Record<string, number> = {}
  const byConcept = new Map<string, number>()
  let monthlyTotal = 0

  for (const expense of expenses) {
    const amount = decimalToNumber(expense.total)
    const converted = convertAmount(
      amount,
      expense.totalCurrency,
      baseCurrency,
      rateMap
    )

    const convertedAmount = converted ?? 0
    monthlyTotal += convertedAmount
    byCategory[expense.category] =
      (byCategory[expense.category] ?? 0) + convertedAmount
    byConcept.set(
      expense.concept,
      (byConcept.get(expense.concept) ?? 0) + convertedAmount
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
