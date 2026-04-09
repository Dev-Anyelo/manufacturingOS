import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"

export type PayrollFilters = {
  employeeId?: string
  status?: string
  dateFrom?: Date
}

export async function getPayrollPayments(filters?: PayrollFilters) {
  const where: Prisma.PayrollPaymentWhereInput = {}

  if (filters?.employeeId) {
    where.employeeId = filters.employeeId
  }

  if (filters?.status) {
    where.status = filters.status as never
  }

  if (filters?.dateFrom) {
    where.periodStart = {
      gte: filters.dateFrom,
    }
  }

  return prisma.payrollPayment.findMany({
    where,
    include: {
      employee: true,
    },
    orderBy: {
      periodStart: "desc",
    },
  })
}

export async function getPayrollPayment(id: string) {
  return prisma.payrollPayment.findUnique({
    where: { id },
    include: {
      employee: true,
      expenses: true,
    },
  })
}

export async function getEmployeeProductionForPeriod(
  employeeId: string,
  from: Date,
  to: Date
) {
  const sessions = await prisma.productionSession.findMany({
    where: {
      employeeId,
      sessionDate: {
        gte: from,
        lte: to,
      },
    },
    select: {
      totalGarments: true,
    },
  })

  return sessions.reduce((acc, session) => acc + session.totalGarments, 0)
}

export async function getPayrollSummaryByEmployee(
  dateFrom: Date,
  dateTo: Date
) {
  const payments = await prisma.payrollPayment.findMany({
    where: {
      periodStart: {
        gte: dateFrom,
      },
      periodEnd: {
        lte: dateTo,
      },
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

  const grouped = new Map<
    string,
    { employeeId: string; fullName: string; total: number }
  >()

  for (const payment of payments) {
    const row = grouped.get(payment.employeeId) ?? {
      employeeId: payment.employeeId,
      fullName: payment.employee.fullName,
      total: 0,
    }

    row.total += decimalToNumber(payment.total)
    grouped.set(payment.employeeId, row)
  }

  return [...grouped.values()]
}
