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
  else if (quantity < minimumStock) status = "warning"
  else status = "good"

  const config = {
    critical: {
      icon: XCircle,
      label: "Sin stock",
      barColor: "bg-danger",
      textColor: "text-danger",
      bgColor: "bg-danger-soft",
    },
    warning: {
      icon: AlertTriangle,
      label: "Stock bajo",
      barColor: "bg-warning",
      textColor: "text-warning",
      bgColor: "bg-warning-soft",
    },
    good: {
      icon: CheckCircle2,
      label: "Stock óptimo",
      barColor: "bg-success",
      textColor: "text-success",
      bgColor: "bg-success-soft",
    },
  }[status]

  const Icon = config.icon

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-1 ${config.bgColor}`}>
            <Icon className={`size-3.5 ${config.textColor}`} />
          </div>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
        <span className="text-sm font-semibold text-pretty text-foreground">
          {quantity} / {minimumStock} {unit}
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
