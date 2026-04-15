import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; isPositive?: boolean; label: string }
  variant?: "default" | "warning" | "danger" | "success" | "info"
  isLoading?: boolean
  href?: string
  accent?: string
}

const statVariantConfig = {
  default: {
    wrap: "bg-card border-border/50",
    iconWrap: "bg-muted/60 text-muted-foreground",
    accent: "from-slate-200/60 to-transparent",
  },
  success: {
    wrap: "bg-emerald-50/60 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40",
    iconWrap:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400",
    accent: "from-emerald-300/40 to-transparent",
  },
  warning: {
    wrap: "bg-amber-50/60 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40",
    iconWrap:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400",
    accent: "from-amber-300/40 to-transparent",
  },
  danger: {
    wrap: "bg-red-50/60 border-red-200/60 dark:bg-red-950/20 dark:border-red-800/40",
    iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-400",
    accent: "from-red-300/40 to-transparent",
  },
  info: {
    wrap: "bg-blue-50/60 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/40",
    iconWrap:
      "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400",
    accent: "from-blue-300/40 to-transparent",
  },
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
  const config = statVariantConfig[variant]

  const Content = (
    <Card
      className={cn(
        "group rounded-lg border shadow-sm transition-all duration-200",
        "hover:-translate-y-px hover:shadow-md",
        "p-0",
        config.wrap,
        href && "cursor-pointer"
      )}
    >
      <CardContent className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          {/* LEFT */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title */}
            <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {title}
            </p>

            {/* Value */}
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded-md" />
            ) : (
              <p className="truncate text-sm leading-tight font-semibold tabular-nums md:text-base">
                {value}
              </p>
            )}

            {/* Description */}
            {!isLoading && description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-default truncate text-[11px] text-muted-foreground sm:text-xs">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs text-pretty">{description}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Trend */}
            {!isLoading && trend && (
              <Badge
                variant="outline"
                className={cn(
                  "w-fit gap-1 px-1.5 py-0.5 text-[10px] font-medium sm:text-xs",
                  "rounded-md border",
                  isPositiveTrend
                    ? "border-success-soft text-success"
                    : "border-danger-soft text-danger"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUpIcon className="size-3" />
                ) : (
                  <TrendingDownIcon className="size-3" />
                )}
                {Math.abs(trend.value)}%
              </Badge>
            )}
          </div>

          {/* RIGHT ICON */}
          <span className={cn("size-3.5 text-muted-foreground", config.accent)}>{icon}</span>
        </div>
      </CardContent>
    </Card>
  )

  if (!href) return Content

  return (
    <Link href={href} className="block">
      {Content}
    </Link>
  )
}
