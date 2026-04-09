import { NotificationType, UserRole, WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { apiSuccess, handleApiError } from "@/lib/api/response"

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

    const admins = await prisma.profile.findMany({
      where: {
        role: UserRole.admin,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    const notifications = overdueOrders.flatMap((order) =>
      admins.map((admin) => ({
        userId: admin.id,
        type: NotificationType.order_overdue,
        title: "Pedido vencido",
        body: `El pedido ${order.id} de ${order.customer.fullName} esta vencido.`,
        metadata: {
          order_id: order.id,
        },
      }))
    )

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      })
    }

    return apiSuccess({
      overdue_orders: overdueOrders.length,
      notifications_created: notifications.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
