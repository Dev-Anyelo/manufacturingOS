import { NotificationType, PayrollStatus, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { sendPayslipNotification } from "@/lib/email/send"
import { PayslipPDF } from "@/lib/pdf/payslip"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import { uploadPayrollReceiptBuffer } from "@/lib/storage/upload"
import { payrollMarkPaidSchema } from "@/lib/validations/payroll"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"
import { decimalToNumber } from "@/lib/api/utils"

type RouteParams = {
  id: string
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, payrollMarkPaidSchema)

    const payment = await prisma.payrollPayment.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    })

    if (!payment) {
      throw new ApiRouteError("No se encontro el pago solicitado.", 404)
    }

    if (payment.status !== PayrollStatus.pending) {
      throw new ApiRouteError("El pago ya fue procesado previamente.", 422)
    }

    const updated = await prisma.payrollPayment.update({
      where: { id },
      data: {
        status: PayrollStatus.paid,
        paymentDate: payload.payment_date,
        paymentMethod: payload.payment_method,
        notes: payload.notes,
      },
      include: {
        employee: true,
      },
    })

    const pdfBuffer = await generatePDFBuffer(
      PayslipPDF({
        employee: {
          fullName: updated.employee.fullName,
        },
        payment: {
          periodStart: updated.periodStart.toISOString().slice(0, 10),
          periodEnd: updated.periodEnd.toISOString().slice(0, 10),
          baseAmount: decimalToNumber(updated.baseAmount),
          bonuses: decimalToNumber(updated.bonuses),
          deductions: decimalToNumber(updated.deductions),
          total: decimalToNumber(updated.total),
        },
        company: {
          name: "manufacturingOS",
        },
      })
    )

    const receiptPath = await uploadPayrollReceiptBuffer(pdfBuffer, updated.id)

    await prisma.payrollPayment.update({
      where: { id: updated.id },
      data: {
        receiptUrl: receiptPath,
      },
    })

    if (updated.employee.email) {
      await sendPayslipNotification(
        updated.employee.email,
        {
          fullName: updated.employee.fullName,
          periodLabel: `${updated.periodStart.toISOString().slice(0, 10)} - ${updated.periodEnd.toISOString().slice(0, 10)}`,
          breakdown: {
            baseAmount: decimalToNumber(updated.baseAmount),
            bonuses: decimalToNumber(updated.bonuses),
            deductions: decimalToNumber(updated.deductions),
          },
          total: decimalToNumber(updated.total),
        },
        pdfBuffer
      )
    }

    await prisma.notification.create({
      data: {
        userId: profile.id,
        type: NotificationType.production_saved,
        title: "Pago de planilla procesado",
        body: `El pago ${updated.id} fue marcado como pagado.`,
        metadata: {
          payroll_payment_id: updated.id,
        },
      },
    })

    return apiSuccess({
      ...updated,
      receipt_url: receiptPath,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
