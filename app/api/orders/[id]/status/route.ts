import { prisma } from "@/lib/prisma"
import { sendOrderReadyEmail } from "@/lib/email/send"
import { workOrderStatusSchema } from "@/lib/validations/orders"
import { requirePermission } from "@/lib/api/require-permission"
import { NotificationType, WorkOrderStatus } from "@prisma/client"

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
    await requirePermission(profile, "orders", "edit")

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

    // Update order using raw SQL to avoid issues with enum type casting in Prisma/Postgres
    await prisma.$executeRaw`
      UPDATE public.work_orders 
      SET status = CAST(${nextStatus} AS public.work_order_status),
          cancelled_reason = ${payload.cancelled_reason},
          updated_at = NOW()
      WHERE id = CAST(${id} AS uuid)
    `

    const updated = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })

    if (!updated) {
      throw new ApiRouteError("Error al recuperar el pedido actualizado", 500)
    }

    const adminManagerIds = await getUserIdsByRoles(["admin", "manager"])

    if (nextStatus === WorkOrderStatus.ready && adminManagerIds.length > 0) {
      await createNotifications({
        type: NotificationType.order_ready,
        title: "Pedido listo para entrega",
        body: `El pedido ${updated.id} esta listo para entregar.`,
        metadata: {
          orderId: updated.id,
          customerId: updated.customer?.id ?? null,
          customerName: updated.customer?.fullName ?? null,
          actionUrl: `/orders/${updated.id}`,
          actionLabel: "Ver pedido",
        },
        userIds: adminManagerIds,
        sendEmail: true,
      })

      if (updated.customer?.email) {
        await sendOrderReadyEmail(updated.customer.email, {
          customerName: updated.customer.fullName,
          orderDescription: `Pedido #${updated.id.slice(0, 8)}`,
          pendingBalance: Number(updated.balanceDue),
          workshopContact:
            process.env.RESEND_FROM_EMAIL ?? "onboarding@revvioapp.com",
        })
      }
    }

    if (
      nextStatus === WorkOrderStatus.cancelled &&
      adminManagerIds.length > 0
    ) {
      await createNotifications({
        type: NotificationType.order_cancelled,
        title: "Pedido cancelado",
        body: `El pedido ${updated.id} fue cancelado${updated.cancelledReason ? `: ${updated.cancelledReason}` : ""}.`,
        metadata: {
          orderId: updated.id,
          customerId: updated.customer?.id ?? null,
          customerName: updated.customer?.fullName ?? null,
          actionUrl: `/orders/${updated.id}`,
          actionLabel: "Ver pedido",
        },
        userIds: adminManagerIds,
        sendEmail: false,
      })
    }

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
