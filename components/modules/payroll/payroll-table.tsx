"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { Currency } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { formatDateOnlyNI } from "@/lib/currency/exchange"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { PayrollSheet } from "@/components/modules/payroll/payroll-sheet"

import {
  CheckCircle2Icon,
  MailIcon,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Eye,
  PencilLineIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface PayrollTableRow {
  id: string
  employeeId: string
  employeeName: string
  periodStart: string
  periodEnd: string
  piecesProduced: number | null
  hoursWorked: number | null
  baseAmount: number
  bonuses: number
  deductions: number
  total: number
  totalCurrency: Currency
  currency: Currency
  status: "pending" | "paid"
  paymentDate: string | null
  paymentMethod: "cash" | "transfer" | "other" | null
  notes: string | null
  receiptUrl: string | null
  createdByName: string
}

type EmployeeOption = {
  id: string
  fullName: string
  contractType: "fixed_salary" | "per_piece" | "hourly"
  baseSalary: number | null
}

interface PayrollTableProps {
  payments: PayrollTableRow[]
  employees: EmployeeOption[]
  onMarkPaid: (row: PayrollTableRow) => void
  onSendEmail: (id: string) => Promise<void>
  busyId?: string | null
  canDelete?: boolean
}

const methodLabelMap: Record<"cash" | "transfer" | "other", string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
}

const statusLabelMap: Record<PayrollTableRow["status"], string> = {
  pending: "Pendiente",
  paid: "Pagado",
}

export function PayrollTable({
  payments,
  employees,
  onMarkPaid,
  onSendEmail,
  busyId,
  canDelete = false,
}: PayrollTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [employeeFilter, setEmployeeFilter] = React.useState("all")
  const [editingPayment, setEditingPayment] = React.useState<PayrollTableRow | null>(
    null
  )
  const [paymentToDelete, setPaymentToDelete] =
    React.useState<PayrollTableRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const employeeOptions = React.useMemo(() => {
    const map = new Map<string, string>()

    for (const payment of payments) {
      if (!map.has(payment.employeeId)) {
        map.set(payment.employeeId, payment.employeeName)
      }
    }

    return [...map.entries()].map(([id, fullName]) => ({ id, fullName }))
  }, [payments])

  const filteredPayments = React.useMemo(() => {
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) {
        return false
      }

      if (employeeFilter !== "all" && payment.employeeId !== employeeFilter) {
        return false
      }

      return true
    })
  }, [employeeFilter, payments, statusFilter])

  async function handleDelete() {
    if (!paymentToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/payroll/${paymentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "No se pudo eliminar el pago.")
      }

      await revalidatePaths(["/payroll", "/reports", "/"])
      toast.success("Pago de planilla eliminado.")
      setPaymentToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = React.useMemo<ColumnDef<PayrollTableRow>[]>(
    () => [
      {
        accessorKey: "periodStart",
        header: "Periodo",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-sm">
            <p>{formatDateOnlyNI(row.original.periodStart)}</p>
            <p className="text-xs text-muted-foreground">
              a {formatDateOnlyNI(row.original.periodEnd)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Empleado",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{row.original.employeeName}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.createdByName}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: () => <div className="text-right">Total</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CurrencyDisplay
              amount={row.original.total}
              currency={row.original.totalCurrency}
              size="sm"
            />
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.status === "paid" ? "tone-success" : "tone-warning"
            }
          >
            {statusLabelMap[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentMethod",
        header: "Metodo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.paymentMethod
              ? methodLabelMap[row.original.paymentMethod]
              : "-"}
          </span>
        ),
        meta: {
          className: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/payroll/${row.original.id}`}
                    className="flex items-center gap-2"
                  >
                    <Eye className="size-4" />
                    Ver detalles
                  </Link>
                </DropdownMenuItem>
                
                {row.original.status === "pending" && (
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => setEditingPayment(row.original)}
                  >
                    <PencilLineIcon className="size-4" />
                    Editar
                  </DropdownMenuItem>
                )}

                {row.original.status === "pending" && (
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-brand focus:text-brand"
                    onClick={() => onMarkPaid(row.original)}
                  >
                    <CheckCircle2Icon className="size-4" />
                    Marcar como pagado
                  </DropdownMenuItem>
                )}

                {row.original.status === "paid" && (
                  <DropdownMenuItem
                    disabled={busyId === row.original.id}
                    onClick={() => void onSendEmail(row.original.id)}
                    className="flex items-center gap-2"
                  >
                    <MailIcon className="size-4" />
                    Enviar comprobante
                  </DropdownMenuItem>
                )}

                {canDelete && row.original.status === "pending" && (
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={() => setPaymentToDelete(row.original)}
                  >
                    <Trash2 className="size-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [busyId, onMarkPaid, onSendEmail, canDelete]
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="paid">Pagado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Empleado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {employeeOptions.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={filteredPayments}
        searchKey="employeeName"
        searchPlaceholder="Buscar empleado..."
        emptyMessage="Sin pagos de planilla"
        emptyDescription="Registra una nueva corrida para calcular y pagar planilla."
        toolbar={toolbar}
      />

      {/* Edit Payment Sheet */}
      <PayrollSheet
        open={Boolean(editingPayment)}
        onOpenChange={(open) => !open && setEditingPayment(null)}
        paymentId={editingPayment?.id}
        employees={employees}
        defaultValues={
          editingPayment
            ? {
                employee_id: editingPayment.employeeId,
                period_start: editingPayment.periodStart,
                period_end: editingPayment.periodEnd,
                pieces_produced: editingPayment.piecesProduced,
                hours_worked: editingPayment.hoursWorked,
                base_amount: editingPayment.baseAmount,
                base_amount_currency: editingPayment.currency,
                bonuses: editingPayment.bonuses,
                bonuses_currency: editingPayment.currency,
                deductions: editingPayment.deductions,
                deductions_currency: editingPayment.currency,
                payment_method: editingPayment.paymentMethod,
                notes: editingPayment.notes,
                receipt_url: editingPayment.receiptUrl,
              }
            : undefined
        }
        trigger={null}
      />

      <AlertDialog
        open={Boolean(paymentToDelete)}
        onOpenChange={(open) =>
          !open && !isDeleting && setPaymentToDelete(null)
        }
      >
        <AlertDialogContent className="px-4 py-4 sm:max-w-md sm:py-6">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center">
              ¿Eliminar pago de planilla?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              Esta acción eliminará permanentemente el registro de pago
              pendiente.
              <span className="mt-2 block text-xs font-medium text-pretty text-muted-foreground">
                Solo se pueden eliminar pagos en estado pendiente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid w-full grid-cols-2 gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
