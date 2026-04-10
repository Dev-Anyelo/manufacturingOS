import { FolderCogIcon, SparklesIcon, WalletCardsIcon } from "lucide-react"

import { StatCard } from "@/components/shared/stat-card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { EXPENSE_CATEGORIES } from "@/types"

interface ExpensesSummaryProps {
  monthlyTotal: number
  topConcepts: Array<{ concept: string; total: number }>
  byCategory: Record<string, number>
}

export function ExpensesSummary({
  monthlyTotal,
  topConcepts,
  byCategory,
}: ExpensesSummaryProps) {
  const topCategoryEntry = Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1]
  )[0]

  const topCategoryLabel = topCategoryEntry
    ? (EXPENSE_CATEGORIES[
        topCategoryEntry[0] as keyof typeof EXPENSE_CATEGORIES
      ] ?? topCategoryEntry[0])
    : "Sin datos"

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <StatCard
        title="Total del mes"
        value={<CurrencyDisplay amount={monthlyTotal} size="lg" />}
        description="Suma de gastos operativos del periodo actual."
        icon={<WalletCardsIcon className="size-4" />}
      />
      <StatCard
        title="Categoria dominante"
        value={topCategoryLabel}
        description={
          topCategoryEntry
            ? `Impacto: ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(topCategoryEntry[1])}`
            : "Aun sin gastos en el mes"
        }
        icon={<FolderCogIcon className="size-4" />}
        variant="warning"
      />
      <StatCard
        title="Top concepto"
        value={topConcepts[0]?.concept ?? "Sin datos"}
        description={
          topConcepts[0]
            ? `Total: ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(topConcepts[0].total)}`
            : "Aun sin gastos en el mes"
        }
        icon={<SparklesIcon className="size-4" />}
      />
    </div>
  )
}
