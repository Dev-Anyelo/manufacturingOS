import Link from "next/link"
import { cn } from "@/lib/utils"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

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

  const variantStyles = {
    default: "border-border bg-card hover:border-border/80 before:bg-brand/45",
    success:
      "border-success-soft bg-card hover:border-success-soft before:bg-success",
    warning:
      "border-warning-soft bg-card hover:border-warning-soft before:bg-warning",
    danger:
      "border-danger-soft bg-card hover:border-danger-soft before:bg-danger",
    info: "border-info-soft bg-card hover:border-info-soft before:bg-info",
  } satisfies Record<NonNullable<StatCardProps["variant"]>, string>

  const iconStyles = {
    default: "text-muted-foreground/75",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    info: "text-info",
  } satisfies Record<NonNullable<StatCardProps["variant"]>, string>

  const Content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border px-5 py-4 shadow-card transition-all duration-200 ease-in-out before:absolute before:inset-x-0 before:top-0 before:h-0.5",
        variantStyles[variant],
        href && "hover:shadow-float cursor-pointer hover:-translate-y-0.5"
      )}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 size-28 rounded-full bg-brand/8 blur-2xl" />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="label-overline">{title}</h3>
        <div
          className={cn(
            "transition-colors group-hover:text-foreground/90",
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <div className="text-base md:text-lg leading-none font-bold tracking-tight text-foreground">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-muted/40" />
          ) : (
            value
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <div
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-1 text-xs leading-none font-semibold",
              isPositiveTrend ? "status-success" : "status-danger"
            )}
          >
            {isPositiveTrend ? (
              <TrendingUpIcon className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDownIcon className="mr-1 h-3 w-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground/70 text-pretty">{description}</p>
        )}
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
