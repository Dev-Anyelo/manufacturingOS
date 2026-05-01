import { prisma } from "@/lib/prisma"
import { InventoryReportPDF } from "@/lib/pdf/inventory-report"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import { handleApiError, requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "export")

    const items = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    const buffer = await generatePDFBuffer(
      InventoryReportPDF({
        items: items.map((item) => {
          const stock = Number(item.quantity)
          const minimum = Number(item.minimumStock)

          return {
            name: item.name,
            category: item.category,
            stock,
            minimum,
            status:
              stock <= 0 ? "Critico" : stock <= minimum ? "Bajo" : "Normal",
            price: Number(item.unitPrice),
          }
        }),
        generatedAt: new Date().toISOString(),
        company: {
          name: "manufacturingOS",
        },
      })
    )

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=reporte-inventario.pdf",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
