import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"

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
      items: true,
    },
  })
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
    },
  })

  const totalAmount = sales.reduce(
    (acc, row) =>
      acc + decimalToNumber(row.total) - decimalToNumber(row.discount),
    0
  )

  return {
    total_sales: sales.length,
    total_amount: totalAmount,
  }
}
