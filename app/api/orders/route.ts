import { prisma } from "@/lib/prisma"
import { workOrderSchema } from "@/lib/validations/orders"
import { Prisma, UserRole, WorkOrderStatus } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

import {
  getSearchParam,
  parseDateParam,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = getSearchParam(searchParams, "status")
    const customerId = getSearchParam(searchParams, "customer_id")
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))
    const overdue = getSearchParam(searchParams, "overdue") === "true"

    const where: Prisma.WorkOrderWhereInput = {}

    if (status) {
      where.status = status as never
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (dateFrom || dateTo) {
      where.receivedDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    if (overdue) {
      where.deliveryDate = {
        lt: new Date(),
      }
      where.status = {
        notIn: [WorkOrderStatus.delivered, WorkOrderStatus.cancelled],
      }
    }

    const orders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiSuccess(orders)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, workOrderSchema)

    const order = await prisma.workOrder.create({
      data: {
        customerId: payload.customer_id,
        deliveryDate: payload.delivery_date,
        channel: payload.channel,
        advancePaid: toPrismaDecimal(payload.advance_paid),
        total: toPrismaDecimal(payload.total),
        notes: payload.notes,
        createdBy: profile.id,
        items: {
          create: payload.items.map((item) => ({
            catalogItemId: item.catalog_item_id,
            description: item.description,
            size: item.size,
            measurements: item.measurements
              ? (item.measurements as Prisma.InputJsonValue)
              : undefined,
            inventoryItemId: item.inventory_item_id,
            color: item.color,
            designNotes: item.design_notes,
            quantity: item.quantity,
            unitPrice: toPrismaDecimal(item.unit_price),
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return apiSuccess(order, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
