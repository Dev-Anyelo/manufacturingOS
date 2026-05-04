import { prisma } from "@/lib/prisma"
import { PayrollStatus, Prisma } from "@prisma/client"
import { requirePermission } from "@/lib/api/require-permission"
import { toLocalDate, toPrismaDecimal } from "@/lib/api/utils"
import { payrollPaymentSchema } from "@/lib/validations/payroll"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

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
    await requirePermission(profile, "payroll", "edit")

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
        periodStart: toLocalDate(payload.period_start),
        periodEnd: toLocalDate(payload.period_end),
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
        receiptUrl: payload.receipt_url,
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
    await requirePermission(profile, "payroll", "delete")

    const { id } = await resolveRouteParams(context.params)

    const payment = await prisma.payrollPayment.findUnique({
      where: { id },
      include: { expenses: true },
    })

    if (!payment) {
      throw new ApiRouteError("No se encontró el pago solicitado.", 404)
    }

    if (payment.status !== PayrollStatus.pending) {
      throw new ApiRouteError("Solo se pueden eliminar pagos pendientes.", 422)
    }

    await prisma.$transaction(async (tx) => {
      // Log deletion
      await tx.auditLog.create({
        data: {
          tableName: "payroll_payments",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(payment)),
          createdBy: profile.id,
        },
      })

      // If there are expenses linked, we need to handle them (schema says SetNull)
      await tx.payrollPayment.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return handleApiError(
        new Error(
          "No se puede eliminar este registro porque tiene otros registros asociados."
        )
      )
    }
    return handleApiError(error)
  }
}
