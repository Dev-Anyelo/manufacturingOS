"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { MarkPaidDialog } from "@/components/modules/payroll/mark-paid-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  CheckCircle2Icon,
  PlusIcon,
  ReceiptIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react"

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
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
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl border border-border/60 bg-muted/20 p-1 sm:w-auto">
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
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto"
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
          <Card className="rounded-xl border border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3 px-4 pt-0">
              <CardTitle className="text-base font-semibold">
                Acumulado por empleado
              </CardTitle>
              <CardDescription className="text-sm text-pretty">
                Totales de planilla segun filtros y pagos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {employeeSummary.length === 0 ? (
                <EmptyState
                  icon={
                    <UsersRoundIcon className="size-6 text-muted-foreground" />
                  }
                  title="Sin pagos registrados"
                  description="Los totales por empleado aparecera aqui en cuanto registres pagos en la planilla."
                  className="p-0 m-0 border-none bg-none"
                />
              ) : (
                employeeSummary.map((row) => (
                  <div
                    key={row.employeeId}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-brand/10 text-xs font-semibold text-brand">
                          {getInitials(row.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{row.employeeName}</p>
                    </div>
                    <div className="text-sm font-bold tabular-nums">
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
        <DialogContent className="sm:max-h-[90vh] bg-none  px-4 py-3">
          <DialogHeader className="py-4 text-base text-pretty">
            <DialogTitle>Nuevo pago de planilla</DialogTitle>
            <DialogDescription className="text-pretty">
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

function StatMini({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  tone?: "default" | "warning" | "success"
}) {
  const toneClass = {
    default: "text-foreground",
    warning: "text-warning",
    success: "text-success",
  }[tone]

  return (
    <div className="rounded-lg border border-border/70 bg-card/80 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", toneClass)}>{value}</p>
    </div>
  )
}
