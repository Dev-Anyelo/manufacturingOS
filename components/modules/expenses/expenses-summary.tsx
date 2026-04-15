import { EXPENSE_CATEGORIES } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TrendingDownIcon, WalletCardsIcon } from "lucide-react"

interface ExpensesSummaryProps {
  monthlyTotal: number
  topConcepts: Array<{ concept: string; total: number }>
  byCategory: Record<string, number>
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const categoryColors = [
  "bg-brand",
  "bg-blue-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-rose-500",
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
    ? (EXPENSE_CATEGORIES[
        topCategory[0] as keyof typeof EXPENSE_CATEGORIES
      ] ?? topCategory[0])
    : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
      {/* Left: Monthly total + top concepts */}
      <Card className="border border-border/50 shadow-sm rounded-xl lg:col-span-1">
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-soft">
              <TrendingDownIcon className="size-4 text-danger" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total del mes
              </p>
              <p className="text-2xl font-bold tabular-nums tracking-tight leading-tight">
                {currencyFormatter.format(monthlyTotal)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top conceptos
          </p>
          {topConcepts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Sin gastos en el mes actual.
            </p>
          ) : (
            topConcepts.slice(0, 4).map((concept, index) => (
              <div key={concept.concept} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground tabular-nums w-4 text-right flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span className="text-xs font-medium truncate">{concept.concept}</span>
                </div>
                <span className="text-xs font-bold tabular-nums text-foreground flex-shrink-0">
                  {currencyFormatter.format(concept.total)}
                </span>
              </div>
            ))
          )}

          {topCategoryLabel ? (
            <>
              <Separator className="opacity-40" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Categoria dominante</p>
                <Badge
                  variant="outline"
                  className="text-xs status-warning border"
                >
                  {topCategoryLabel}
                </Badge>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Right: Category breakdown bars */}
      <Card className="border border-border/50 shadow-sm rounded-xl lg:col-span-2">
        <CardHeader className="border-b border-border/50 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <WalletCardsIcon className="size-4 text-muted-foreground" />
            Distribucion por categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sin datos de gastos por categoria.
            </p>
          ) : (
            sortedCategories.map(([key, value], index) => {
              const label =
                EXPENSE_CATEGORIES[key as keyof typeof EXPENSE_CATEGORIES] ??
                key
              const pct =
                monthlyTotal > 0
                  ? Math.round((value / monthlyTotal) * 100)
                  : 0
              const colorClass = categoryColors[index % categoryColors.length]

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${colorClass}`}
                      />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {pct}%
                      </span>
                      <span className="text-xs font-bold tabular-nums w-20 text-right">
                        {currencyFormatter.format(value)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
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
