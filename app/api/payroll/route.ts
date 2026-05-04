import { Prisma, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { payrollPaymentSchema } from "@/lib/validations/payroll"
import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

import { requirePermission } from "@/lib/api/require-permission"
import { convertCurrency } from "@/lib/currency/exchange"
import {
  getSearchParam,
  parseDateParam,
  toLocalDate,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "payroll", "view")

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
    await requirePermission(profile, "payroll", "create")

    const payload = await parseBodyWithSchema(request, payrollPaymentSchema)

    const baseAmount = new Prisma.Decimal(payload.base_amount)
    const bonuses = new Prisma.Decimal(payload.bonuses)
    const deductions = new Prisma.Decimal(payload.deductions)
    const periodStart = toLocalDate(payload.period_start)

    // Normalize everything to baseAmountCurrency for the total
    const normalizedBonuses = await convertCurrency(
      bonuses,
      payload.bonuses_currency,
      payload.base_amount_currency,
      periodStart
    )
    const normalizedDeductions = await convertCurrency(
      deductions,
      payload.deductions_currency,
      payload.base_amount_currency,
      periodStart
    )

    const total = baseAmount.add(normalizedBonuses).sub(normalizedDeductions)

    const payment = await prisma.payrollPayment.create({
      data: {
        employeeId: payload.employee_id,
        periodStart,
        periodEnd: toLocalDate(payload.period_end),
        piecesProduced: payload.pieces_produced,
        hoursWorked:
          payload.hours_worked === null || payload.hours_worked === undefined
            ? null
            : toPrismaDecimal(payload.hours_worked),
        baseAmountCurrency: payload.base_amount_currency,
        baseAmount: toPrismaDecimal(payload.base_amount),
        bonusesCurrency: payload.bonuses_currency,
        bonuses: toPrismaDecimal(payload.bonuses),
        deductionsCurrency: payload.deductions_currency,
        deductions: toPrismaDecimal(payload.deductions),
        total: total,
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
