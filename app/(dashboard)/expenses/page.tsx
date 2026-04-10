import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
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
    <div className="space-y-6">
      <PageHeader
        title="Gastos"
        description="Controla egresos operativos y compras de insumos."
        actions={
          <Button asChild className="bg-brand text-brand-foreground">
            <Link href="/expenses/new">Nuevo gasto</Link>
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
  )
}
