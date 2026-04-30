import { prisma } from "@/lib/prisma"
import { saleSchema } from "@/lib/validations/sales"
import { NotificationType, Prisma, SaleStatus, UserRole } from "@prisma/client"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

import {
  decimalToNumber,
  getSearchParam,
  parseDateParam,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))
    const status = getSearchParam(searchParams, "status")
    const customerId = getSearchParam(searchParams, "customer_id")
    const channel = getSearchParam(searchParams, "channel")

    const where: Prisma.SaleWhereInput = {}

    if (dateFrom || dateTo) {
      where.saleDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    if (status) {
      where.status = status as never
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (channel) {
      where.channel = channel as never
    }

    if (profile.role === UserRole.employee) {
      where.createdBy = profile.id
    }

    const sales = await prisma.sale.findMany({
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

    return apiSuccess(sales)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    const payload = await parseBodyWithSchema(request, saleSchema)

    const itemsTotal = payload.items.reduce(
      (acc, item) => acc + item.unit_price * item.quantity - item.discount,
      0
    )

    const netTotal = Math.max(itemsTotal - payload.discount, 0)
    const balanceDue = netTotal - payload.amount_paid

    const status: SaleStatus =
      balanceDue <= 0
        ? SaleStatus.paid
        : payload.amount_paid > 0
          ? SaleStatus.partial
          : SaleStatus.pending

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerId: payload.customer_id,
          saleDate: payload.sale_date,
          channel: payload.channel,
          paymentMethod: payload.payment_method,
          total: toPrismaDecimal(itemsTotal),
          discount: toPrismaDecimal(payload.discount),
          amountPaid: toPrismaDecimal(payload.amount_paid),
          changeGiven: toPrismaDecimal(
            balanceDue < 0 ? Math.abs(balanceDue) : 0
          ),
          status,
          notes: payload.notes,
          createdBy: profile.id,
          items: {
            create: payload.items.map((item) => ({
              catalogItemId: item.catalog_item_id,
              description: item.description,
              size: item.size,
              quantity: item.quantity,
              unitPrice: toPrismaDecimal(item.unit_price),
              discount: toPrismaDecimal(item.discount),
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Deduct Finished Good Stock if catalog_item_id is present
      for (const item of payload.items) {
        if (!item.catalog_item_id) continue

        const fgs = await tx.finishedGoodStock.findFirst({
          where: {
            catalogItemId: item.catalog_item_id,
            ...(item.size ? { size: item.size } : {})
          },
          orderBy: { stock: 'desc' }
        })

        if (fgs) {
          const newStock = fgs.stock - item.quantity
          await tx.finishedGoodStock.update({
            where: { id: fgs.id },
            data: { stock: newStock }
          })

          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: fgs.id,
              movementType: "out",
              quantity: item.quantity,
              previousQuantity: fgs.stock,
              newQuantity: newStock,
              reason: `Venta: ${sale.id}`,
              createdBy: profile.id
            }
          })
        }
      }

      await tx.notification.create({
        data: {
          userId: profile.id,
          type: NotificationType.sale_completed,
          title: "Venta registrada",
          body: `Se registro la venta ${sale.id}.`,
          metadata: {
            sale_id: sale.id,
            total: decimalToNumber(sale.total),
          },
        },
      })

      return sale
    })

    return apiSuccess(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
