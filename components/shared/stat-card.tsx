import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Currency } from "@prisma/client"
import { CurrencyDisplay } from "@/components/shared/currency-display"

interface StatCardProps {
  title: string
  value: ReactNode
  currency?: Currency
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
  currency,
  description,
  icon,
  trend,
  variant = "default",
  isLoading = false,
  href,
}: StatCardProps) {
  const renderedValue =
    typeof value === "number" && currency ? (
      <CurrencyDisplay amount={value} currency={currency} />
    ) : (
      value
    )

  const Content = (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/30",
        href && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5",
          iconWrapStyles[variant]
        )}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="mb-1 truncate text-[10px] leading-none font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </p>
        <div
          className={cn(
            "truncate text-lg leading-none font-bold tabular-nums",
            !isLoading && valueToneStyles[variant]
          )}
        >
          {isLoading ? (
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : (
            renderedValue
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
