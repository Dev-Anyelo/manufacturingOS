import { prisma } from "@/lib/prisma"
import { toLocalDate, toPrismaDecimal } from "@/lib/api/utils"
import { requirePermission } from "@/lib/api/require-permission"
import { expenseSchema } from "@/lib/validations/expenses"
import { InventoryMovementType } from "@prisma/client"

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

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      throw new ApiRouteError("Gasto no encontrado", 404)
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Revert old inventory if it was updated
      if (expense.updatesInventory && expense.inventoryItemId && expense.inventoryQuantityAdded) {
        const oldItem = await tx.inventoryItem.findUnique({ where: { id: expense.inventoryItemId } })
        if (oldItem) {
          const revertedQuantity = oldItem.quantity.sub(expense.inventoryQuantityAdded)
          await tx.inventoryItem.update({
            where: { id: oldItem.id },
            data: { quantity: revertedQuantity },
          })
          await tx.inventoryMovement.create({
            data: {
              inventoryItemId: oldItem.id,
              movementType: InventoryMovementType.out,
              quantity: expense.inventoryQuantityAdded,
              previousQuantity: oldItem.quantity,
              newQuantity: revertedQuantity,
              reason: `Reversión por edición de gasto: ${expense.concept}`,
              createdBy: profile.id,
            },
          })
        }
      }

      // 2. Apply new inventory if requested
      if (payload.updates_inventory) {
        if (!payload.inventory_item_id || !payload.inventory_quantity_added) {
          throw new ApiRouteError("Debes indicar material y cantidad para actualizar inventario.", 422)
        }

        const newItem = await tx.inventoryItem.findUnique({
          where: { id: payload.inventory_item_id },
        })

        if (!newItem) {
          throw new ApiRouteError("No se encontro el material seleccionado.", 404)
        }

        const addedQuantity = toPrismaDecimal(payload.inventory_quantity_added)
        const updatedQuantity = newItem.quantity.add(addedQuantity)

        await tx.inventoryItem.update({
          where: { id: newItem.id },
          data: { quantity: updatedQuantity },
        })

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: newItem.id,
            movementType: InventoryMovementType.in,
            quantity: addedQuantity,
            previousQuantity: newItem.quantity,
            newQuantity: updatedQuantity,
            reason: `Edición de compra: ${payload.concept}`,
            createdBy: profile.id,
          },
        })
      }

      return tx.expense.update({
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
          updatesInventory: payload.updates_inventory,
          inventoryItemId: payload.inventory_item_id,
          inventoryQuantityAdded:
            payload.inventory_quantity_added !== null && payload.inventory_quantity_added !== undefined
              ? toPrismaDecimal(payload.inventory_quantity_added)
              : null,
          notes: payload.notes,
          receiptUrl: payload.receipt_url,
        },
      })
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
