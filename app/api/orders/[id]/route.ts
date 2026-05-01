import { prisma } from "@/lib/prisma"
import { toPrismaDecimal } from "@/lib/api/utils"
import { Prisma, WorkOrderStatus } from "@prisma/client"
import { workOrderSchema } from "@/lib/validations/orders"
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
    await requirePermission(profile, "orders", "view")
    const { id } = await resolveRouteParams(context.params)

    const [order, statusHistory] = await Promise.all([
      prisma.workOrder.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          tableName: "work_orders",
          recordId: id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ])

    return apiSuccess({
      order,
      status_history: statusHistory,
    })
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
    await requirePermission(profile, "orders", "edit")

    const payload = await parseBodyWithSchema(request, workOrderSchema)
    const { id } = await resolveRouteParams(context.params)

    const currentOrder = await prisma.workOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    })

    if (!currentOrder) {
      throw new ApiRouteError("No se encontro el pedido solicitado.", 404)
    }

    if (
      currentOrder.status !== WorkOrderStatus.received &&
      currentOrder.status !== WorkOrderStatus.confirmed
    ) {
      throw new ApiRouteError(
        "Solo se pueden editar pedidos en estado recibido o confirmado.",
        422
      )
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      await tx.workOrderItem.deleteMany({
        where: {
          workOrderId: id,
        },
      })

      return tx.workOrder.update({
        where: { id },
        data: {
          customerId: payload.customer_id,
          deliveryDate: payload.delivery_date,
          channel: payload.channel,
          advancePaid: toPrismaDecimal(payload.advance_paid),
          total: toPrismaDecimal(payload.total),
          notes: payload.notes,
          items: {
            create: payload.items.map((item) => ({
              catalogItemId: item.catalog_item_id,
              description: item.description,
              size: item.size,
              measurements:
                item.measurements === null
                  ? Prisma.JsonNull
                  : item.measurements
                    ? (item.measurements as Prisma.InputJsonValue)
                    : undefined,
              inventoryItemId: item.inventory_item_id,
              color: item.color,
              designNotes: item.design_notes,
              quantity: item.quantity,
              unitPrice: toPrismaDecimal(item.unit_price),
            })),
          },
        },
        include: {
          items: true,
        },
      })
    })

    return apiSuccess(updatedOrder)
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
    await requirePermission(profile, "orders", "delete")

    const { id } = await resolveRouteParams(context.params)

    const order = await prisma.workOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    })

    if (!order) {
      throw new ApiRouteError("No se encontro el pedido solicitado.", 404)
    }

    if (
      order.status !== WorkOrderStatus.received &&
      order.status !== WorkOrderStatus.cancelled
    ) {
      throw new ApiRouteError(
        "Solo se pueden eliminar pedidos recibidos o cancelados.",
        422
      )
    }

    await prisma.workOrder.delete({
      where: { id },
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
