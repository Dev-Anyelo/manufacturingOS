import { Prisma } from "@prisma/client"

import { cn } from "@/lib/utils"

interface CurrencyDisplayProps {
  amount: number | string | Prisma.Decimal
  currency?: string
  size?: "sm" | "md" | "lg"
  colored?: boolean
  className?: string
}

const sizeClassMap: Record<
  NonNullable<CurrencyDisplayProps["size"]>,
  string
> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl font-semibold",
}

export function CurrencyDisplay({
  amount,
  currency = "USD",
  size = "md",
  colored = false,
  className,
}: CurrencyDisplayProps) {
  const numericAmount = Number(amount)

  const value = Number.isFinite(numericAmount) ? numericAmount : 0
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const toneClass =
    colored && value !== 0
      ? value > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400"
      : "text-foreground"

  return (
    <span className={cn(sizeClassMap[size], toneClass, className)}>
      {formatter.format(value)}
    </span>
  )
}
