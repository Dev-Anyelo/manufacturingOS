import { prisma } from "@/lib/prisma"
import { toPrismaDecimal } from "@/lib/api/utils"
import { catalogItemSchema } from "@/lib/validations/catalog"
import { requirePermission } from "@/lib/api/require-permission"

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

    const item = await prisma.catalogItem.update({
      where: { id },
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
