import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface StockIndicatorProps {
  quantity: number
  minimumStock: number
  unit: string
}

export function StockIndicator({
  quantity,
  minimumStock,
  unit,
}: StockIndicatorProps) {
  const ratio =
    minimumStock > 0 ? quantity / minimumStock : quantity > 0 ? 1 : 0
  const percentage = Math.min(ratio * 100, 100)

  let status: "critical" | "warning" | "good"
  if (quantity <= 0) status = "critical"
  else if (minimumStock > 0 && quantity <= minimumStock) status = "critical"
  else if (minimumStock > 0 && quantity <= minimumStock * 2)
    status = "warning"
  else status = "good"

  const config = {
    critical: {
      icon: XCircle,
      label: quantity <= 0 ? "Agotado" : "Stock crítico",
      barColor: "bg-red-500 dark:bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
    },
    warning: {
      icon: AlertTriangle,
      label: "Stock bajo",
      barColor: "bg-amber-500 dark:bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    good: {
      icon: CheckCircle2,
      label: "Stock óptimo",
      barColor: "bg-emerald-500 dark:bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  }[status]

  const Icon = config.icon

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-1 ${config.bgColor}`}>
            <Icon className={`size-3.5 ${config.textColor}`} />
          </div>
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <span className="tabular-nums text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{quantity}</span>
          <span> / </span>
          <span>{minimumStock}</span>
          <span className="ml-1 text-xs">{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${config.barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
