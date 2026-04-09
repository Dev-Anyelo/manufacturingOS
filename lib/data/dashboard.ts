import { NotificationType, WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"

export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [todaySales, criticalStockCount, pendingOrdersCount, todayProduction] =
    await Promise.all([
      prisma.sale.findMany({
        where: {
          saleDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          total: true,
          discount: true,
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          isActive: true,
        },
        select: {
          quantity: true,
          minimumStock: true,
        },
      }),
      prisma.workOrder.count({
        where: {
          status: {
            in: [
              WorkOrderStatus.received,
              WorkOrderStatus.confirmed,
              WorkOrderStatus.in_production,
              WorkOrderStatus.ready,
            ],
          },
        },
      }),
      prisma.productionSession.findMany({
        where: {
          sessionDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          totalGarments: true,
        },
      }),
    ])

  const todaySalesAmount = todaySales.reduce(
    (acc, row) =>
      acc + decimalToNumber(row.total) - decimalToNumber(row.discount),
    0
  )

  return {
    todaySales: todaySalesAmount,
    todaySalesCount: todaySales.length,
    criticalStockCount: criticalStockCount.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    ).length,
    pendingOrdersCount,
    todayGarments: todayProduction.reduce(
      (acc, session) => acc + session.totalGarments,
      0
    ),
  }
}

export async function getRecentActivity(limit = 20) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getUnreadNotificationsCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
      type: {
        not: NotificationType.inventory_updated,
      },
    },
  })
}
