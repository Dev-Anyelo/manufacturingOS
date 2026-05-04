import { prisma } from "@/lib/prisma"
import { Prisma, WorkOrderStatus } from "@prisma/client"
import { workOrderSchema } from "@/lib/validations/orders"
import { requirePermission } from "@/lib/api/require-permission"
import { convertCurrency } from "@/lib/currency/exchange"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

import {
  getSearchParam,
  parseDateParam,
  toLocalDate,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "orders", "view")

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
    await requirePermission(profile, "orders", "create")

    const payload = await parseBodyWithSchema(request, workOrderSchema)
    const total = new Prisma.Decimal(payload.total)
    const advancePaid = new Prisma.Decimal(payload.advance_paid)
    const receivedDate = toLocalDate(new Date())

    // Calculate balance due considering currencies
    const normalizedAdvance = await convertCurrency(
      advancePaid,
      payload.advance_paid_currency,
      payload.total_currency,
      receivedDate
    )
    const balanceDue = Prisma.Decimal.max(total.sub(normalizedAdvance), 0)

    const order = await prisma.workOrder.create({
      data: {
        customerId: payload.customer_id,
        receivedDate,
        deliveryDate: toLocalDate(payload.delivery_date),
        channel: payload.channel,
        advancePaidCurrency: payload.advance_paid_currency,
        advancePaid: toPrismaDecimal(payload.advance_paid),
        totalCurrency: payload.total_currency,
        total: toPrismaDecimal(payload.total),
        balanceDue: balanceDue,
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
            unitPriceCurrency: item.unit_price_currency,
            unitPrice: toPrismaDecimal(item.unit_price),
            subtotal: new Prisma.Decimal(item.unit_price).mul(item.quantity),
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
