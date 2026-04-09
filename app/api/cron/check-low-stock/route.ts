import { NotificationType, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { apiSuccess, handleApiError } from "@/lib/api/response"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendLowStockAlert } from "@/lib/email/send"

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

    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        quantity: "asc",
      },
    })

    const criticalItems = lowStockItems.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    )

    if (criticalItems.length === 0) {
      return apiSuccess({
        critical_items: 0,
        notifications_created: 0,
      })
    }

    const admins = await prisma.profile.findMany({
      where: {
        role: UserRole.admin,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    const notifications = criticalItems.flatMap((item) =>
      admins.map((admin) => ({
        userId: admin.id,
        type:
          Number(item.quantity) === 0
            ? NotificationType.out_of_stock
            : NotificationType.low_stock,
        title:
          Number(item.quantity) === 0 ? "Material agotado" : "Stock critico",
        body:
          Number(item.quantity) === 0
            ? `El material ${item.name} se ha agotado.`
            : `El material ${item.name} esta por debajo del minimo.`,
        metadata: {
          inventory_item_id: item.id,
          quantity: Number(item.quantity),
          minimum_stock: Number(item.minimumStock),
        },
      }))
    )

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      })
    }

    const adminEmails = await getAdminEmails(admins.map((admin) => admin.id))

    for (const email of adminEmails) {
      await sendLowStockAlert(email, {
        items: criticalItems.map((item) => ({
          name: item.name,
          currentQuantity: Number(item.quantity),
          minimumStock: Number(item.minimumStock),
          supplier: item.supplier,
        })),
      })
    }

    return apiSuccess({
      critical_items: criticalItems.length,
      notifications_created: notifications.length,
      emails_sent: adminEmails.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
