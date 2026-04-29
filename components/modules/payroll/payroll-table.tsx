"use client"

import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { ArrowUpRight, CheckCircle2Icon, MailIcon } from "lucide-react"
import { CurrencyDisplay } from "@/components/shared/currency-display"

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
  total: number
  status: "pending" | "paid"
  paymentDate: string | null
  paymentMethod: "cash" | "transfer" | "other" | null
  createdByName: string
}

interface PayrollTableProps {
  payments: PayrollTableRow[]
  onMarkPaid: (row: PayrollTableRow) => void
  onSendEmail: (id: string) => Promise<void>
  busyId?: string | null
}

function formatDate(value: string | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
  }).format(new Date(value))
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
  onMarkPaid,
  onSendEmail,
  busyId,
}: PayrollTableProps) {
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [employeeFilter, setEmployeeFilter] = React.useState("all")

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

  const columns = React.useMemo<ColumnDef<PayrollTableRow>[]>(
    () => [
      {
        accessorKey: "periodStart",
        header: "Periodo",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-sm">
            <p>{formatDate(row.original.periodStart)}</p>
            <p className="text-xs text-muted-foreground">
              a {formatDate(row.original.periodEnd)}
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
            <CurrencyDisplay amount={row.original.total} size="sm" />
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
          <div className="flex justify-end gap-1">
            <Button asChild variant="ghost" size="sm" className="justify-start">
              <Link href={`/payroll/${row.original.id}`}>
                Ver
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>

            {row.original.status === "pending" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-warning justify-start"
                onClick={() => onMarkPaid(row.original)}
              >
                <CheckCircle2Icon className="size-4" />
                Pagar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                disabled={busyId === row.original.id}
                onClick={() => void onSendEmail(row.original.id)}
              >
                <MailIcon className="size-4" />
                Email
              </Button>
            )}
          </div>
        ),
      },
    ],
    [busyId, onMarkPaid, onSendEmail]
  )

  return (
    <DataTable
      columns={columns}
      data={filteredPayments}
      searchKey="employeeName"
      searchPlaceholder="Buscar empleado..."
      emptyMessage="Sin pagos de planilla"
      emptyDescription="Registra una nueva corrida para calcular y pagar planilla."
      toolbar={
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
      }
    />
  )
}
