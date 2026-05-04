import { prisma } from "@/lib/prisma"
import { uploadReceipt } from "@/lib/storage/upload"
import { requirePermission } from "@/lib/api/require-permission"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

/**
 * POST /api/payroll/[id]/receipt
 * Adjunta un comprobante de pago manual (PDF/Imagen) a un pago de planilla.
 */
export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "payroll", "edit")

    const { id } = await resolveRouteParams(context.params)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ApiRouteError("Debes adjuntar un archivo valido.", 422)
    }

    // Usar la utilidad estandarizada
    const receiptUrl = await uploadReceipt(file, "payroll", id)

    // Actualizar la base de datos
    const payment = await prisma.payrollPayment.update({
      where: { id },
      data: {
        receiptUrl,
      },
    })

    return apiSuccess({
      success: true,
      url: receiptUrl,
      paymentId: payment.id,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
