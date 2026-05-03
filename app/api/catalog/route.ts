import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { catalogItemSchema } from "@/lib/validations/catalog"
import { requirePermission } from "@/lib/api/require-permission"
import { getSearchParam, toPrismaDecimal } from "@/lib/api/utils"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  } from "@/lib/api/response"


export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "catalog", "view")

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
    await requirePermission(profile, "catalog", "create")

    const payload = await parseBodyWithSchema(request, catalogItemSchema)

    const item = await prisma.catalogItem.create({
      data: {
        name: payload.name,
        description: payload.description,
        garmentType: payload.garment_type,
        
        marketPriceUnit: toPrismaDecimal(payload.market_price_unit),
        marketPriceUnitCurrency: payload.market_price_unit_currency,
        
        marketPriceDozen:
          payload.market_price_dozen === null ||
          payload.market_price_dozen === undefined
            ? null
            : toPrismaDecimal(payload.market_price_dozen),
        marketPriceDozenCurrency: payload.market_price_dozen_currency,
        
        ourPriceUnit: toPrismaDecimal(payload.our_price_unit),
        ourPriceUnitCurrency: payload.our_price_unit_currency,
        
        ourPriceDozen:
          payload.our_price_dozen === null ||
          payload.our_price_dozen === undefined
            ? null
            : toPrismaDecimal(payload.our_price_dozen),
        ourPriceDozenCurrency: payload.our_price_dozen_currency,
        
        salePrice: toPrismaDecimal(payload.our_price_unit),
        salePriceCurrency: payload.our_price_unit_currency,
        
        estimatedCost:
          payload.estimated_cost === null ||
          payload.estimated_cost === undefined
            ? null
            : toPrismaDecimal(payload.estimated_cost),
        estimatedCostCurrency: payload.estimated_cost_currency,
        
        imageUrl: payload.image_url,
        notes: payload.notes,
      },
    })

    return apiSuccess(item, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
