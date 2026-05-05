import { requireAuth } from "@/lib/api/response"
import { decimalToNumber } from "@/lib/api/utils"
import { ExpenseCategory, Currency } from "@prisma/client"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ExpensesTable } from "@/components/modules/expenses/expenses-table"
import { ExpensesSummary } from "@/components/modules/expenses/expenses-summary"
import { NewExpenseSheet } from "@/components/modules/expenses/new-expense-sheet"

import {
  getExpenses,
  getMonthlyExpenseOverview,
  getExpensesFormBootstrap,
} from "@/lib/data/expenses"

import {
  TrendingDownIcon,
  WalletCardsIcon,
  TagIcon,
  BarChart2Icon,
} from "lucide-react"

export default async function ExpensesPage() {
  const { profile } = await requireAuth()
  const [expenses, overview, bootstrap] = await Promise.all([
    getExpenses(),
    getMonthlyExpenseOverview(),
    getExpensesFormBootstrap(),
  ])

  const rows = expenses.map((expense) => ({
    id: expense.id,
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    category: expense.category,
    concept: expense.concept,
    supplier: expense.supplier,
    total: decimalToNumber(expense.total),
    totalCurrency: expense.totalCurrency as Currency,
    updatesInventory: expense.updatesInventory,
    inventoryItemName: expense.inventoryItem?.name ?? null,
    receiptUrl: expense.receiptUrl,
  }))

  const inventoryItems = bootstrap.inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: decimalToNumber(item.quantity),
  }))

  const totalThisMonth = overview.monthlyTotal
  const categoryCount = Object.keys(overview.byCategory).length
  const topCategoryEntry = Object.entries(overview.byCategory).sort(
    (a, b) => b[1] - a[1]
  )[0]
  const topCategoryRaw = topCategoryEntry?.[0]
  const topCategoryAmount = topCategoryEntry?.[1] ?? 0

  const categoryLabels: Record<string, string> = {
    [ExpenseCategory.fabrics]: "Fabricas",
    [ExpenseCategory.supplies]: "Suministros",
    [ExpenseCategory.tools]: "Herramientas",
    [ExpenseCategory.machinery]: "Maquinaria",
    [ExpenseCategory.outsourced_labor]: "Mano de obra externa",
    [ExpenseCategory.services]: "Servicios",
    [ExpenseCategory.packaging]: "Empaques",
    [ExpenseCategory.office]: "Oficina",
    [ExpenseCategory.payroll]: "Nómina",
    [ExpenseCategory.other]: "Otro",
  }

  const topCategoryName = topCategoryRaw
    ? categoryLabels[topCategoryRaw] ||
      topCategoryRaw.charAt(0).toUpperCase() + topCategoryRaw.slice(1)
    : "—"

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Gastos"
          description="Controla egresos operativos y compras de insumos."
          breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Gastos" }]}
          actions={<NewExpenseSheet inventoryItems={inventoryItems} />}
        />

        <KpiSection label="Resumen de gastos">
          <CompactKpiCard
            label="Total del mes"
            value={
              <CurrencyDisplay
                amount={totalThisMonth}
                currency={overview.baseCurrency}
                showDual
              />
            }
            icon={<TrendingDownIcon />}
            iconClass={
              totalThisMonth > 0
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Categorías activas"
            value={categoryCount}
            icon={<TagIcon />}
            iconClass="bg-muted text-muted-foreground"
          />
          <CompactKpiCard
            label="Categoría top"
            value={topCategoryName}
            icon={<BarChart2Icon />}
            iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
          <CompactKpiCard
            label="Top monto"
            value={
              <CurrencyDisplay
                amount={topCategoryAmount}
                currency={overview.baseCurrency}
              />
            }
            icon={<WalletCardsIcon />}
            iconClass="bg-muted text-muted-foreground"
          />
        </KpiSection>

        <ExpensesSummary
          monthlyTotal={overview.monthlyTotal}
          topConcepts={overview.topConcepts}
          byCategory={overview.byCategory}
          baseCurrency={overview.baseCurrency}
        />

        <ExpensesTable expenses={rows} currentUserRole={profile.role} />
      </div>
    </section>
  )
}
