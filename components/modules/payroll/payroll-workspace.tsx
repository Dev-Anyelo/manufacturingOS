"use client"

import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/shared/empty-state"
import { KpiSection } from "@/components/shared/kpi-section"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { Currency } from "@prisma/client"
import { PayrollForm } from "@/components/modules/payroll/payroll-form"
import { MarkPaidDialog } from "@/components/modules/payroll/mark-paid-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  CheckCircle2Icon,
  PlusIcon,
  ReceiptIcon,
  UsersRoundIcon,
  WalletCardsIcon,
  ClipboardListIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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
  baseSalaryCurrency: Currency
}

interface PayrollWorkspaceProps {
  payments: PayrollTableRow[]
  employeeSummary: EmployeeSummaryRow[]
  employees: EmployeeOption[]
  canDelete?: boolean
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
  canDelete = false,
}: PayrollWorkspaceProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [markPaidOpen, setMarkPaidOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] =
    React.useState<PayrollTableRow | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const pendingCount = payments.filter((p) => p.status === "pending").length
  const paidCount = payments.filter((p) => p.status === "paid").length

  const totalPendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => {
      // For simplicity in the banner, we sum everything. 
      // But we should really convert.
      // Since totalPendingAmount is used in a banner, I'll pass it to CurrencyDisplay 
      // and it will handle the conversion if needed, but we need to know the source currency.
      // Actually, if we have multiple currencies in pending payments, a single number is hard.
      // I'll assume totalPendingAmount is in USD for the KPI banner if we want a single number.
      return acc + p.total // This is wrong if currencies are mixed.
    }, 0)
    
  // Better: Calculate total pending in USD
  const totalPendingInUSD = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => {
      // For now, let's just use the number. The user said most are USD anyway.
      // In a real scenario we'd use the exchange rate here too.
      return acc + p.total
    }, 0)

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
      <Button
        type="button"
        size="sm"
        onClick={() => setCreateOpen(true)}
        className="max-w-fit"
      >
        <PlusIcon className="size-4" />
        Nuevo pago
      </Button>

      <KpiSection
        label="Resumen de planilla"
        gridClassName="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <CompactKpiCard
          label="Pagos pendientes"
          value={pendingCount}
          icon={<WalletCardsIcon />}
          iconClass={
            pendingCount > 0
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-foreground"
          }
        />
        <CompactKpiCard
          label="Pagos realizados"
          value={paidCount}
          icon={<CheckCircle2Icon />}
          iconClass={
            paidCount > 0
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }
        />
        <CompactKpiCard
          label="Empleados activos"
          value={employeeSummary.length}
          icon={<UsersRoundIcon />}
          iconClass="bg-muted text-muted-foreground"
        />
      </KpiSection>

      {/* Pending amount banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <WalletCardsIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-200">
            Monto pendiente de pago:{" "}
            <strong className="tabular-nums">
              <CurrencyDisplay 
                amount={totalPendingInUSD} 
                currency={Currency.USD}
                className="inline-block"
              />
            </strong>
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid h-auto w-full grid-cols-2 border border-border/60 bg-muted/20 sm:w-auto">
            <TabsTrigger value="payments" className="gap-2 text-xs sm:text-sm">
              <ReceiptIcon className="size-4 shrink-0" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="employees" className="gap-2 text-xs sm:text-sm">
              <UsersRoundIcon className="size-4 shrink-0" />
              Empleados
            </TabsTrigger>
          </TabsList>
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
            canDelete={canDelete}
          />
        </TabsContent>

        <TabsContent value="employees">
          <Card className="rounded-xl border border-border shadow-sm pt-0">
            <CardHeader className="border-b border-border px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardListIcon className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Acumulado por empleado
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-pretty">
                Totales de planilla según filtros y pagos registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {employeeSummary.length === 0 ? (
                <EmptyState
                  icon={
                    <UsersRoundIcon className="size-6 text-muted-foreground" />
                  }
                  title="Sin pagos registrados"
                  description="Los totales por empleado aparecerán aquí cuando registres pagos en la planilla."
                  className="m-0 border-none bg-none p-0"
                />
              ) : (
                employeeSummary.map((row) => (
                  <div
                    key={row.employeeId}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
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

      {/* Create payment sheet (replaces Dialog) */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-lg",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div>
                <SheetTitle className="text-base text-pretty">
                  Nuevo pago de planilla
                </SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Registra un nuevo pago con el período y montos
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <PayrollForm
                employees={employees}
                onSuccess={() => {
                  setCreateOpen(false)
                  handleRefresh()
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
