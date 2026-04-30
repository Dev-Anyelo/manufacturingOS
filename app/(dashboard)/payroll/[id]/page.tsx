import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getPayrollPayment } from "@/lib/data/payroll"
import { PageHeader } from "@/components/shared/page-header"
import { PayslipPreview } from "@/components/modules/payroll/payslip-preview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PayrollDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function PayrollDetailPage({
  params,
}: PayrollDetailPageProps) {
  const { id } = await params
  const payment = await getPayrollPayment(id)

  if (!payment) {
    notFound()
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={`Pago #${payment.id.slice(0, 8)}`}
        description="Detalle de planilla y comprobante asociado."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Planilla", href: "/payroll" },
          { label: `Pago #${payment.id.slice(0, 8)}` },
        ]}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="min-h-10 sm:min-h-9"
          >
            <Link href="/payroll">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-6">
        <PayslipPreview
          payment={{
            id: payment.id,
            employeeName: payment.employee.fullName,
            periodStart: payment.periodStart.toISOString(),
            periodEnd: payment.periodEnd.toISOString(),
            status: payment.status,
            paymentDate: payment.paymentDate?.toISOString() ?? null,
            paymentMethod: payment.paymentMethod,
            baseAmount: decimalToNumber(payment.baseAmount),
            bonuses: decimalToNumber(payment.bonuses),
            deductions: decimalToNumber(payment.deductions),
            total: decimalToNumber(payment.total),
            notes: payment.notes,
          }}
        />

        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle>Gastos asociados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payment.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay gastos vinculados a este pago.
              </p>
            ) : (
              payment.expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{expense.concept}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expenseDate).toLocaleDateString(
                        "es-PA"
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    ${decimalToNumber(expense.total).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
