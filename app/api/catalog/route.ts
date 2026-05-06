import { prisma } from "@/lib/prisma"
import { Prisma, InventoryMovementType } from "@prisma/client"
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
      include: {
        finishedGoods: {
          select: {
            id: true,
            garmentType: true,
            size: true,
            color: true,
            stock: true,
            minimumStock: true,
          },
        },
      },
    })

    const itemsWithStock = items.map((item) => ({
      ...item,
      finishedGoods: item.finishedGoods.map((variant) => ({
        ...variant,
        color: variant.color?.trim() || null,
      })),
      totalStock: item.finishedGoods.reduce(
        (sum, variant) => sum + variant.stock,
        0
      ),
    }))

    return apiSuccess(itemsWithStock)
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

    // Handle stock creation if provided
    if (payload.stock_entries && payload.stock_entries.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const stockItem of payload.stock_entries) {
          const normalizedColor = stockItem.color?.trim() || null

          const existingStock = await tx.finishedGoodStock.findFirst({
            where: {
              catalogItemId: item.id,
              garmentType: payload.garment_type,
              size: stockItem.size,
              color: normalizedColor,
            },
          })

          const finishedGoodStock = existingStock
            ? await tx.finishedGoodStock.update({
                where: { id: existingStock.id },
                data: {
                  stock: stockItem.quantity,
                  minimumStock: stockItem.minimumStock,
                },
              })
            : await tx.finishedGoodStock.create({
                data: {
                  catalogItemId: item.id,
                  garmentType: payload.garment_type,
                  size: stockItem.size,
                  color: normalizedColor,
                  stock: stockItem.quantity,
                  minimumStock: stockItem.minimumStock,
                },
              })

          // Create CatalogMovement for initial stock
          if (stockItem.quantity > 0) {
            await tx.catalogMovement.create({
              data: {
                finishedGoodStockId: finishedGoodStock.id,
                movementType: InventoryMovementType.in,
                quantity: stockItem.quantity,
                previousQuantity: 0,
                newQuantity: stockItem.quantity,
                reason: `Initial stock setup for ${stockItem.size}${stockItem.color ? `/${stockItem.color}` : ""}`,
                createdBy: profile.id,
              },
            })
          }
        }
      })
    }

    return apiSuccess(item, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
