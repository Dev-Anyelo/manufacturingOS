import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { toPrismaDecimal } from "@/lib/api/utils"
import { expenseSchema } from "@/lib/validations/expenses"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
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
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const { id } = await resolveRouteParams(context.params)

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        inventoryItem: true,
        payrollPayment: true,
      },
    })

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
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, expenseSchema)
    const { id } = await resolveRouteParams(context.params)

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: payload.expense_date,
        category: payload.category,
        concept: payload.concept,
        supplier: payload.supplier,
        quantity:
          payload.quantity === undefined || payload.quantity === null
            ? null
            : toPrismaDecimal(payload.quantity),
        unitPrice:
          payload.unit_price === undefined || payload.unit_price === null
            ? null
            : toPrismaDecimal(payload.unit_price),
        total: toPrismaDecimal(payload.total),
        updatesInventory: payload.updates_inventory,
        inventoryItemId: payload.inventory_item_id,
        inventoryQuantityAdded:
          payload.inventory_quantity_added === undefined ||
          payload.inventory_quantity_added === null
            ? null
            : toPrismaDecimal(payload.inventory_quantity_added),
        receiptUrl: payload.receipt_url,
        notes: payload.notes,
      },
    })

    return apiSuccess(expense)
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
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    await prisma.expense.delete({
      where: { id },
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
