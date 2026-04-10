import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"
import { getSearchParam, parseDateParam } from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const inventoryItemId = getSearchParam(searchParams, "inventory_item_id")
    const movementType = getSearchParam(searchParams, "movement_type")
    const from = parseDateParam(getSearchParam(searchParams, "date_from"))
    const to = parseDateParam(getSearchParam(searchParams, "date_to"))

    const where: Prisma.InventoryMovementWhereInput = {}

    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId
    }

    if (movementType) {
      where.movementType = movementType as never
    }

    if (from || to) {
      where.createdAt = {
        gte: from,
        lte: to,
      }
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiSuccess(movements)
  } catch (error) {
    return handleApiError(error)
  }
}
