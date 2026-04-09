import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"

export type ProductionFilters = {
  employeeId?: string
  dateFrom?: Date
  dateTo?: Date
  garmentType?: string
}

export async function getProductionSessions(filters?: ProductionFilters) {
  const where: Prisma.ProductionSessionWhereInput = {}

  if (filters?.employeeId) {
    where.employeeId = filters.employeeId
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.sessionDate = {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    }
  }

  if (filters?.garmentType) {
    where.items = {
      some: {
        garmentType: filters.garmentType as never,
      },
    }
  }

  return prisma.productionSession.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: {
      sessionDate: "desc",
    },
  })
}

export async function getProductionSession(id: string) {
  return prisma.productionSession.findUnique({
    where: { id },
    include: {
      employee: true,
      items: {
        include: {
          inventoryItem: true,
        },
      },
    },
  })
}

export async function getTodayProductionSummary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const sessions = await prisma.productionSession.findMany({
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
  })

  return sessions.reduce(
    (acc, row) => {
      acc.total_garments += row.totalGarments
      acc.total_yards += decimalToNumber(row.totalYardsUsed)
      return acc
    },
    {
      total_garments: 0,
      total_yards: 0,
    }
  )
}
