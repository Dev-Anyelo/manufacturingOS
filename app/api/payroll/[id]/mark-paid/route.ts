import { prisma } from "@/lib/prisma"
import { PayslipPDF } from "@/lib/pdf/payslip"
import { decimalToNumber } from "@/lib/api/utils"
import { generatePDFBuffer } from "@/lib/pdf/utils"
import { sendPayslipNotification } from "@/lib/email/send"
import { uploadPayrollReceiptBuffer } from "@/lib/storage/upload"
import { payrollMarkPaidSchema } from "@/lib/validations/payroll"
import { NotificationType, PayrollStatus, UserRole } from "@prisma/client"

import {
  createNotifications,
  getUserIdsByRoles,
} from "@/lib/services/notifications"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

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

    const adminManagerIds = await getUserIdsByRoles([
      UserRole.admin,
      UserRole.manager,
    ])

    if (adminManagerIds.length > 0) {
      await createNotifications({
        type: NotificationType.payment_due,
        title: "Planilla pagada",
        body: `Se registró el pago de ${decimalToNumber(updated.total)} para ${updated.employee.fullName}.`,
        metadata: {
          payrollPaymentId: updated.id,
          employeeId: updated.employee.id,
          actionUrl: `/payroll/${updated.id}`,
          actionLabel: "Ver planilla",
        },
        userIds: adminManagerIds,
        sendEmail: false,
      })
    }

    if (updated.employee.profileId) {
      await createNotifications({
        type: NotificationType.payment_due,
        title: "Recibiste tu pago de planilla",
        body: `Tu pago de ${decimalToNumber(updated.total)} fue registrado correctamente.`,
        metadata: {
          payrollPaymentId: updated.id,
          actionUrl: `/payroll/${updated.id}`,
          actionLabel: "Ver detalle",
        },
        userIds: [updated.employee.profileId],
        sendEmail: false,
      })
    }

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

    await createNotifications({
      type: NotificationType.payment_due,
      title: "Pago de planilla procesado",
      body: `El pago ${updated.id.slice(0, 8)} fue marcado como pagado.`,
      metadata: {
        payrollPaymentId: updated.id,
        actionUrl: `/payroll/${updated.id}`,
        actionLabel: "Ver planilla",
      },
      userIds: [profile.id],
      sendEmail: false,
    })

    return apiSuccess({
      ...updated,
      receipt_url: receiptPath,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
