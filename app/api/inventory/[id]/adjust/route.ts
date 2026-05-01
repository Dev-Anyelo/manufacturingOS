import { prisma } from "@/lib/prisma"
import { toPrismaDecimal } from "@/lib/api/utils"
import { inventoryAdjustSchema } from "@/lib/validations/inventory"
import { NotificationType, Prisma, UserRole } from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

import {
  ApiRouteError,
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

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "inventory", "create")

    const payload = await parseBodyWithSchema(request, inventoryAdjustSchema)
    const { id } = await resolveRouteParams(context.params)

    if (payload.inventory_item_id !== id) {
      throw new ApiRouteError(
        "El material seleccionado no coincide con la ruta.",
        422
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<
        Array<{
          id: string
          quantity: Prisma.Decimal
          minimum_stock: Prisma.Decimal
          name: string
        }>
      >(
        Prisma.sql`
          SELECT id, quantity, minimum_stock, name
          FROM public.inventory_items
          WHERE id = CAST(${id} AS uuid)
          FOR UPDATE
        `
      )

      const current = lockedRows[0]

      if (!current) {
        throw new ApiRouteError("No se encontro el material solicitado.", 404)
      }

      const currentQuantity = Number(current.quantity)
      let newQuantity = currentQuantity

      if (payload.adjustment_type === "add") {
        newQuantity = currentQuantity + payload.quantity
      }

      if (payload.adjustment_type === "subtract") {
        newQuantity = currentQuantity - payload.quantity
      }

      if (payload.adjustment_type === "set") {
        newQuantity = payload.quantity
      }

      if (newQuantity < 0) {
        throw new ApiRouteError(
          "El ajuste deja el inventario en negativo.",
          422
        )
      }

      const delta = newQuantity - currentQuantity

      if (delta === 0) {
        throw new ApiRouteError(
          "El ajuste no genero cambios en el inventario.",
          422
        )
      }

      const movementType =
        payload.adjustment_type === "add"
          ? "in"
          : payload.adjustment_type === "subtract"
            ? "out"
            : "adjustment"

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: {
          quantity: toPrismaDecimal(newQuantity),
        },
      })

      await tx.inventoryMovement.create({
        data: {
          inventoryItemId: id,
          movementType,
          quantity: toPrismaDecimal(delta),
          previousQuantity: current.quantity,
          newQuantity: toPrismaDecimal(newQuantity),
          reason: payload.reason,
          createdBy: profile.id,
        },
      })

      return {
        item: updatedItem,
        notificationState: {
          itemId: id,
          itemName: current.name,
          previousQuantity: currentQuantity,
          newQuantity,
          minimumStock: Number(current.minimum_stock),
          unit: updatedItem.unit,
        },
      }
    })

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0) {
      const { item, notificationState } = result

      await createNotifications({
        type: NotificationType.inventory_updated,
        title: "Inventario ajustado",
        body: `${notificationState.itemName}: ${notificationState.previousQuantity} → ${notificationState.newQuantity} ${item.unit}.`,
        metadata: {
          inventoryItemId: notificationState.itemId,
          itemName: notificationState.itemName,
          previousQty: notificationState.previousQuantity,
          newQty: notificationState.newQuantity,
          actionUrl: `/inventory/${notificationState.itemId}`,
          actionLabel: "Ver material",
        },
        userIds: adminManagerIds,
        sendEmail: false,
      })

      if (notificationState.newQuantity <= 0) {
        await createNotifications({
          type: NotificationType.out_of_stock,
          title: "Material agotado",
          body: `El material ${notificationState.itemName} se ha agotado.`,
          metadata: {
            inventoryItemId: notificationState.itemId,
            itemName: notificationState.itemName,
            actionUrl: `/inventory/${notificationState.itemId}`,
            actionLabel: "Ver material",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      } else if (
        notificationState.newQuantity <= notificationState.minimumStock
      ) {
        await createNotifications({
          type: NotificationType.low_stock,
          title: "Stock critico",
          body: `El material ${notificationState.itemName} quedo por debajo del minimo.`,
          metadata: {
            inventoryItemId: notificationState.itemId,
            itemName: notificationState.itemName,
            actionUrl: `/inventory/${notificationState.itemId}`,
            actionLabel: "Ajustar stock",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }
    }

    return apiSuccess(result.item)
  } catch (error) {
    return handleApiError(error)
  }
}
