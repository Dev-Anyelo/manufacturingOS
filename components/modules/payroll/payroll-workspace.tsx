"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PlusIcon, UsersRoundIcon, WalletCardsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PayrollTable,
  type PayrollTableRow,
} from "@/components/modules/payroll/payroll-table"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { MarkPaidDialog } from "@/components/modules/payroll/mark-paid-dialog"
import { CurrencyDisplay } from "@/components/shared/currency-display"

type EmployeeSummaryRow = {
  employeeId: string
  employeeName: string
  total: number
}

type EmployeeOption = {
  id: string
  fullName: string
  contractType: "fixed_salary" | "per_piece" | "hourly"
  baseSalary: number | null
}

interface PayrollWorkspaceProps {
  payments: PayrollTableRow[]
  employeeSummary: EmployeeSummaryRow[]
  employees: EmployeeOption[]
}

export function PayrollWorkspace({
  payments,
  employeeSummary,
  employees,
}: PayrollWorkspaceProps) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [markPaidOpen, setMarkPaidOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] =
    React.useState<PayrollTableRow | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const pendingCount = payments.filter(
    (payment) => payment.status === "pending"
  ).length
  const paidCount = payments.filter(
    (payment) => payment.status === "paid"
  ).length

  async function handleSendEmail(id: string) {
    setBusyId(id)

    try {
      const response = await fetch(`/api/payroll/${id}/send-email`, {
        method: "POST",
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo enviar el comprobante.")
      }

      toast.success("Comprobante enviado por correo.")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar el comprobante por correo."
      toast.error(message)
    } finally {
      setBusyId(null)
    }
  }

  function handleRefresh() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-xl font-semibold">
              <WalletCardsIcon className="size-5 text-brand" />
              {pendingCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Pagados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-xl font-semibold">
              <WalletCardsIcon className="text-success size-5" />
              {paidCount}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Empleados impactados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-xl font-semibold">
              <UsersRoundIcon className="size-5 text-brand" />
              {employeeSummary.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
          </TabsList>

          <Button
            type="button"
            className="bg-brand text-brand-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
            Nuevo pago
          </Button>
        </div>

        <TabsContent value="payments">
          <PayrollTable
            payments={payments}
            onMarkPaid={(row) => {
              setSelectedPayment(row)
              setMarkPaidOpen(true)
            }}
            onSendEmail={handleSendEmail}
            busyId={busyId}
          />
        </TabsContent>

        <TabsContent value="employees">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Acumulado por empleado</CardTitle>
              <CardDescription>
                Totales de planilla segun filtros y pagos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {employeeSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aun no hay pagos registrados para mostrar resumen por
                  empleado.
                </p>
              ) : (
                employeeSummary.map((row) => (
                  <div
                    key={row.employeeId}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <p className="text-sm font-medium">{row.employeeName}</p>
                    <CurrencyDisplay amount={row.total} size="sm" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pago de planilla</DialogTitle>
            <DialogDescription>
              Registra un nuevo pago con el periodo y montos correspondientes.
            </DialogDescription>
          </DialogHeader>

          <PayrollForm
            employees={employees}
            onSuccess={() => {
              setCreateOpen(false)
              handleRefresh()
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <MarkPaidDialog
        open={markPaidOpen}
        payment={selectedPayment}
        onOpenChange={(open) => {
          setMarkPaidOpen(open)
          if (!open) {
            setSelectedPayment(null)
          }
        }}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
