import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { apiSuccess, handleApiError } from "@/lib/api/response"
import { NotificationType, UserRole, WorkOrderStatus } from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

export async function POST(request: Request) {
  try {
    requireCronAuth(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueOrders = await prisma.workOrder.findMany({
      where: {
        deliveryDate: {
          lte: today,
        },
        status: {
          notIn: [WorkOrderStatus.delivered, WorkOrderStatus.cancelled],
        },
      },
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
      },
    })

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0 && overdueOrders.length > 0) {
      await createNotifications({
        type: NotificationType.order_overdue,
        title: `${overdueOrders.length} pedido${overdueOrders.length == 1 ? "" : "s"} atrasado${overdueOrders.length == 1 ? "" : "s"}`,
        body: overdueOrders
          .map(
            (order) =>
              `${order.customer.fullName} (vencía ${order.deliveryDate.toISOString().slice(0, 10)})`
          )
          .join(" · "),
        metadata: {
          orderIds: overdueOrders.map((order) => order.id),
          actionUrl: "/orders",
          actionLabel: "Ver pedidos",
        },
        userIds: adminManagerIds,
        sendEmail: true,
      })
    }

    return apiSuccess({
      overdue_orders: overdueOrders.length,
      notifications_created: overdueOrders.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
