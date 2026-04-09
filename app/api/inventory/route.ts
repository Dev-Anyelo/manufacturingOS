import { prisma } from "@/lib/prisma"
import { getSearchParam } from "@/lib/api/utils"
import { Prisma, UserRole } from "@prisma/client"
import { inventoryItemSchema } from "@/lib/validations/inventory"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const category = getSearchParam(searchParams, "category")
    const search = getSearchParam(searchParams, "search")
    const stockStatus = getSearchParam(searchParams, "stock_status")

    const where: Prisma.InventoryItemWhereInput = {
      isActive: true,
    }

    if (category) {
      where.category = category as never
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          supplier: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    const filteredItems = items.filter((item) => {
      const quantity = Number(item.quantity)
      const minimum = Number(item.minimumStock)

      if (!stockStatus || stockStatus === "normal") {
        if (stockStatus === "normal") {
          return quantity > minimum
        }
        return true
      }

      if (stockStatus === "out") {
        return quantity <= 0
      }

      if (stockStatus === "critical") {
        return quantity > 0 && quantity <= minimum * 0.5
      }

      if (stockStatus === "low") {
        return quantity > 0 && quantity <= minimum
      }

      return true
    })

    return apiSuccess(filteredItems)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, inventoryItemSchema)

    const item = await prisma.inventoryItem.create({
      data: {
        name: payload.name,
        category: payload.category,
        fabricType: payload.fabric_type,
        color: payload.color,
        quantity: payload.quantity,
        unit: payload.unit,
        unitPrice: payload.unit_price,
        minimumStock: payload.minimum_stock,
        supplier: payload.supplier,
        notes: payload.notes,
        imageUrl: payload.image_url,
        isActive: payload.is_active,
      },
    })

    return apiSuccess(item, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
