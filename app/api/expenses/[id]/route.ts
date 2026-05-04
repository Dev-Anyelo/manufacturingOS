import { prisma } from "@/lib/prisma"
import { toLocalDate, toPrismaDecimal } from "@/lib/api/utils"
import { requirePermission } from "@/lib/api/require-permission"
import { expenseSchema } from "@/lib/validations/expenses"

import {
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
  ApiRouteError,
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
    await requirePermission(profile, "expenses", "view")

    const { id } = await resolveRouteParams(context.params)

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
    })

    if (!expense) {
      throw new ApiRouteError("Gasto no encontrado", 404)
    }

    return apiSuccess(expense)
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
    await requirePermission(profile, "expenses", "edit")

    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, expenseSchema)

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: toLocalDate(payload.expense_date),
        category: payload.category,
        concept: payload.concept,
        supplier: payload.supplier,
        quantity:
          payload.quantity !== null && payload.quantity !== undefined
            ? toPrismaDecimal(payload.quantity)
            : null,
        unitPrice:
          payload.unit_price !== null && payload.unit_price !== undefined
            ? toPrismaDecimal(payload.unit_price)
            : null,
        unitPriceCurrency: payload.unit_price_currency,
        total: toPrismaDecimal(payload.total),
        totalCurrency: payload.total_currency,
        notes: payload.notes,
        receiptUrl: payload.receipt_url,
      },
    })

    return apiSuccess(updated)
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
    await requirePermission(profile, "expenses", "delete")

    const { id } = await resolveRouteParams(context.params)

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      throw new ApiRouteError("Gasto no encontrado", 404)
    }

    await prisma.$transaction(async (tx) => {
      // Log deletion
      await tx.auditLog.create({
        data: {
          tableName: "expenses",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(expense)),
          createdBy: profile.id,
        },
      })

      await tx.expense.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
