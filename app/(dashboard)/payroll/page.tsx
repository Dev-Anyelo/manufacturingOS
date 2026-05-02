import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { PayrollWorkspace } from "@/components/modules/payroll/payroll-workspace"

import {
  getPayrollFormBootstrap,
  getPayrollPayments,
  getPayrollSummaryByEmployee,
} from "@/lib/data/payroll"

import { requireCurrentUser } from "@/lib/auth/current-user"

export default async function PayrollPage() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const now = new Date()

  const [payments, summary, bootstrap, currentUser] = await Promise.all([
    getPayrollPayments(),
    getPayrollSummaryByEmployee(startOfMonth, now),
    getPayrollFormBootstrap(),
    requireCurrentUser(),
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
          canDelete={currentUser.role === "admin" || currentUser.role === "manager"}
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
