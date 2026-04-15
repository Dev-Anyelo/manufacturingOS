import Link from "next/link"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

const variantConfig: Record<
  NonNullable<StatCardProps["variant"]>,
  {
    card: string
    iconBg: string
    iconColor: string
  }
> = {
  default: {
    card: "border-border/50 bg-card",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  success: {
    card: "tone-success",
    iconBg: "bg-success-soft",
    iconColor: "text-success",
  },
  warning: {
    card: "tone-warning",
    iconBg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  danger: {
    card: "tone-danger",
    iconBg: "bg-danger-soft",
    iconColor: "text-danger",
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
  const config = variantConfig[variant]

  const cardContent = (
    <Card
      className={cn(
        "rounded-xl border shadow-sm transition-all duration-200",
        href ? "hover:-translate-y-0.5 hover:shadow-md cursor-pointer" : "",
        config.card
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-28 rounded-md" />
            ) : (
              <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">
                {value}
              </p>
            )}
            {isLoading ? (
              <Skeleton className="h-3.5 w-full rounded-md" />
            ) : description ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="line-clamp-1 text-xs text-muted-foreground cursor-default">
                    {description}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
            {isLoading ? (
              <Skeleton className="h-5 w-24 rounded-md" />
            ) : trend ? (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 text-xs font-medium",
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
                {Math.abs(trend.value)}% {trend.label}
              </Badge>
            ) : null}
          </div>

          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              config.iconBg
            )}
          >
            <span className={cn("size-5 [&>svg]:size-5", config.iconColor)}>
              {icon}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!href) {
    return cardContent
  }

  return <Link href={href}>{cardContent}</Link>
}
