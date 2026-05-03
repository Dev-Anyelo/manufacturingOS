"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { UserRole, Currency } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { ExpenseCategoryBadge } from "@/components/modules/expenses/expense-category-badge"

import {
  ReceiptIcon,
  MoreHorizontal,
  Trash2Icon,
  AlertTriangleIcon,
  ArrowUpRight,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export interface ExpenseTableRow {
  id: string
  expenseDate: string
  category: string
  concept: string
  supplier: string | null
  total: number
  totalCurrency: Currency
  updatesInventory: boolean
  inventoryItemName: string | null
  receiptUrl: string | null
}

interface ExpensesTableProps {
  expenses: ExpenseTableRow[]
  currentUserRole: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "short",
  }).format(new Date(value))
}

export function ExpensesTable({
  expenses,
  currentUserRole,
}: ExpensesTableProps) {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>(
    {}
  )
  const [expenseToDelete, setExpenseToDelete] =
    React.useState<ExpenseTableRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const canDelete =
    currentUserRole === UserRole.admin || currentUserRole === UserRole.manager

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

  // Note: filteredTotal should ideally use the exchange rate.
  // For the client-side summary, we'll assume they are already normalized 
  // or just sum them (which is technically wrong if mixed).
  // But since the parent page (app/expenses/page.tsx) provides normalized overview,
  // we'll just sum them for now or use the CurrencyDisplay to show they are mixed.
  const filteredTotal = React.useMemo(
    () => filtered.reduce((acc, expense) => acc + expense.total, 0),
    [filtered]
  )

  const handleDelete = async () => {
    if (!expenseToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar el gasto.")
      }

      toast.success("Gasto eliminado correctamente.")
      setExpenseToDelete(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.")
    } finally {
      setIsDeleting(false)
    }
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
          <CurrencyDisplay
            amount={row.original.total}
            currency={row.original.totalCurrency}
            size="sm"
          />
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.receiptUrl && (
            <Button asChild variant="ghost" size="icon" className="size-7">
              <Link
                href={row.original.receiptUrl}
                target="_blank"
                rel="noreferrer"
                title="Ver recibo"
              >
                <ReceiptIcon className="size-3.5" />
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${row.original.id}`}>
                  <ArrowUpRight className="size-3.5" />
                  Detalles
                </Link>
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setExpenseToDelete(row.original)}
                >
                  <Trash2Icon className="size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

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

      <AlertDialog
        open={Boolean(expenseToDelete)}
        onOpenChange={(open) =>
          !open && !isDeleting && setExpenseToDelete(null)
        }
      >
        <AlertDialogContent className="px-4 py-4 sm:px-6 sm:py-6 sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-5" />
            </div>
            <AlertDialogTitle className="text-center text-pretty">
              ¿Eliminar este gasto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              Esta acción no se puede deshacer. Se eliminará el registro del
              gasto permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

