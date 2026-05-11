"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserRole, Currency } from "@prisma/client"
import { type ColumnDef } from "@tanstack/react-table"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { DataTable } from "@/components/shared/data-table"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { ExpenseSheet } from "@/components/modules/expenses/expense-sheet"
import { type ExpenseFormInput } from "@/components/modules/expenses/expense-form"
import { formatDateOnlyNI, normalizeDateOnly } from "@/lib/currency/exchange"
import { ExpenseCategoryBadge } from "@/components/modules/expenses/expense-category-badge"

import {
  ReceiptIcon,
  MoreHorizontal,
  Trash2Icon,
  AlertTriangleIcon,
  ArrowUpRight,
  LayersPlusIcon,
  RulerIcon,
  PencilLineIcon,
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
  inventoryItemId?: string | null
  inventoryQuantityAdded?: number | null
  notes?: string | null
}

interface InventoryOption {
  id: string
  name: string
  unit: string
  quantity: number
}

interface ExpensesTableProps {
  expenses: ExpenseTableRow[]
  currentUserRole: string
  inventoryItems: InventoryOption[]
}

function formatDate(value: string) {
  return formatDateOnlyNI(value)
}

export function ExpensesTable({
  expenses,
  currentUserRole,
  inventoryItems,
}: ExpensesTableProps) {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>(
    {}
  )
  const [expenseToDelete, setExpenseToDelete] =
    React.useState<ExpenseTableRow | null>(null)
  const [editingExpense, setEditingExpense] =
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

      const currentDate = normalizeDateOnly(expense.expenseDate)
      const fromDate = normalizeDateOnly(dateRange.from)

      if (currentDate && fromDate && currentDate < fromDate) {
        return false
      }

      if (dateRange.to) {
        const inclusiveTo = normalizeDateOnly(dateRange.to)

        if (currentDate && inclusiveTo) {
          inclusiveTo.setUTCHours(23, 59, 59, 999)
        }

        if (currentDate && inclusiveTo && currentDate > inclusiveTo) {
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

      await revalidatePaths(["/expenses", "/reports", "/"])
      toast.success("Gasto eliminado correctamente.")
      setExpenseToDelete(null)
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
                href={`/api/storage/signed-url?bucket=expenses&path=${row.original.receiptUrl}&redirect=true`}
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
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setEditingExpense(row.original)}
              >
                <PencilLineIcon className="size-3.5" />
                Editar
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
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
        <CompactKpiCard
          label="Total de gastos"
          value={<CurrencyDisplay amount={filteredTotal} size="sm" />}
          icon={<ArrowUpRight />}
          iconClass="bg-destructive/15 text-destructive"
        />
        <CompactKpiCard
          label="Registros filtrados"
          value={filtered.length}
          icon={<LayersPlusIcon />}
          iconClass="bg-brand/15 text-brand"
        />
        <CompactKpiCard
          label="Categorias"
          value={categories.length}
          icon={<RulerIcon />}
          iconClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
        />
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

      {/* Standardized ExpenseSheet for Editing */}
      <ExpenseSheet
        inventoryItems={inventoryItems}
        itemId={editingExpense?.id}
        defaultValues={
          editingExpense
            ? ({
                expense_date: editingExpense.expenseDate,
                category: editingExpense.category as any,
                concept: editingExpense.concept,
                supplier: editingExpense.supplier,
                total: editingExpense.total,
                total_currency: editingExpense.totalCurrency as Currency,
                updates_inventory: editingExpense.updatesInventory,
                inventory_item_id: editingExpense.inventoryItemId,
                inventory_quantity_added: editingExpense.inventoryQuantityAdded,
                notes: editingExpense.notes,
                receipt_url: editingExpense.receiptUrl,
              } as ExpenseFormInput)
            : undefined
        }
        open={Boolean(editingExpense)}
        onOpenChange={(open) => {
          if (!open) setEditingExpense(null)
        }}
        trigger={null}
      />

      <AlertDialog
        open={Boolean(expenseToDelete)}
        onOpenChange={(open) =>
          !open && !isDeleting && setExpenseToDelete(null)
        }
      >
        <AlertDialogContent className="px-4 py-4 sm:max-w-md sm:px-6 sm:py-6">
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
          <AlertDialogFooter className="grid w-full grid-cols-2 gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full">
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
