import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { saleSchema } from "@/lib/validations/sales"
import { convertCurrency } from "@/lib/currency/exchange"
import { toLocalDate, toPrismaDecimal } from "@/lib/api/utils"
import { requirePermission } from "@/lib/api/require-permission"
import { SaleStatus, InventoryMovementType, Prisma } from "@prisma/client"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
  parseBodyWithSchema,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!sale) {
      return apiSuccess(null)
    }

    if (profile.role === UserRole.employee && sale.createdBy !== profile.id) {
      return apiSuccess(null)
    }

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "sales", "edit")
    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, saleSchema)

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!sale) {
      throw new ApiRouteError("Venta no encontrada", 404)
    }

    const saleDate = toLocalDate(payload.sale_date)

    // Re-calculate totals
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

    const netTotal = Prisma.Decimal.max(
      itemsTotal.sub(discountInSaleCurrency),
      0
    )

    const amountPaidInSaleCurrency = await convertCurrency(
      payload.amount_paid,
      payload.amount_paid_currency,
      payload.total_currency,
      saleDate
    )

    const balanceDue = netTotal.sub(amountPaidInSaleCurrency)

    const status: SaleStatus = balanceDue.lte(0)
      ? SaleStatus.paid
      : amountPaidInSaleCurrency.gt(0)
        ? SaleStatus.partial
        : SaleStatus.pending

    const updatedSale = await prisma.$transaction(async (tx) => {
      // 1. Revert old items logic (Add back stock to FinishedGoodStock)
      for (const oldItem of sale.items) {
        if (!oldItem.finishedGoodStockId) continue

        const fgs = await tx.finishedGoodStock.findUnique({
          where: { id: oldItem.finishedGoodStockId },
        })

        if (fgs) {
          const newStock = fgs.stock + oldItem.quantity
          await tx.finishedGoodStock.update({
            where: { id: fgs.id },
            data: { stock: newStock },
          })

          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: fgs.id,
              movementType: InventoryMovementType.in,
              quantity: oldItem.quantity,
              previousQuantity: fgs.stock,
              newQuantity: newStock,
              reason: `Edición de venta: Devolución #${sale.id.slice(0, 8)}`,
              createdBy: profile.id,
            },
          })
        }
      }

      // 2. Delete old items
      await tx.saleItem.deleteMany({
        where: { saleId: sale.id },
      })

      // 3. Update sale header
      const updated = await tx.sale.update({
        where: { id: sale.id },
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
          changeGivenCurrency:
            payload.change_given_currency || payload.total_currency,
          changeGiven: balanceDue.lt(0)
            ? balanceDue.abs()
            : new Prisma.Decimal(0),
          balanceDue: Prisma.Decimal.max(balanceDue, 0),
          status,
          notes: payload.notes,
        },
      })

      // 4. Create new items and deduct stock
      for (const item of payload.items) {
        const normalizedColor = item.color?.trim() || null
        let resolvedFinishedGoodStockId: string | null = null

        let fgs =
          item.finished_good_stock_id && !resolvedFinishedGoodStockId
            ? await tx.finishedGoodStock.findUnique({
                where: { id: item.finished_good_stock_id },
                include: {
                  catalogItem: {
                    select: { name: true },
                  },
                },
              })
            : null

        if (!fgs && item.catalog_item_id) {
          fgs = await tx.finishedGoodStock.findFirst({
            where: {
              catalogItemId: item.catalog_item_id,
              ...(item.size ? { size: item.size } : {}),
              color: normalizedColor,
            },
            orderBy: { stock: "desc" },
            include: {
              catalogItem: {
                select: { name: true },
              },
            },
          })
        }

        if (fgs) {
          const newStock = fgs.stock - item.quantity
          if (newStock < 0) {
            throw new ApiRouteError(
              `No hay stock suficiente para ${fgs.catalogItem?.name ?? item.description}.`,
              422
            )
          }

          await tx.finishedGoodStock.update({
            where: { id: fgs.id },
            data: { stock: newStock },
          })
          resolvedFinishedGoodStockId = fgs.id

          await tx.catalogMovement.create({
            data: {
              finishedGoodStockId: fgs.id,
              movementType: InventoryMovementType.out,
              quantity: item.quantity,
              previousQuantity: fgs.stock,
              newQuantity: newStock,
              reason: `Edición de venta: Descuento #${sale.id.slice(0, 8)}`,
              createdBy: profile.id,
            },
          })
        }

        const itemSubtotal = new Prisma.Decimal(item.unit_price)
          .mul(item.quantity)
          .sub(item.discount)

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            catalogItemId: item.catalog_item_id,
            finishedGoodStockId: resolvedFinishedGoodStockId,
            description: item.description,
            size: item.size,
            quantity: item.quantity,
            unitPriceCurrency: item.unit_price_currency,
            unitPrice: toPrismaDecimal(item.unit_price),
            discountCurrency: item.discount_currency,
            discount: toPrismaDecimal(item.discount),
            subtotal: itemSubtotal,
          },
        })
      }

      return updated
    })

    return apiSuccess(updatedSale)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "sales", "delete")

    if (profile.role !== UserRole.admin && profile.role !== UserRole.manager) {
      throw new ApiRouteError("No tienes permisos para eliminar ventas.", 403)
    }

    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!sale) {
      throw new ApiRouteError("Venta no encontrada", 404)
    }

    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          tableName: "sales",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(sale)),
          createdBy: profile.id,
        },
      })

      // Perform deletion (items will be deleted via Cascade as per schema)
      await tx.sale.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
