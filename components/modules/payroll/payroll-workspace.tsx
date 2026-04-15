"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  CheckCircle2Icon,
  PlusIcon,
  ReceiptIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react"
import { MarkPaidDialog } from "@/components/modules/payroll/mark-paid-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

import {
  PayrollTable,
  type PayrollTableRow,
} from "@/components/modules/payroll/payroll-table"

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
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

  const pendingCount = payments.filter((p) => p.status === "pending").length
  const paidCount = payments.filter((p) => p.status === "paid").length

  const totalPendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.total, 0)

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
    <div className="space-y-5">
      {/* StatCards row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          title="Pagos pendientes"
          value={pendingCount}
          description={`Monto: $${totalPendingAmount.toFixed(2)}`}
          icon={<WalletCardsIcon className="size-5" />}
          variant={pendingCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Pagos realizados"
          value={paidCount}
          description="Pagos completados en el periodo"
          icon={<CheckCircle2Icon className="size-5" />}
          variant={paidCount > 0 ? "success" : "default"}
        />
        <StatCard
          title="Empleados activos"
          value={employeeSummary.length}
          description="Con pagos registrados en el periodo"
          icon={<UsersRoundIcon className="size-5" />}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="payments" className="gap-1.5 text-xs">
              <ReceiptIcon className="size-3.5" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-1.5 text-xs">
              <UsersRoundIcon className="size-3.5" />
              Empleados
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            size="sm"
            className="bg-brand text-brand-foreground hover:bg-brand/90 h-9 px-4 font-medium"
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
          <Card className="border border-border/50 shadow-sm rounded-xl">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-base font-semibold">
                Acumulado por empleado
              </CardTitle>
              <CardDescription className="text-sm">
                Totales de planilla segun filtros y pagos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {employeeSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aun no hay pagos registrados para mostrar resumen por empleado.
                </p>
              ) : (
                employeeSummary.map((row) => (
                  <div
                    key={row.employeeId}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7 flex-shrink-0">
                        <AvatarFallback className="bg-brand-muted text-brand text-[10px] font-semibold">
                          {getInitials(row.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{row.employeeName}</p>
                    </div>
                    <div className="font-bold tabular-nums text-sm">
                      <CurrencyDisplay amount={row.total} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create payment dialog */}
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
          if (!open) setSelectedPayment(null)
        }}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
