import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendPayslipNotification } from "@/lib/email/send"
import { PayslipPDF } from "@/lib/pdf/payslip"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"
import { decimalToNumber } from "@/lib/api/utils"

type RouteParams = {
  id: string
}

export async function POST(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "payroll", "create")

    const { id } = await resolveRouteParams(context.params)

    const payment = await prisma.payrollPayment.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    })

    if (!payment) {
      throw new ApiRouteError("No se encontro el pago solicitado.", 404)
    }

    if (!payment.employee.email) {
      throw new ApiRouteError("El empleado no tiene correo configurado.", 422)
    }

    const pdfBuffer = await generatePDFBuffer(
      PayslipPDF({
        employee: {
          fullName: payment.employee.fullName,
        },
        payment: {
          periodStart: payment.periodStart.toISOString().slice(0, 10),
          periodEnd: payment.periodEnd.toISOString().slice(0, 10),
          baseAmount: decimalToNumber(payment.baseAmount),
          bonuses: decimalToNumber(payment.bonuses),
          deductions: decimalToNumber(payment.deductions),
          total: decimalToNumber(payment.total),
        },
        company: {
          name: "DANIELLS CONFECCIONES",
        },
      })
    )

    const sent = await sendPayslipNotification(
      payment.employee.email,
      {
        fullName: payment.employee.fullName,
        periodLabel: `${payment.periodStart.toISOString().slice(0, 10)} - ${payment.periodEnd.toISOString().slice(0, 10)}`,
        breakdown: {
          baseAmount: decimalToNumber(payment.baseAmount),
          bonuses: decimalToNumber(payment.bonuses),
          deductions: decimalToNumber(payment.deductions),
        },
        total: decimalToNumber(payment.total),
      },
      pdfBuffer
    )

    return apiSuccess({ sent })
  } catch (error) {
    return handleApiError(error)
  }
}
