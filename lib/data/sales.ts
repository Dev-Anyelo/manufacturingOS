import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { Currency } from "@prisma/client"
import { getExchangeRate } from "@/lib/currency/exchange"

export type SaleFilters = {
  dateFrom?: Date
  dateTo?: Date
  status?: string
  customerId?: string
  channel?: string
}

export async function getSales(filters?: SaleFilters) {
  const where: Prisma.SaleWhereInput = {}

  if (filters?.dateFrom || filters?.dateTo) {
    where.saleDate = {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    }
  }

  if (filters?.status) {
    where.status = filters.status as never
  }

  if (filters?.customerId) {
    where.customerId = filters.customerId
  }

  if (filters?.channel) {
    where.channel = filters.channel as never
  }

  return prisma.sale.findMany({
    where,
    include: {
      customer: true,
    },
    orderBy: {
      saleDate: "desc",
    },
  })
}

export async function getSale(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          catalogItem: true,
        },
      },
    },
  })
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          catalogItem: true,
        },
      },
    },
  })
}

export async function getSalesPosBootstrap() {
  const [catalogItems, customers] = await Promise.all([
    prisma.catalogItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        garmentType: true,
        salePrice: true,
        salePriceCurrency: true,
        imageUrl: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      take: 120,
    }),
  ])

  return {
    catalogItems,
    customers,
  }
}

export async function getTodaySalesSummary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sales = await prisma.sale.findMany({
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
  })

  // Fetch current rate for conversion
  let rate = 36.5
  try {
    const rateDecimal = await getExchangeRate(Currency.USD, Currency.NIO)
    rate = Number(rateDecimal)
  } catch (e) {
    console.error("Could not fetch exchange rate for sales summary", e)
  }

  const totalAmount = sales.reduce((acc, row) => {
    const amount = decimalToNumber(row.total) - decimalToNumber(row.discount)
    if (row.totalCurrency === Currency.NIO) {
      return acc + amount / rate
    }
    return acc + amount
  }, 0)

  return {
    total_sales: sales.length,
    total_amount: totalAmount,
  }
}
