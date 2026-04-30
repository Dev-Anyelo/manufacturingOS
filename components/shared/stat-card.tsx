import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: ReactNode
  description?: string
  icon: ReactNode
  trend?: { value: number; isPositive?: boolean; label: string }
  variant?: "default" | "warning" | "danger" | "success" | "info"
  isLoading?: boolean
  href?: string
}

const iconWrapStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
} satisfies Record<NonNullable<StatCardProps["variant"]>, string>

const valueToneStyles = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
} satisfies Record<NonNullable<StatCardProps["variant"]>, string>

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
  isLoading = false,
  href,
}: StatCardProps) {
  const isPositiveTrend = trend?.isPositive ?? true

  const Content = (
    <div
      className={cn(
        "flex items-center gap-2.5 p-2.5 rounded-lg border bg-card transition-colors hover:bg-muted/30",
        href && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "shrink-0 h-8 w-8 rounded-md flex items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5",
          iconWrapStyles[variant]
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate leading-none mb-1">
          {title}
        </p>
        <div
          className={cn(
            "text-lg font-bold tabular-nums leading-none truncate",
            !isLoading && valueToneStyles[variant]
          )}
        >
          {isLoading ? (
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  )

  if (!href) return Content

  return (
    <Link href={href} className="block">
      {Content}
    </Link>
  )
}
