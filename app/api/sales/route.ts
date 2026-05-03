import { prisma } from "@/lib/prisma"
import { saleSchema } from "@/lib/validations/sales"

import {
  InventoryMovementType,
  NotificationType,
  Prisma,
  SaleStatus,
  UserRole,
} from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

import { convertCurrency } from "@/lib/currency/exchange"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"

import {
  decimalToNumber,
  getSearchParam,
  parseDateParam,
  toLocalDate,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "sales", "view")

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
    await requirePermission(profile, "sales", "create")
    const payload = await parseBodyWithSchema(request, saleSchema)

    const saleDate = toLocalDate(payload.sale_date)

    // Calculate totals correctly with currency conversion
    let itemsTotal = new Prisma.Decimal(0)
    for (const item of payload.items) {
      const unitPriceInSaleCurrency = await convertCurrency(
        item.unit_price,
        item.unit_price_currency,
        payload.total_currency,
        saleDate
      )
      const discountInSaleCurrency = await convertCurrency(
        item.discount,
        item.discount_currency,
        payload.total_currency,
        saleDate
      )
      itemsTotal = itemsTotal.add(
        unitPriceInSaleCurrency.mul(item.quantity).sub(discountInSaleCurrency)
      )
    }

    const discountInSaleCurrency = await convertCurrency(
      payload.discount,
      payload.discount_currency,
      payload.total_currency,
      saleDate
    )

    const netTotal = Prisma.Decimal.max(itemsTotal.sub(discountInSaleCurrency), 0)

    const amountPaidInSaleCurrency = await convertCurrency(
      payload.amount_paid,
      payload.amount_paid_currency,
      payload.total_currency,
      saleDate
    )

    const balanceDue = netTotal.sub(amountPaidInSaleCurrency)

    const status: SaleStatus =
      balanceDue.lte(0)
        ? SaleStatus.paid
        : amountPaidInSaleCurrency.gt(0)
          ? SaleStatus.partial
          : SaleStatus.pending

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerId: payload.customer_id,
          saleDate,
          channel: payload.channel,
          paymentMethod: payload.payment_method,
          totalCurrency: payload.total_currency,
          total: netTotal,
          discountCurrency: payload.discount_currency,
          discount: toPrismaDecimal(payload.discount),
          amountPaidCurrency: payload.amount_paid_currency,
          amountPaid: toPrismaDecimal(payload.amount_paid),
          changeGivenCurrency: payload.change_given_currency || payload.total_currency,
          changeGiven: balanceDue.lt(0) ? balanceDue.abs() : new Prisma.Decimal(0),
          status,
          notes: payload.notes,
          createdBy: profile.id,
          items: {
            create: payload.items.map((item) => ({
              catalogItemId: item.catalog_item_id,
              description: item.description,
              size: item.size,
              quantity: item.quantity,
              unitPriceCurrency: item.unit_price_currency,
              unitPrice: toPrismaDecimal(item.unit_price),
              discountCurrency: item.discount_currency,
              discount: toPrismaDecimal(item.discount),
            })),
          },
        },
        include: {
          items: true,
        },
      })

      const affectedFinishedGoodIds = new Set<string>()

      // Deduct Finished Good Stock if catalog_item_id is present
      for (const item of payload.items) {
        if (!item.catalog_item_id) continue

        const fgs = await tx.finishedGoodStock.findFirst({
          where: {
            catalogItemId: item.catalog_item_id,
            ...(item.size ? { size: item.size } : {}),
          },
          orderBy: { stock: "desc" },
        })

        if (fgs) {
          const newStock = fgs.stock - item.quantity
          await tx.finishedGoodStock.update({
            where: { id: fgs.id },
            data: { stock: newStock },
          })
          affectedFinishedGoodIds.add(fgs.id)

          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: fgs.id,
              movementType: InventoryMovementType.out,
              quantity: item.quantity,
              previousQuantity: fgs.stock,
              newQuantity: newStock,
              reason: `Venta: #${sale.id.slice(0, 8)}`,
              createdBy: profile.id,
            },
          })
        }
      }

      const affectedFinishedGoods = affectedFinishedGoodIds.size
        ? await tx.finishedGoodStock.findMany({
            where: {
              id: { in: Array.from(affectedFinishedGoodIds) },
            },
            select: {
              id: true,
              garmentType: true,
              size: true,
              stock: true,
              minimumStock: true,
              catalogItem: {
                select: {
                  name: true,
                },
              },
            },
          })
        : []

      const lowFinishedGoods = affectedFinishedGoods.filter(
        (item) => item.stock <= item.minimumStock
      )

      // Update customer total purchases if applicable
      if (payload.customer_id) {
        const customer = await tx.customer.findUnique({
          where: { id: payload.customer_id },
          select: { totalPurchases: true, totalPurchasesCurrency: true },
        })

        if (customer) {
          const saleTotalInCustomerCurrency = await convertCurrency(
            netTotal,
            payload.total_currency,
            customer.totalPurchasesCurrency,
            saleDate
          )

          await tx.customer.update({
            where: { id: payload.customer_id },
            data: {
              totalPurchases: customer.totalPurchases.add(saleTotalInCustomerCurrency),
            },
          })
        }
      }

      return { sale, lowFinishedGoods }
    })

    await createNotifications({
      type: NotificationType.sale_completed,
      title: "Venta registrada",
      body: `Se registró la venta #${result.sale.id.slice(0, 8)}.`,
      metadata: {
        saleId: result.sale.id,
        total: decimalToNumber(result.sale.total),
        actionUrl: `/sales/${result.sale.id}`,
        actionLabel: "Ver venta",
      },
      userIds: [profile.id],
      sendEmail: false,
    })

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0) {
      const customer = payload.customer_id
        ? await prisma.customer.findUnique({
            where: { id: payload.customer_id },
            select: {
              fullName: true,
            },
          })
        : null

      const saleTotal = decimalToNumber(result.sale.total)
      const body = [
        `Venta por $${saleTotal.toFixed(2)} registrada`,
        customer?.fullName ? `para ${customer.fullName}` : null,
        balanceDue.gt(0) ? `saldo pendiente: $${decimalToNumber(balanceDue).toFixed(2)}` : null,
      ]
        .filter(Boolean)
        .join(", ")

      await createNotifications({
        type: NotificationType.sale_completed,
        title: "Nueva venta registrada",
        body,
        metadata: {
          saleId: result.sale.id,
          total: saleTotal,
          customerId: payload.customer_id ?? null,
          actionUrl: `/sales/${result.sale.id}`,
          actionLabel: "Ver venta",
        },
        userIds: adminManagerIds,
        sendEmail: result.sale.status === SaleStatus.paid,
      })

      if (result.lowFinishedGoods.length > 0) {
        await createNotifications({
          type: NotificationType.low_stock,
          title: `${result.lowFinishedGoods.length} prenda${result.lowFinishedGoods.length > 1 ? "s" : ""} con stock bajo`,
          body: result.lowFinishedGoods
            .map(
              (item) =>
                `${item.catalogItem.name} ${item.size} (${item.stock}/${item.minimumStock})`
            )
            .join(", "),
          metadata: {
            items: result.lowFinishedGoods.map((item) => ({
              id: item.id,
              garmentType: item.garmentType,
              size: item.size,
              stock: item.stock,
              minimumStock: item.minimumStock,
            })),
            actionUrl: "/catalog",
            actionLabel: "Ver catálogo",
          },
          userIds: adminManagerIds,
          sendEmail: false,
        })
      }
    }

    return apiSuccess(result.sale, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
