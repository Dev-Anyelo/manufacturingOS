import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function GET() {
  try {
    await requireAuth()

    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        quantity: "asc",
      },
    })

    const lowStockItems = items.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    )

    return apiSuccess(lowStockItems)
  } catch (error) {
    return handleApiError(error)
  }
}
