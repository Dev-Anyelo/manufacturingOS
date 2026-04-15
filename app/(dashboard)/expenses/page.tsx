import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { getExpenses, getMonthlyExpenseOverview } from "@/lib/data/expenses"
import { ExpensesTable } from "@/components/modules/expenses/expenses-table"
import { ExpensesSummary } from "@/components/modules/expenses/expenses-summary"

export default async function ExpensesPage() {
  const [expenses, overview] = await Promise.all([
    getExpenses(),
    getMonthlyExpenseOverview(),
  ])

  const rows = expenses.map((expense) => ({
    id: expense.id,
    expenseDate: expense.expenseDate.toISOString(),
    category: expense.category,
    concept: expense.concept,
    supplier: expense.supplier,
    total: decimalToNumber(expense.total),
    updatesInventory: expense.updatesInventory,
    inventoryItemName: expense.inventoryItem?.name ?? null,
    receiptUrl: expense.receiptUrl,
  }))

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="mx-auto w-full space-y-4">
        <PageHeader
          title="Gastos"
          description="Controla egresos operativos y compras de insumos."
          breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Gastos" }]}
          actions={
            <Button
              asChild
              size="sm"
              className="h-9 bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90"
            >
              <Link href="/expenses/new">
                <PlusIcon className="size-4" />
                Nuevo gasto
              </Link>
            </Button>
          }
        />

        <ExpensesSummary
          monthlyTotal={overview.monthlyTotal}
          topConcepts={overview.topConcepts}
          byCategory={overview.byCategory}
        />

        <ExpensesTable expenses={rows} />
      </div>
    </section>
  )
}
