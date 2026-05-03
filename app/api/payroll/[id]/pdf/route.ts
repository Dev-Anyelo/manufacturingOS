import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { PayslipPDF } from "@/lib/pdf/payslip"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import {
  ApiRouteError,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"
import { decimalToNumber } from "@/lib/api/utils"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "payroll", "view")

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

    const buffer = await generatePDFBuffer(
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

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=payroll-${id}.pdf`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
