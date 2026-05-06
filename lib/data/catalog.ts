import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type CatalogFilters = {
  search?: string
  garmentType?: string
}

export async function getCatalogItems(filters?: CatalogFilters) {
  const where: Prisma.CatalogItemWhereInput = {
    isActive: true,
  }

  if (filters?.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ]
  }

  if (filters?.garmentType) {
    where.garmentType = filters.garmentType
  }

  return prisma.catalogItem.findMany({
    where,
    select: {
      id: true,
      name: true,
      garmentType: true,
      marketPriceUnit: true,
      marketPriceUnitCurrency: true,
      marketPriceDozen: true,
      marketPriceDozenCurrency: true,
      ourPriceUnit: true,
      ourPriceUnitCurrency: true,
      ourPriceDozen: true,
      ourPriceDozenCurrency: true,
      salePrice: true,
      salePriceCurrency: true,
      estimatedCost: true,
      estimatedCostCurrency: true,
      imageUrl: true,
      notes: true,
      finishedGoods: {
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          minimumStock: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getCatalogItem(id: string) {
  return prisma.catalogItem.findUnique({
    where: {
      id,
    },
    include: {
      finishedGoods: {
        orderBy: { size: "asc" },
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              createdByProfile: {
                select: { fullName: true },
              },
            },
          },
        },
      },
    },
  })
}
