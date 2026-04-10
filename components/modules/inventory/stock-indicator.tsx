import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/shared/status-badge"

type StockStatus = "normal" | "low" | "critical" | "out"

interface StockIndicatorProps {
  quantity: number
  minimumStock: number
  unit: string
}

function getStockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) {
    return "out"
  }

  if (quantity <= minimumStock) {
    return "critical"
  }

  if (quantity <= minimumStock * 2) {
    return "low"
  }

  return "normal"
}

function getProgressValue(quantity: number, minimumStock: number) {
  if (minimumStock <= 0) {
    return quantity > 0 ? 100 : 0
  }

  return (quantity / (minimumStock * 2)) * 100
}

function getIndicatorClassName(status: StockStatus) {
  if (status === "normal") {
    return "bg-brand"
  }

  if (status === "low") {
    return "bg-warning"
  }

  if (status === "critical") {
    return "bg-danger"
  }

  return "bg-muted-foreground"
}

export function StockIndicator({
  quantity,
  minimumStock,
  unit,
}: StockIndicatorProps) {
  const status = getStockStatus(quantity, minimumStock)
  const progress = getProgressValue(quantity, minimumStock)

  return (
    <div className="min-w-44 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">
          {quantity.toFixed(2)} {unit}
        </p>
        <StatusBadge status={status} type="stock" />
      </div>
      <Progress
        value={progress}
        indicatorClassName={getIndicatorClassName(status)}
      />
    </div>
  )
}
