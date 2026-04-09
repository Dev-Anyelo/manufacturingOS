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

export async function getKanbanData() {
  const orders = await prisma.workOrder.findMany({
    include: {
      customer: true,
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
    },
  })
}
