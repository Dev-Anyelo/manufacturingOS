import { prisma } from "@/lib/prisma"
import { toPrismaDecimal } from "@/lib/api/utils"
import { catalogItemSchema } from "@/lib/validations/catalog"
import { requirePermission } from "@/lib/api/require-permission"
import { GarmentType, InventoryMovementType } from "@prisma/client"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "catalog", "view")
    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.catalogItem.findUnique({
      where: { id },
    })

    return apiSuccess(item)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "catalog", "edit")

    const payload = await parseBodyWithSchema(request, catalogItemSchema)
    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.catalogItem.update({
        where: { id },
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

      const existingStocks = await tx.finishedGoodStock.findMany({
        where: { catalogItemId: id },
      })

      const incomingStockEntries = payload.stock_entries ?? []
      const processedKeys = new Set<string>()

      for (const stockItem of incomingStockEntries) {
        const normalizedColor = stockItem.color?.trim() ?? ""
        const stockKey = `${stockItem.size}_${normalizedColor}`
        processedKeys.add(stockKey)

        const existingStock = existingStocks.find(
          (stock) =>
            stock.size === stockItem.size &&
            (stock.color ?? "") === normalizedColor
        )

        if (existingStock) {
          const quantityChanged = existingStock.stock !== stockItem.quantity
          const updatedStock = await tx.finishedGoodStock.update({
            where: { id: existingStock.id },
            data: {
              stock: stockItem.quantity,
              minimumStock: stockItem.minimumStock,
            },
          })

          if (quantityChanged) {
            const difference = stockItem.quantity - existingStock.stock
            await tx.catalogMovement.create({
              data: {
                finishedGoodStockId: updatedStock.id,
                movementType:
                  difference > 0
                    ? InventoryMovementType.in
                    : InventoryMovementType.out,
                quantity: Math.abs(difference),
                previousQuantity: existingStock.stock,
                newQuantity: stockItem.quantity,
                reason: `Ajuste manual de stock ${stockItem.size}${
                  normalizedColor ? `/${normalizedColor}` : ""
                }`,
                createdBy: profile.id,
              },
            })
          }
        } else {
          const createdStock = await tx.finishedGoodStock.create({
            data: {
              catalogItemId: id,
              garmentType: payload.garment_type as GarmentType,
              size: stockItem.size,
              color: normalizedColor,
              stock: stockItem.quantity,
              minimumStock: stockItem.minimumStock,
            },
          })

          if (stockItem.quantity > 0) {
            await tx.catalogMovement.create({
              data: {
                finishedGoodStockId: createdStock.id,
                movementType: InventoryMovementType.in,
                quantity: stockItem.quantity,
                previousQuantity: 0,
                newQuantity: stockItem.quantity,
                reason: `Ajuste inicial de stock manual ${stockItem.size}${
                  normalizedColor ? `/${normalizedColor}` : ""
                }`,
                createdBy: profile.id,
              },
            })
          }
        }
      }

      const removedStocks = existingStocks.filter(
        (stock) => !processedKeys.has(`${stock.size}_${stock.color ?? ""}`)
      )

      for (const removed of removedStocks) {
        if (removed.stock > 0) {
          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: removed.id,
              movementType: InventoryMovementType.out,
              quantity: removed.stock,
              previousQuantity: removed.stock,
              newQuantity: 0,
              reason: `Eliminación manual de stock ${removed.size}${
                removed.color ? `/${removed.color}` : ""
              }`,
              createdBy: profile.id,
            },
          })
        }

        await tx.finishedGoodStock.delete({
          where: { id: removed.id },
        })
      }

      return updatedItem
    })

    return apiSuccess(item)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "catalog", "delete")

    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.catalogItem.findUnique({
      where: { id },
    })

    if (!item) {
      throw new ApiRouteError("Producto no encontrado", 404)
    }

    await prisma.$transaction(async (tx) => {
      // Log de desactivación
      await tx.auditLog.create({
        data: {
          tableName: "catalog_items",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(item)),
          createdBy: profile.id,
        },
      })

      await tx.catalogItem.update({
        where: { id },
        data: {
          isActive: false,
        },
      })
    })

    return apiSuccess({ id, deactivated: true })
  } catch (error) {
    return handleApiError(error)
  }
}
