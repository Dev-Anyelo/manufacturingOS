import { WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "view")

    const orders = await prisma.workOrder.findMany({
      select: {
        id: true,
        status: true,
        deliveryDate: true,
      },
    })

    const statusCounts = {
      [WorkOrderStatus.received]: 0,
      [WorkOrderStatus.confirmed]: 0,
      [WorkOrderStatus.in_production]: 0,
      [WorkOrderStatus.ready]: 0,
      [WorkOrderStatus.delivered]: 0,
      [WorkOrderStatus.cancelled]: 0,
    }

    const today = new Date()

    for (const order of orders) {
      statusCounts[order.status] += 1
    }

    const overdue = orders.filter(
      (order) =>
        order.deliveryDate < today &&
        order.status !== WorkOrderStatus.delivered &&
        order.status !== WorkOrderStatus.cancelled
    ).length

    return apiSuccess({
      total: orders.length,
      overdue,
      by_status: statusCounts,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
