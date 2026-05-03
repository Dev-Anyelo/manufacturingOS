import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CompactKpiCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  /** Tailwind class for icon container background + text color, e.g. "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" */
  iconClass?: string
}

/**
 * Compact horizontal KPI card.
 * Icon on the left, label + value on the right.
 * Designed to sit inside a grid (grid-cols-2 sm:grid-cols-3 lg:grid-cols-4).
 */
export function CompactKpiCard({
  label,
  value,
  icon,
  iconClass = "bg-muted text-muted-foreground",
}: CompactKpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-sm">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md [&>svg]:size-4",
          iconClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold tabular-nums leading-tight">{value}</div>
      </div>
    </div>
  )
}
