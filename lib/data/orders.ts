import { Prisma, WorkOrderStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type OrderFilters = {
  status?: string
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  overdue?: boolean
}

export async function getWorkOrders(filters?: OrderFilters) {
  const where: Prisma.WorkOrderWhereInput = {}

  if (filters?.status) {
    where.status = filters.status as never
  }

  if (filters?.customerId) {
    where.customerId = filters.customerId
  }

  if (filters?.dateFrom || filters?.dateTo) {
    where.receivedDate = {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    }
  }

  if (filters?.overdue) {
    where.deliveryDate = {
      lt: new Date(),
    }
    where.status = {
      notIn: [WorkOrderStatus.delivered, WorkOrderStatus.cancelled],
    }
  }

  return prisma.workOrder.findMany({
    where,
    include: {
      customer: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getWorkOrder(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: true,
    },
  })
}

export async function getWorkOrderDetail(id: string) {
  const [order, statusHistory] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            catalogItem: {
              select: {
                id: true,
                name: true,
              },
            },
            inventoryItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        tableName: "work_orders",
        recordId: id,
      },
      include: {
        createdByProfile: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ])

  return {
    order,
    statusHistory,
  }
}

export async function getKanbanData() {
  const orders = await prisma.workOrder.findMany({
    include: {
      customer: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
    orderBy: {
      deliveryDate: "asc",
    },
  })

  return orders.reduce(
    (acc, order) => {
      acc[order.status].push(order)
      return acc
    },
    {
      [WorkOrderStatus.received]: [] as typeof orders,
      [WorkOrderStatus.confirmed]: [] as typeof orders,
      [WorkOrderStatus.in_production]: [] as typeof orders,
      [WorkOrderStatus.ready]: [] as typeof orders,
      [WorkOrderStatus.delivered]: [] as typeof orders,
      [WorkOrderStatus.cancelled]: [] as typeof orders,
    }
  )
}

export async function getOverdueOrders() {
  return prisma.workOrder.findMany({
    where: {
      deliveryDate: {
        lt: new Date(),
      },
      status: {
        notIn: [WorkOrderStatus.delivered, WorkOrderStatus.cancelled],
      },
    },
    include: {
      customer: true,
      items: {
        select: {
          quantity: true,
        },
      },
    },
  })
}

export async function getOrderFormBootstrap() {
  const [customers, catalogItems, inventoryItems] = await Promise.all([
    prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      take: 120,
    }),
    prisma.catalogItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        garmentType: true,
        salePrice: true,
      },
      take: 200,
    }),
    prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        unit: true,
        quantity: true,
      },
      take: 200,
    }),
  ])

  return {
    customers,
    catalogItems,
    inventoryItems,
  }
}
