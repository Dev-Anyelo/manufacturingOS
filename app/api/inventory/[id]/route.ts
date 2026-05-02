import { prisma } from "@/lib/prisma"
import { inventoryItemSchema } from "@/lib/validations/inventory"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "inventory", "view")

    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.inventoryItem.findUnique({
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
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!item || !item.isActive) {
      return apiSuccess(null)
    }

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
    await requirePermission(profile, "inventory", "edit")

    const payload = await parseBodyWithSchema(request, inventoryItemSchema)
    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.inventoryItem.update({
      where: { id },
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
    await requirePermission(profile, "inventory", "delete")

    const { id } = await resolveRouteParams(context.params)

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!item) {
      return apiSuccess({ id, deleted: true })
    }

    await prisma.$transaction(async (tx) => {
      // Create audit log for soft delete
      await tx.auditLog.create({
        data: {
          tableName: "inventory_items",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(item)),
          createdBy: profile.id,
        },
      })

      await tx.inventoryItem.update({
        where: { id },
        data: {
          isActive: false,
        },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
