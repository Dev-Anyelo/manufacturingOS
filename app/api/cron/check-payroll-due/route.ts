import { prisma } from "@/lib/prisma"
import { requireCronAuth } from "@/lib/api/cron"
import { NotificationType, UserRole } from "@prisma/client"
import { apiSuccess, handleApiError } from "@/lib/api/response"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

function getDaysUntilPayrollDay(today: Date, payrollDay: number) {
  const thisMonthTarget = new Date(
    today.getFullYear(),
    today.getMonth(),
    payrollDay
  )

  if (thisMonthTarget >= today) {
    return Math.ceil(
      (thisMonthTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  const nextMonthTarget = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    payrollDay
  )

  return Math.ceil(
    (nextMonthTarget.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
}

export async function POST(request: Request) {
  try {
    requireCronAuth(request)

    const settings = await prisma.systemSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    })

    const payrollDay = settings?.payrollDay ?? 30
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysUntilPayroll = getDaysUntilPayrollDay(today, payrollDay)

    if (daysUntilPayroll !== 3) {
      return apiSuccess({
        notified: false,
        days_until_payroll: daysUntilPayroll,
      })
    }

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0) {
      await createNotifications({
        type: NotificationType.payment_due,
        title: "Planilla proxima a vencer",
        body: "Faltan 3 dias para la fecha configurada de pago de planilla.",
        metadata: {
          payrollDay,
          actionUrl: "/payroll",
          actionLabel: "Ver planilla",
        },
        userIds: adminManagerIds,
        sendEmail: true,
      })
    }

    return apiSuccess({
      notified: adminManagerIds.length,
      days_until_payroll: daysUntilPayroll,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
