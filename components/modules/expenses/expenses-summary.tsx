import { formatCurrency } from "@/lib/utils"
import { EXPENSE_CATEGORIES } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingDownIcon, WalletCardsIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpensesSummaryProps {
  monthlyTotal: number
  topConcepts: Array<{ concept: string; total: number }>
  byCategory: Record<string, number>
}
const categoryColors = [
  "bg-brand",
  "bg-info",
  "bg-warning",
  "bg-danger",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-blue-500",
]

export function ExpensesSummary({
  monthlyTotal,
  topConcepts,
  byCategory,
}: ExpensesSummaryProps) {
  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topCategory = sortedCategories[0]

  const topCategoryLabel = topCategory
    ? (EXPENSE_CATEGORIES[topCategory[0] as keyof typeof EXPENSE_CATEGORIES] ??
      topCategory[0])
    : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
      {/* Left: Monthly total + top concepts */}
      <Card className="m-0 rounded-xl border border-border p-0 shadow-card lg:col-span-1">
        <CardHeader className="border-b border-border px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-danger-soft flex h-9 w-9 items-center justify-center rounded-lg">
              <TrendingDownIcon className="text-danger size-4" />
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Total del mes
              </p>
              <p className="text-base leading-tight font-bold tracking-tight tabular-nums">
                {formatCurrency(monthlyTotal)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Top conceptos
          </p>
          {topConcepts.length === 0 ? (
            <p className="text-xs text-pretty text-muted-foreground italic">
              Sin gastos en el mes actual.
            </p>
          ) : (
            topConcepts.slice(0, 4).map((concept, index) => (
              <div
                key={concept.concept}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  <span className="truncate text-xs font-medium text-pretty">
                    {concept.concept}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-bold text-foreground tabular-nums">
                  {formatCurrency(concept.total)}
                </span>
              </div>
            ))
          )}

          {topCategoryLabel ? (
            <>
              <Separator className="opacity-40" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-pretty text-muted-foreground">
                  Categoria dominante
                </p>
                <Badge
                  variant="outline"
                  className="status-warning border text-xs"
                >
                  {topCategoryLabel}
                </Badge>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Right: Category breakdown bars */}
      <Card className="rounded-xl border border-border shadow-card lg:col-span-2">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <WalletCardsIcon className="size-4 text-muted-foreground" />
            Distribucion por categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {sortedCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin datos de gastos por categoria.
            </p>
          ) : (
            sortedCategories.map(([key, value], index) => {
              const label =
                EXPENSE_CATEGORIES[key as keyof typeof EXPENSE_CATEGORIES] ??
                key
              const pct =
                monthlyTotal > 0 ? Math.round((value / monthlyTotal) * 100) : 0
              const colorClass = categoryColors[index % categoryColors.length]

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${colorClass}`}
                      />
                      <span className="text-xs font-medium text-pretty">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {pct}%
                      </span>
                      <span className="w-20 text-right text-xs font-bold tabular-nums">
                        {formatCurrency(value)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
