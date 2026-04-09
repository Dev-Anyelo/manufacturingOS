import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  variant?: "default" | "warning" | "danger" | "success"
}

const variantClasses: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "",
  warning: "border-amber-300/40",
  danger: "border-red-300/40",
  success: "border-emerald-300/40",
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const isPositiveTrend = (trend?.value ?? 0) >= 0

  return (
    <Card className={cn("shadow-xs", variantClasses[variant])}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {trend ? (
          <Badge variant="outline" className="gap-1">
            {isPositiveTrend ? (
              <TrendingUpIcon className="size-3.5" />
            ) : (
              <TrendingDownIcon className="size-3.5" />
            )}
            {Math.abs(trend.value)}% {trend.label}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  )
}
