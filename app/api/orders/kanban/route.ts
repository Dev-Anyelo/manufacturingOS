import { prisma } from "@/lib/prisma"
import { WorkOrderStatus } from "@prisma/client"
import { requirePermission } from "@/lib/api/require-permission"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "orders", "view")

    const orders = await prisma.workOrder.findMany({
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        deliveryDate: "asc",
      },
    })

    const grouped = {
      [WorkOrderStatus.received]: [],
      [WorkOrderStatus.confirmed]: [],
      [WorkOrderStatus.in_production]: [],
      [WorkOrderStatus.ready]: [],
      [WorkOrderStatus.delivered]: [],
      [WorkOrderStatus.cancelled]: [],
    } as Record<WorkOrderStatus, typeof orders>

    for (const order of orders) {
      grouped[order.status].push(order)
    }

    return apiSuccess(grouped)
  } catch (error) {
    return handleApiError(error)
  }
}
