"use client"

import Link from "next/link"
import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, ReceiptIcon } from "lucide-react"

import { DataTable } from "@/components/shared/data-table"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExpenseCategoryBadge } from "@/components/modules/expenses/expense-category-badge"

export interface ExpenseTableRow {
  id: string
  expenseDate: string
  category: string
  concept: string
  supplier: string | null
  total: number
  updatesInventory: boolean
  inventoryItemName: string | null
  receiptUrl: string | null
}

interface ExpensesTableProps {
  expenses: ExpenseTableRow[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
  }).format(new Date(value))
}

const columns: ColumnDef<ExpenseTableRow>[] = [
  {
    accessorKey: "expenseDate",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.expenseDate)}</span>
    ),
  },
  {
    accessorKey: "concept",
    header: "Concepto",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="max-w-56 truncate text-sm font-medium">
          {row.original.concept}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.original.supplier ?? "Sin proveedor"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => (
      <ExpenseCategoryBadge category={row.original.category} />
    ),
  },
  {
    accessorKey: "updatesInventory",
    header: "Inventario",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.updatesInventory
          ? `+ ${row.original.inventoryItemName ?? "material"}`
          : "No aplica"}
      </span>
    ),
    meta: {
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
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
    id: "actions",
    header: "",
    cell: ({ row }) =>
      row.original.receiptUrl ? (
        <Button asChild variant="ghost" size="sm" className="justify-start">
          <Link href={row.original.receiptUrl} target="_blank" rel="noreferrer">
            <ExternalLinkIcon className="size-4" />
            Recibo
          </Link>
        </Button>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ReceiptIcon className="size-3.5" />
          Sin archivo
        </span>
      ),
  },
]

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>(
    {}
  )

  const categories = React.useMemo(() => {
    return [...new Set(expenses.map((expense) => expense.category))].sort()
  }, [expenses])

  const filtered = React.useMemo(() => {
    return expenses.filter((expense) => {
      if (categoryFilter !== "all" && expense.category !== categoryFilter) {
        return false
      }

      const currentDate = new Date(expense.expenseDate)

      if (dateRange.from && currentDate < dateRange.from) {
        return false
      }

      if (dateRange.to) {
        const inclusiveTo = new Date(dateRange.to)
        inclusiveTo.setHours(23, 59, 59, 999)

        if (currentDate > inclusiveTo) {
          return false
        }
      }

      return true
    })
  }, [categoryFilter, dateRange.from, dateRange.to, expenses])

  const filteredTotal = React.useMemo(
    () => filtered.reduce((acc, expense) => acc + expense.total, 0),
    [filtered]
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryTile label="Registros" value={filtered.length} accent />
        <SummaryTile
          label="Total filtrado"
          value={<CurrencyDisplay amount={filteredTotal} size="sm" />}
          accent
        />
        <SummaryTile label="Categorias" value={categories.length} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKey="concept"
        searchPlaceholder="Buscar concepto..."
        emptyMessage="Sin gastos registrados"
        emptyDescription="Agrega gastos para monitorear egresos operativos."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={setDateRange}
            />
          </div>
        }
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  accent = false,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/80 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={
          accent ? "text-sm font-semibold text-brand" : "text-sm font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}
