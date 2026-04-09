import { NotificationType, Prisma, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { inventoryAdjustSchema } from "@/lib/validations/inventory"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"
import { toPrismaDecimal } from "@/lib/api/utils"

type RouteParams = {
  id: string
}

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

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
          WHERE id = ${id}
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

      if (newQuantity <= Number(current.minimum_stock)) {
        const admins = await tx.profile.findMany({
          where: {
            role: UserRole.admin,
            isActive: true,
          },
          select: {
            id: true,
          },
        })

        if (admins.length > 0) {
          const type =
            newQuantity === 0
              ? NotificationType.out_of_stock
              : NotificationType.low_stock

          await tx.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type,
              title: newQuantity === 0 ? "Material agotado" : "Stock critico",
              body:
                newQuantity === 0
                  ? `El material ${current.name} se ha agotado.`
                  : `El material ${current.name} quedo por debajo del minimo.`,
              metadata: {
                inventory_item_id: id,
                quantity: newQuantity,
                minimum_stock: Number(current.minimum_stock),
              },
            })),
          })
        }
      }

      return updatedItem
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}
