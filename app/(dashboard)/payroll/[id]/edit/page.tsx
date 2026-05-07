import { notFound } from "next/navigation"
import { getPayrollPayment, getPayrollFormBootstrap } from "@/lib/data/payroll"
import { PageHeader } from "@/components/shared/page-header"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { Currency, PayrollStatus } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { redirect } from "next/navigation"

export default async function EditPayrollPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const [payment, bootstrap] = await Promise.all([
    getPayrollPayment(id),
    getPayrollFormBootstrap(),
  ])

  if (!payment) notFound()

  if (payment.status === PayrollStatus.paid) {
    redirect(`/payroll/${payment.id}`)
  }

  const employees = bootstrap.employees.map((emp) => ({
    id: emp.id,
    fullName: emp.fullName,
    contractType: emp.contractType,
    baseSalary: emp.baseSalary ? decimalToNumber(emp.baseSalary) : null,
  }))

  return (
    <div className="page-shell">
      <PageHeader
        title={`Editar Pago #${payment.id.slice(0, 8)}`}
        description="Actualiza la información del pago de nómina."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Nómina", href: "/payroll" },
          { label: "Detalles", href: `/payroll/${payment.id}` },
          { label: "Editar" },
        ]}
      />
      <div className="page-content">
        <PayrollForm
          employees={employees}
          paymentId={payment.id}
          defaultValues={{
            employee_id: payment.employeeId,
            period_start: payment.periodStart.toISOString().split("T")[0],
            period_end: payment.periodEnd.toISOString().split("T")[0],
            pieces_produced: payment.piecesProduced,
            hours_worked: payment.hoursWorked
              ? decimalToNumber(payment.hoursWorked)
              : null,
            base_amount: decimalToNumber(payment.baseAmount),
            base_amount_currency: payment.baseAmountCurrency as Currency,
            bonuses: decimalToNumber(payment.bonuses),
            bonuses_currency: payment.bonusesCurrency as Currency,
            deductions: decimalToNumber(payment.deductions),
            deductions_currency: payment.deductionsCurrency as Currency,
            payment_method: payment.paymentMethod as any,
            notes: payment.notes,
            receipt_url: payment.receiptUrl,
          }}
          onSuccess={() => {}}
        />
      </div>
    </div>
  )
}
