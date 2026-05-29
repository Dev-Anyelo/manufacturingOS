import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  InventoryMovementType,
  NotificationType,
  SaleStatus,
  UserRole,
} from "@prisma/client"

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

import { recalculateCustomerTotalPurchases } from "@/lib/api/sales/customer-totals"

import { requirePermission } from "@/lib/api/require-permission"

const updateStatusSchema = z.object({
  status: z.nativeEnum(SaleStatus),
})

type RouteParams = {
  id: string
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "sales", "edit")

    const payload = await parseBodyWithSchema(request, updateStatusSchema)
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.$transaction(async (tx) => {
      const currentSale = await tx.sale.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              finishedGoodStock: true,
              catalogItem: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!currentSale) {
        throw new ApiRouteError("No se encontro la venta solicitada.", 404)
      }

      if (
        payload.status === SaleStatus.cancelled &&
        currentSale.status === SaleStatus.cancelled
      ) {
        throw new ApiRouteError("La venta ya estaba cancelada.", 409)
      }

      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          status: payload.status,
        },
      })

      if (
        payload.status === SaleStatus.cancelled &&
        currentSale.status !== SaleStatus.cancelled
      ) {
        for (const item of currentSale.items) {
          if (!item.finishedGoodStockId || item.quantity <= 0) continue

          const fgs = await tx.finishedGoodStock.findUnique({
            where: { id: item.finishedGoodStockId },
          })

          if (!fgs) continue

          const newStock = fgs.stock + item.quantity

          await tx.finishedGoodStock.update({
            where: { id: fgs.id },
            data: { stock: newStock },
          })

          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: fgs.id,
              movementType: InventoryMovementType.in,
              quantity: item.quantity,
              previousQuantity: fgs.stock,
              newQuantity: newStock,
              reason: `Cancelación de venta: #${updatedSale.id.slice(0, 8)}`,
              createdBy: profile.id,
            },
          })
        }
      }

      if (currentSale.customerId) {
        await recalculateCustomerTotalPurchases(tx, currentSale.customerId)
      }

      return updatedSale
    })

    if (payload.status === SaleStatus.paid) {
      const adminManagerIds = await getUserIdsByRoles(["admin", "manager"])

      if (adminManagerIds.length > 0) {
        await createNotifications({
          type: NotificationType.sale_completed,
          title: "Venta completada",
          body: `La venta #${sale.id.slice(0, 8)} fue marcada como pagada.`,
          metadata: {
            saleId: sale.id,
            total: sale.total,
            actionUrl: `/sales/${sale.id}`,
            actionLabel: "Ver venta",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }
    }

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
