import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type InventoryFilters = {
  category?: string
  search?: string
  stockStatus?: "normal" | "low" | "critical" | "out"
}

export type MovementFilters = {
  inventoryItemId?: string
  movementType?: string
  dateFrom?: Date
  dateTo?: Date
}

export async function getInventoryItems(filters?: InventoryFilters) {
  const where: Prisma.InventoryItemWhereInput = {
    isActive: true,
  }

  if (filters?.category) {
    where.category = filters.category as never
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { supplier: { contains: filters.search, mode: "insensitive" } },
    ]
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  })

  if (!filters?.stockStatus) {
    return items
  }

  return items.filter((item) => {
    const quantity = Number(item.quantity)
    const minimum = Number(item.minimumStock)

    if (filters.stockStatus === "out") {
      return quantity <= 0
    }

    if (filters.stockStatus === "critical") {
      return quantity > 0 && quantity <= minimum * 0.5
    }

    if (filters.stockStatus === "low") {
      return quantity > 0 && quantity <= minimum
    }

    return quantity > minimum
  })
}

export async function getInventoryItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      inventoryMovements: {
        include: {
          createdByProfile: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      },
    },
  })
}

export async function getInventoryMovements(filters?: MovementFilters) {
  const where: Prisma.InventoryMovementWhereInput = {}

  if (filters?.inventoryItemId) {
    where.inventoryItemId = filters.inventoryItemId
  }

  if (filters?.movementType) {
    where.movementType = filters.movementType as never
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    }
  }

  return prisma.inventoryMovement.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getLowStockItems() {
  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
    },
  })

  return items.filter(
    (item) => Number(item.quantity) <= Number(item.minimumStock)
  )
}
