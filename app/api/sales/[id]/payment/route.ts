import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api/require-permission"

import {
  NotificationType,
  SaleStatus,
  UserRole,
  PaymentMethod,
} from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  resolveRouteParams,
  ApiRouteError,
} from "@/lib/api/response"

const registerPaymentSchema = z.object({
  amount_paid: z.number().min(0, "El monto debe ser mayor o igual a 0"),
  payment_method: z.nativeEnum(PaymentMethod, {
    message: "Método de pago no válido",
  }),
  notes: z.string().optional().nullable(),
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
    await requirePermission(profile, "sales", "edit")

    const payload = await parseBodyWithSchema(request, registerPaymentSchema)
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.findUnique({
      where: { id },
    })

    if (!sale) {
      throw new ApiRouteError("Venta no encontrada", 404)
    }

    if (sale.status === SaleStatus.paid) {
      throw new ApiRouteError("La venta ya se encuentra totalmente pagada", 400)
    }

    const currentAmountPaid = Number(sale.amountPaid)
    const newAmountPaid = currentAmountPaid + payload.amount_paid
    const netTotal = Number(sale.total) - Number(sale.discount)

    // Si paga de más, registramos el vuelto y topeamos amountPaid a netTotal
    let changeGiven = Number(sale.changeGiven)
    let finalAmountPaid = newAmountPaid

    if (newAmountPaid > netTotal) {
      changeGiven += newAmountPaid - netTotal
      finalAmountPaid = netTotal
    }

    const balanceDue = Math.max(0, netTotal - finalAmountPaid)
    const newStatus = balanceDue <= 0 ? SaleStatus.paid : SaleStatus.partial

    const notesParts = [sale.notes, payload.notes].filter(Boolean)
    const notes = notesParts.length > 0 ? notesParts.join("\n---\n") : null

    // Update sale using raw SQL to avoid issues with generated balance_due column
    // Prisma sometimes tries to include it in the SET clause even if omitted from data
    await prisma.$executeRaw`
      UPDATE public.sales 
      SET amount_paid = ${finalAmountPaid},
          change_given = ${changeGiven},
          status = CAST(${newStatus} AS public.sale_status),
          payment_method = CAST(${payload.payment_method} AS public.payment_method),
          notes = ${notes}
      WHERE id = CAST(${id} AS uuid)
    `

    const updatedSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!updatedSale) {
      throw new ApiRouteError("Error al recuperar la venta actualizada", 500)
    }

    if (newStatus === SaleStatus.paid) {
      const adminManagerIds = await getUserIdsByRoles([
        UserRole.admin,
        UserRole.manager,
      ])

      if (adminManagerIds.length > 0) {
        await createNotifications({
          type: NotificationType.sale_completed,
          title: "Venta completada",
          body: `La venta #${sale.id.slice(0, 8)} fue marcada como pagada.`,
          metadata: {
            saleId: sale.id,
            total: Number(updatedSale.total),
            actionUrl: `/sales/${sale.id}`,
            actionLabel: "Ver venta",
          },
          userIds: adminManagerIds,
          sendEmail: true,
        })
      }
    }

    return apiSuccess(updatedSale)
  } catch (error) {
    return handleApiError(error)
  }
}
