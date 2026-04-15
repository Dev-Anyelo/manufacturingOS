import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type StockStatus = "normal" | "low" | "critical" | "out"

interface StockIndicatorProps {
  quantity: number
  minimumStock: number
  unit: string
}

const statusConfig: Record<
  StockStatus,
  {
    label: string
    badgeClasses: string
    barColor: string
    dot: string
  }
> = {
  normal: {
    label: "Normal",
    badgeClasses:
      "bg-success-soft border-success-soft text-success",
    barColor: "bg-brand",
    dot: "bg-brand",
  },
  low: {
    label: "Bajo",
    badgeClasses:
      "bg-warning-soft border-warning-soft text-warning",
    barColor: "bg-warning",
    dot: "bg-warning",
  },
  critical: {
    label: "Critico",
    badgeClasses:
      "bg-danger-soft border-danger-soft text-danger",
    barColor: "bg-danger",
    dot: "bg-danger",
  },
  out: {
    label: "Agotado",
    badgeClasses:
      "bg-muted border-border text-muted-foreground",
    barColor: "bg-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

function getStockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) return "out"
  if (quantity <= minimumStock) return "critical"
  if (quantity <= minimumStock * 2) return "low"
  return "normal"
}

function getProgressValue(quantity: number, minimumStock: number): number {
  if (quantity <= 0) return 0
  if (minimumStock <= 0) return 100
  const pct = (quantity / (minimumStock * 3)) * 100
  return Math.min(Math.max(pct, 4), 100)
}

export function StockIndicator({
  quantity,
  minimumStock,
  unit,
}: StockIndicatorProps) {
  const status = getStockStatus(quantity, minimumStock)
  const progress = getProgressValue(quantity, minimumStock)
  const config = statusConfig[status]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="min-w-[150px] max-w-[200px] space-y-1.5 cursor-default">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium tabular-nums text-foreground">
              {quantity.toFixed(2)}{" "}
              <span className="text-muted-foreground font-normal">{unit}</span>
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
                config.badgeClasses
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                  config.dot
                )}
              />
              {config.label}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                config.barColor
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">
          Minimo: {minimumStock} {unit}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
