import * as XLSX from "xlsx"

import { prisma } from "@/lib/prisma"
import { handleApiError, requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "reports", "export")

    const [sales, orders, expenses, inventory] = await Promise.all([
      prisma.sale.findMany({
        include: {
          customer: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.workOrder.findMany({
        include: {
          customer: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.expense.findMany(),
      prisma.inventoryItem.findMany({
        where: {
          isActive: true,
        },
      }),
    ])

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        sales.map((sale) => ({
          id: sale.id,
          fecha: sale.saleDate.toISOString().slice(0, 10),
          cliente: sale.customer?.fullName ?? "Consumidor final",
          estado: sale.status,
          total: Number(sale.total),
          descuento: Number(sale.discount),
          pagado: Number(sale.amountPaid),
        }))
      ),
      "Ventas"
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        orders.map((order) => ({
          id: order.id,
          cliente: order.customer.fullName,
          estado: order.status,
          recepcion: order.receivedDate.toISOString().slice(0, 10),
          entrega: order.deliveryDate.toISOString().slice(0, 10),
          total: Number(order.total),
        }))
      ),
      "Pedidos"
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        expenses.map((expense) => ({
          id: expense.id,
          fecha: expense.expenseDate.toISOString().slice(0, 10),
          categoria: expense.category,
          concepto: expense.concept,
          total: Number(expense.total),
        }))
      ),
      "Gastos"
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        inventory.map((item) => ({
          id: item.id,
          nombre: item.name,
          categoria: item.category,
          stock: Number(item.quantity),
          minimo: Number(item.minimumStock),
          precio: Number(item.unitPrice),
        }))
      ),
      "Inventario"
    )

    const fileBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    })

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=reporte-daniels-confecciones.xlsx",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
