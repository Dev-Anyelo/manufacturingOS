import { prisma } from "@/lib/prisma"
import { Prisma, UserRole } from "@prisma/client"
import { catalogItemSchema } from "@/lib/validations/catalog"
import { getSearchParam, toPrismaDecimal } from "@/lib/api/utils"

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
    const search = getSearchParam(searchParams, "search")
    const garmentType = getSearchParam(searchParams, "garment_type")

    const where: Prisma.CatalogItemWhereInput = {
      isActive: true,
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
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    if (garmentType) {
      where.garmentType = garmentType
    }

    const items = await prisma.catalogItem.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiSuccess(items)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, catalogItemSchema)

    const item = await prisma.catalogItem.create({
      data: {
        name: payload.name,
        description: payload.description,
        garmentType: payload.garment_type,
        marketPriceUnit: toPrismaDecimal(payload.market_price_unit),
        marketPriceDozen:
          payload.market_price_dozen === null ||
          payload.market_price_dozen === undefined
            ? null
            : toPrismaDecimal(payload.market_price_dozen),
        ourPriceUnit: toPrismaDecimal(payload.our_price_unit),
        ourPriceDozen:
          payload.our_price_dozen === null ||
          payload.our_price_dozen === undefined
            ? null
            : toPrismaDecimal(payload.our_price_dozen),
        salePrice: toPrismaDecimal(payload.our_price_unit),
        estimatedCost:
          payload.estimated_cost === null ||
          payload.estimated_cost === undefined
            ? null
            : toPrismaDecimal(payload.estimated_cost),
        imageUrl: payload.image_url,
        notes: payload.notes,
      },
    })

    return apiSuccess(item, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
