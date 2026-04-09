import { PayrollStatus, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { payrollPaymentSchema } from "@/lib/validations/payroll"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"
import { toPrismaDecimal } from "@/lib/api/utils"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    const payment = await prisma.payrollPayment.findUnique({
      where: { id },
      include: {
        employee: true,
        expenses: true,
      },
    })

    return apiSuccess(payment)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    const existing = await prisma.payrollPayment.findUnique({
      where: { id },
      select: {
        status: true,
      },
    })

    if (!existing) {
      throw new ApiRouteError("No se encontro el pago solicitado.", 404)
    }

    if (existing.status !== PayrollStatus.pending) {
      throw new ApiRouteError(
        "Solo se pueden editar pagos en estado pendiente.",
        422
      )
    }

    const payload = await parseBodyWithSchema(request, payrollPaymentSchema)

    const payment = await prisma.payrollPayment.update({
      where: { id },
      data: {
        employeeId: payload.employee_id,
        periodStart: payload.period_start,
        periodEnd: payload.period_end,
        piecesProduced: payload.pieces_produced,
        hoursWorked:
          payload.hours_worked === null || payload.hours_worked === undefined
            ? null
            : toPrismaDecimal(payload.hours_worked),
        baseAmount: toPrismaDecimal(payload.base_amount),
        bonuses: toPrismaDecimal(payload.bonuses),
        deductions: toPrismaDecimal(payload.deductions),
        paymentMethod: payload.payment_method ?? null,
        notes: payload.notes,
      },
    })

    return apiSuccess(payment)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    const payment = await prisma.payrollPayment.findUnique({
      where: { id },
      select: {
        status: true,
      },
    })

    if (!payment) {
      throw new ApiRouteError("No se encontro el pago solicitado.", 404)
    }

    if (payment.status !== PayrollStatus.pending) {
      throw new ApiRouteError("Solo se pueden eliminar pagos pendientes.", 422)
    }

    await prisma.payrollPayment.delete({
      where: { id },
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
