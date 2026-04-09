import { Prisma, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { payrollPaymentSchema } from "@/lib/validations/payroll"
import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"
import {
  getSearchParam,
  parseDateParam,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const { searchParams } = new URL(request.url)
    const employeeId = getSearchParam(searchParams, "employee_id")
    const status = getSearchParam(searchParams, "status")
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))

    const where: Prisma.PayrollPaymentWhereInput = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (status) {
      where.status = status as never
    }

    if (dateFrom) {
      where.periodStart = {
        gte: dateFrom,
      }
    }

    const payments = await prisma.payrollPayment.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return apiSuccess(payments)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, payrollPaymentSchema)

    const payment = await prisma.payrollPayment.create({
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
        createdBy: profile.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    return apiSuccess(payment, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
