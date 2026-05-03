import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decimalToNumber } from "@/lib/api/utils"
import { Currency } from "@prisma/client"
import { getExchangeRate } from "@/lib/currency/exchange"

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
      createdByProfile: {
        select: {
          fullName: true,
        },
      },
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
      createdByProfile: {
        select: {
          fullName: true,
        },
      },
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

  // Fetch current rate for conversion
  let rate = 36.5
  try {
    const rateDecimal = await getExchangeRate(Currency.USD, Currency.NIO)
    rate = Number(rateDecimal)
  } catch (e) {
    console.error("Could not fetch exchange rate for payroll summary", e)
  }

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

    const amount = decimalToNumber(payment.total)
    const converted = payment.baseAmountCurrency === Currency.NIO ? amount / rate : amount
    row.total += converted
    grouped.set(payment.employeeId, row)
  }

  return [...grouped.values()]
}

export async function getPayrollFormBootstrap() {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
      contractType: true,
      baseSalary: true,
      baseSalaryCurrency: true,
    },
  })

  return {
    employees,
  }
}
