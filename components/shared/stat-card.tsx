import Link from "next/link"
import * as React from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; isPositive?: boolean; label: string }
  variant?: "default" | "warning" | "danger" | "success"
  isLoading?: boolean
  href?: string
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-card border-border/50",
  warning:
    "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
  danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
  success:
    "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
}

const iconBgStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-muted text-muted-foreground",
  warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  danger: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  success:
    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
}

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

  const cardContent = (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-sm transition-all duration-200",
        href &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
        variantStyles[variant]
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {value}
              </p>
            )}
            {!isLoading && trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isPositiveTrend
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                <span>
                  {Math.abs(trend.value)}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn("shrink-0 rounded-lg p-2.5", iconBgStyles[variant])}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement, {
                  className: "size-5",
                })
              : icon}
          </div>
        </div>
        {description && (
          <p className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (!href) {
    return cardContent
  }

  return <Link href={href}>{cardContent}</Link>
}
