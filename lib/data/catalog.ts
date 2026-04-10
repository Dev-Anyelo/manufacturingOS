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
  })
}
