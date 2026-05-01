import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { NotificationType, UserRole } from "@prisma/client"
import { apiSuccess, handleApiError } from "@/lib/api/response"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

export async function POST(request: Request) {
  try {
    requireCronAuth(request)

    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        quantity: "asc",
      },
    })

    const criticalItems = lowStockItems.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    )

    if (criticalItems.length === 0) {
      return apiSuccess({
        critical_items: 0,
        notifications_created: 0,
      })
    }

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0) {
      const outOfStock = criticalItems.filter(
        (item) => Number(item.quantity) === 0
      )
      const lowStock = criticalItems.filter((item) => Number(item.quantity) > 0)

      if (outOfStock.length > 0) {
        await createNotifications({
          type: NotificationType.out_of_stock,
          title: `${outOfStock.length} material${outOfStock.length == 1 ? "" : "es"} agotado${outOfStock.length == 1 ? "" : "s"}`,
          body: outOfStock.map((item) => item.name).join(", "),
          metadata: {
            items: outOfStock.map((item) => ({
              id: item.id,
              name: item.name,
            })),
            actionUrl: "/inventory",
            actionLabel: "Ver inventario",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }

      if (lowStock.length > 0) {
        await createNotifications({
          type: NotificationType.low_stock,
          title: `${lowStock.length} material${lowStock.length == 1 ? "" : "es"} con stock bajo`,
          body: lowStock
            .map(
              (item) =>
                `${item.name} (${Number(item.quantity)}/${Number(item.minimumStock)} ${item.unit})`
            )
            .join(", "),
          metadata: {
            items: lowStock.map((item) => ({
              id: item.id,
              name: item.name,
            })),
            actionUrl: "/inventory",
            actionLabel: "Ver inventario",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }
    }

    return apiSuccess({
      critical_items: criticalItems.length,
      notifications_created: criticalItems.length,
      emails_sent: adminManagerIds.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
