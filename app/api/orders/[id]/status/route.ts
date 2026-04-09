import { NotificationType, UserRole, WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendOrderReadyEmail } from "@/lib/email/send"
import { workOrderStatusSchema } from "@/lib/validations/orders"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.received]: [
    WorkOrderStatus.confirmed,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.confirmed]: [
    WorkOrderStatus.in_production,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.in_production]: [
    WorkOrderStatus.ready,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.ready]: [WorkOrderStatus.delivered],
  [WorkOrderStatus.delivered]: [],
  [WorkOrderStatus.cancelled]: [],
}

type RouteParams = {
  id: string
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, workOrderStatusSchema)

    const currentOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })

    if (!currentOrder) {
      throw new ApiRouteError("No se encontro el pedido solicitado.", 404)
    }

    const nextStatus = payload.status as WorkOrderStatus
    const allowed = validTransitions[currentOrder.status]

    if (!allowed.includes(nextStatus)) {
      throw new ApiRouteError(
        `No se permite cambiar de ${currentOrder.status} a ${nextStatus}.`,
        422
      )
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: nextStatus,
        cancelledReason: payload.cancelled_reason,
      },
      include: {
        customer: true,
      },
    })

    const admins = await prisma.profile.findMany({
      where: {
        role: UserRole.admin,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (nextStatus === WorkOrderStatus.ready && admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.order_ready,
          title: "Pedido listo para entrega",
          body: `El pedido ${updated.id} esta listo para entregar.`,
          metadata: {
            order_id: updated.id,
          },
        })),
      })

      if (updated.customer?.email) {
        await sendOrderReadyEmail(updated.customer.email, {
          customerName: updated.customer.fullName,
          orderDescription: `Pedido #${updated.id}`,
          pendingBalance: Number(updated.balanceDue),
          workshopContact:
            process.env.RESEND_FROM_EMAIL ?? "soporte@manufacturingos.app",
        })
      }
    }

    if (nextStatus === WorkOrderStatus.delivered && admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.sale_completed,
          title: "Pedido entregado",
          body: `El pedido ${updated.id} fue entregado y genero una venta automatica.`,
          metadata: {
            order_id: updated.id,
          },
        })),
      })
    }

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
