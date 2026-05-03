import { cn } from "@/lib/utils"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { Currency } from "@prisma/client"

export function FinanceRow({
  label,
  value,
  accent,
  bold,
  currency,
}: {
  label: string
  value: number
  accent?: "brand" | "warning" | "success"
  bold?: boolean
  currency?: Currency
}) {
  const colorMap = {
    brand: "text-brand",
    warning: "text-warning",
    success: "text-brand",
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-2.5 py-2">
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
        <CurrencyDisplay amount={value} currency={currency} size="sm" />
      </span>
    </div>
  )
}
