import Link from "next/link"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const variantClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "border-border/50 bg-card",
  warning: "tone-warning",
  danger: "tone-danger",
  success: "tone-success",
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
        "rounded-xl border shadow-sm transition-all duration-200",
        href ? "hover:-translate-y-0.5 hover:shadow-md" : "",
        variantClasses[variant]
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-24 rounded-md" />
        ) : (
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {value}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-4 w-full rounded-md" />
        ) : description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {isLoading ? (
          <Skeleton className="h-5 w-28 rounded-md" />
        ) : trend ? (
          <Badge variant="outline" className="gap-1">
            {isPositiveTrend ? (
              <TrendingUpIcon className="text-success size-3.5" />
            ) : (
              <TrendingDownIcon className="text-danger size-3.5" />
            )}
            {Math.abs(trend.value)}% {trend.label}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )

  if (!href) {
    return cardContent
  }

  return <Link href={href}>{cardContent}</Link>
}
