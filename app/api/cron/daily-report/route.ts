import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { apiSuccess, handleApiError } from "@/lib/api/response"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendMonthlyReport } from "@/lib/email/send"
import { InventoryReportPDF } from "@/lib/pdf/inventory-report"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import { decimalToNumber } from "@/lib/api/utils"

async function getAdminEmails(adminIds: string[]) {
  const supabaseAdmin = createSupabaseAdminClient()
  const emails: string[] = []

  for (const adminId of adminIds) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(adminId)

    if (data.user?.email) {
      emails.push(data.user.email)
    }
  }

  return emails
}

export async function POST(request: Request) {
  try {
    requireCronAuth(request)

    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      sales,
      expenses,
      topCustomers,
      topMaterials,
      inventoryItems,
      admins,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: today,
          },
        },
        select: {
          total: true,
          discount: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: today,
          },
        },
        select: {
          total: true,
        },
      }),
      prisma.customer.findMany({
        orderBy: {
          totalPurchases: "desc",
        },
        take: 5,
        select: {
          fullName: true,
          totalPurchases: true,
        },
      }),
      prisma.inventoryMovement.findMany({
        where: {
          movementType: "out",
          createdAt: {
            gte: monthStart,
            lte: today,
          },
        },
        orderBy: {
          quantity: "asc",
        },
        take: 5,
        include: {
          inventoryItem: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          isActive: true,
        },
      }),
      prisma.profile.findMany({
        where: {
          role: UserRole.admin,
          isActive: true,
        },
        select: {
          id: true,
        },
      }),
    ])

    const totalSales = sales.reduce(
      (acc, row) =>
        acc + decimalToNumber(row.total) - decimalToNumber(row.discount),
      0
    )
    const totalExpenses = expenses.reduce(
      (acc, row) => acc + decimalToNumber(row.total),
      0
    )

    const pdfBuffer = await generatePDFBuffer(
      InventoryReportPDF({
        items: inventoryItems.map((item) => {
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
        generatedAt: today.toISOString(),
        company: {
          name: "DANIELLS CONFECCIONES",
        },
      })
    )

    const adminIds = admins.map((admin) => admin.id)
    const adminEmails = await getAdminEmails(adminIds)

    for (const email of adminEmails) {
      await sendMonthlyReport(
        email,
        {
          totalSales,
          totalExpenses,
          grossProfit: totalSales - totalExpenses,
          topCustomers: topCustomers.map((item) => ({
            name: item.fullName,
            amount: decimalToNumber(item.totalPurchases),
          })),
          topMaterials: topMaterials.map((item) => ({
            name: item.inventoryItem.name,
            quantity: Math.abs(decimalToNumber(item.quantity)),
          })),
        },
        pdfBuffer
      )
    }

    return apiSuccess({
      sent_to: adminEmails.length,
      total_sales: totalSales,
      total_expenses: totalExpenses,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
