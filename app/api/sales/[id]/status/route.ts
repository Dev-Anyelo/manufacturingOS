import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { NotificationType, SaleStatus, UserRole } from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

const updateStatusSchema = z.object({
  status: z.nativeEnum(SaleStatus),
})

type RouteParams = {
  id: string
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const payload = await parseBodyWithSchema(request, updateStatusSchema)
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        status: payload.status,
      },
    })

    if (payload.status === SaleStatus.paid) {
      const adminManagerIds = await getUserIdsByRoles(["admin", "manager"])

      if (adminManagerIds.length > 0) {
        await createNotifications({
          type: NotificationType.sale_completed,
          title: "Venta completada",
          body: `La venta #${sale.id.slice(0, 8)} fue marcada como pagada.`,
          metadata: {
            saleId: sale.id,
            total: sale.total,
            actionUrl: `/sales/${sale.id}`,
            actionLabel: "Ver venta",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }
    }

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
