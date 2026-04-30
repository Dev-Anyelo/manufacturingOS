import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import {
  getPayrollFormBootstrap,
  getPayrollPayments,
  getPayrollSummaryByEmployee,
} from "@/lib/data/payroll"
import { PayrollWorkspace } from "@/components/modules/payroll/payroll-workspace"

export default async function PayrollPage() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const now = new Date()

  const [payments, summary, bootstrap] = await Promise.all([
    getPayrollPayments(),
    getPayrollSummaryByEmployee(startOfMonth, now),
    getPayrollFormBootstrap(),
  ])

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Planilla"
          description="Administra empleados, contratos y pagos."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Planilla" },
          ]}
        />

        <PayrollWorkspace
          payments={payments.map((payment) => ({
            id: payment.id,
            employeeId: payment.employeeId,
            employeeName: payment.employee.fullName,
            periodStart: payment.periodStart.toISOString(),
            periodEnd: payment.periodEnd.toISOString(),
            total: decimalToNumber(payment.total),
            status: payment.status,
            paymentDate: payment.paymentDate?.toISOString() ?? null,
            paymentMethod: payment.paymentMethod,
            createdByName: payment.createdByProfile?.fullName ?? "Sistema",
          }))}
          employeeSummary={summary.map((row) => ({
            employeeId: row.employeeId,
            employeeName: row.fullName,
            total: row.total,
          }))}
          employees={bootstrap.employees.map((employee) => ({
            id: employee.id,
            fullName: employee.fullName,
            contractType: employee.contractType,
            baseSalary:
              employee.baseSalary === null
                ? null
                : decimalToNumber(employee.baseSalary),
          }))}
        />
      </div>
    </section>
  )
}
