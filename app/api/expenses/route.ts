import { prisma } from "@/lib/prisma"
import { expenseSchema } from "@/lib/validations/expenses"

import {
  ExpenseCategory,
  InventoryMovementType,
  Prisma,
  UserRole,
} from "@prisma/client"

import {
  ApiRouteError,
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
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const { searchParams } = new URL(request.url)
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))
    const category = getSearchParam(searchParams, "category")

    const where: Prisma.ExpenseWhereInput = {}

    if (dateFrom || dateTo) {
      where.expenseDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    if (category) {
      where.category = category as ExpenseCategory
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expenseDate: "desc",
      },
    })

    return apiSuccess(expenses)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, expenseSchema)

    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
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
          createdBy: profile.id,
        },
      })

      if (payload.updates_inventory) {
        if (!payload.inventory_item_id || !payload.inventory_quantity_added) {
          throw new ApiRouteError(
            "Debes indicar material y cantidad para actualizar inventario.",
            422
          )
        }

        const inventoryItem = await tx.inventoryItem.findUnique({
          where: {
            id: payload.inventory_item_id,
          },
        })

        if (!inventoryItem) {
          throw new ApiRouteError(
            "No se encontro el material seleccionado.",
            404
          )
        }

        const previous = inventoryItem.quantity
        const updatedQuantity = previous.plus(payload.inventory_quantity_added)

        await tx.inventoryItem.update({
          where: {
            id: inventoryItem.id,
          },
          data: {
            quantity: updatedQuantity,
          },
        })

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            movementType: InventoryMovementType.in,
            quantity: toPrismaDecimal(payload.inventory_quantity_added),
            previousQuantity: previous,
            newQuantity: updatedQuantity,
            reason: `Compra: ${payload.concept}`,
            createdBy: profile.id,
          },
        })
      }

      return expense
    })

    return apiSuccess(created, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
