import { cn } from "@/lib/utils"
import { CurrencyDisplay } from "@/components/shared/currency-display"

export function FinanceRow({
  label,
  value,
  accent,
  bold,
}: {
  label: string
  value: number
  accent?: "brand" | "warning" | "success"
  bold?: boolean
}) {
  const colorMap = {
    brand: "text-brand",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-brand",
  }

  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-sm",
          bold ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-sm tabular-nums",
          bold ? "font-bold" : "font-medium",
          accent ? colorMap[accent] : "text-foreground"
        )}
      >
        <CurrencyDisplay amount={value} size="sm" />
      </span>
    </div>
  )
}
