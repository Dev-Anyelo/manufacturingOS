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
        "group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        href && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[14rem] text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-5",
            iconWrapStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>

      <div
        className={cn(
          "mt-4 text-3xl font-bold tracking-tight tabular-nums",
          !isLoading && valueToneStyles[variant]
        )}
      >
        {isLoading ? (
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        ) : (
          value
        )}
      </div>

      {(description ?? trend) ? (
        <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
          {trend ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
                isPositiveTrend
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {isPositiveTrend ? (
                <TrendingUpIcon className="size-3.5" />
              ) : (
                <TrendingDownIcon className="size-3.5" />
              )}
              {Math.abs(trend.value)}%{" "}
              <span className="font-normal text-muted-foreground">
                {trend.label}
              </span>
            </div>
          ) : null}
          {description ? (
            <p className="text-xs leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  if (!href) return Content

  return (
    <Link href={href} className="block">
      {Content}
    </Link>
  )
}
