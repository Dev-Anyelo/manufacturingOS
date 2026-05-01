import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "view")

    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    const report = items.map((item) => {
      const quantity = Number(item.quantity)
      const minimum = Number(item.minimumStock)

      const status =
        quantity <= 0 ? "critico" : quantity <= minimum ? "bajo" : "normal"

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity,
        minimum_stock: minimum,
        unit_price: Number(item.unitPrice),
        status,
      }
    })

    return apiSuccess(report)
  } catch (error) {
    return handleApiError(error)
  }
}
