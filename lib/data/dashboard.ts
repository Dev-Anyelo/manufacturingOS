import { NotificationType, WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { getExchangeRate, convertAmount } from "@/lib/currency/exchange"
import { getSystemSettings } from "@/lib/data/settings"
import { Currency } from "@prisma/client"

export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const [
    todaySales,
    yesterdaySales,
    criticalStockCount,
    pendingOrdersCount,
    todayProduction,
    yesterdayProduction,
  ] = await Promise.all([
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
        totalCurrency: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        saleDate: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        total: true,
        discount: true,
        totalCurrency: true,
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      select: {
        quantity: true,
        minimumStock: true,
      },
    }),
    prisma.workOrder.count({
      where: {
        status: {
          in: [
            WorkOrderStatus.received,
            WorkOrderStatus.confirmed,
            WorkOrderStatus.in_production,
            WorkOrderStatus.ready,
          ],
        },
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
      },
    }),
    prisma.productionSession.findMany({
      where: {
        sessionDate: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        totalGarments: true,
      },
    }),
  ])

  // Fetch system settings and current rate
  const settings = await getSystemSettings()
  const baseCurrency = settings.baseCurrency
  const rateNIO = decimalToNumber(await getExchangeRate(Currency.USD, Currency.NIO))

  const todaySalesAmount = todaySales.reduce((acc, row) => {
    const amount = decimalToNumber(row.total) - decimalToNumber(row.discount)
    const converted = convertAmount(amount, row.totalCurrency, baseCurrency, rateNIO)
    return acc + converted
  }, 0)

  const yesterdaySalesAmount = yesterdaySales.reduce((acc, row) => {
    const amount = decimalToNumber(row.total) - decimalToNumber(row.discount)
    const converted = convertAmount(amount, row.totalCurrency, baseCurrency, rateNIO)
    return acc + converted
  }, 0)

  const todayGarments = todayProduction.reduce(
    (acc, session) => acc + session.totalGarments,
    0
  )

  const yesterdayGarments = yesterdayProduction.reduce(
    (acc, session) => acc + session.totalGarments,
    0
  )

  return {
    todaySales: todaySalesAmount,
    baseCurrency,
    todaySalesCount: todaySales.length,
    yesterdaySales: yesterdaySalesAmount,
    yesterdaySalesCount: yesterdaySales.length,
    criticalStockCount: criticalStockCount.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    ).length,
    pendingOrdersCount,
    todayGarments,
    yesterdayGarments,
  }
}

/** Pedidos activos próximos a vencer u obligatoriamente con fecha pasada */
export async function getDashboardUrgentOrders(limit = 8) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const inThreeDays = new Date(startOfToday)
  inThreeDays.setDate(inThreeDays.getDate() + 3)

  const rows = await prisma.workOrder.findMany({
    where: {
      status: {
        notIn: [
          WorkOrderStatus.delivered,
          WorkOrderStatus.cancelled,
        ],
      },
      OR: [
        { deliveryDate: { lt: startOfToday } },
        {
          deliveryDate: {
            gt: startOfToday,
            lte: inThreeDays,
          },
        },
      ],
    },
    take: limit,
    orderBy: { deliveryDate: "asc" },
    select: {
      id: true,
      deliveryDate: true,
      status: true,
      customer: { select: { fullName: true } },
      items: { select: { quantity: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    deliveryDate: row.deliveryDate.toISOString(),
    status: row.status,
    customerName: row.customer.fullName,
    garmentCount: row.items.reduce((a, item) => a + item.quantity, 0),
  }))
}

export async function getRecentActivity(limit = 20) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getUnreadNotificationsCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
      type: {
        not: NotificationType.inventory_updated,
      },
    },
  })
}

export async function getFinancialChartData(options: { dateFrom?: Date; dateTo?: Date } = {}) {
  const endDate = options.dateTo ?? new Date()
  if (!options.dateTo) endDate.setHours(23, 59, 59, 999)

  const startDate = options.dateFrom ?? new Date()
  if (!options.dateFrom) {
    startDate.setDate(endDate.getDate() - 30) // Default to 30 days if no range provided
    startDate.setHours(0, 0, 0, 0)
  }

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: "cancelled",
        },
      },
      select: {
        saleDate: true,
        total: true,
        discount: true,
        totalCurrency: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        expenseDate: true,
        total: true,
        totalCurrency: true,
      },
    }),
  ])

  const daysMap = new Map<string, { date: string; sales: number; expenses: number }>()

  // Initialize days with 0 between start and end
  const current = new Date(startDate)
  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0]
    daysMap.set(dateStr, { date: dateStr, sales: 0, expenses: 0 })
    current.setDate(current.getDate() + 1)
  }

  // Fetch system settings and current rate
  const settings = await getSystemSettings()
  const baseCurrency = settings.baseCurrency
  const rateNIO = decimalToNumber(await getExchangeRate(Currency.USD, Currency.NIO))

  // Aggregate Sales
  for (const sale of sales) {
    const dateStr = sale.saleDate.toISOString().split("T")[0]
    const current = daysMap.get(dateStr)
    if (current) {
      const amount = decimalToNumber(sale.total) - decimalToNumber(sale.discount)
      const converted = convertAmount(amount, sale.totalCurrency, baseCurrency, rateNIO)
      current.sales += converted
    }
  }

  // Aggregate Expenses
  for (const exp of expenses) {
    const dateStr = exp.expenseDate.toISOString().split("T")[0]
    const current = daysMap.get(dateStr)
    if (current) {
      const amount = decimalToNumber(exp.total)
      const converted = convertAmount(amount, exp.totalCurrency, baseCurrency, rateNIO)
      current.expenses += converted
    }
  }

  return Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}
