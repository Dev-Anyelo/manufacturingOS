"use client"

import { cn } from "@/lib/utils"
import { Currency, Prisma } from "@prisma/client"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { useExchangeRates } from "@/hooks/use-exchange-rates"

interface CurrencyDisplayProps {
  amount: number | string | Prisma.Decimal
  currency?: Currency
  displayCurrency?: Currency
  showDual?: boolean
  size?: "sm" | "md" | "lg" | "kpi"
  colored?: boolean
  className?: string
  secondaryClassName?: string
}

const sizeClassMap: Record<
  NonNullable<CurrencyDisplayProps["size"]>,
  { main: string; secondary: string }
> = {
  sm: {
    main: "text-sm",
    secondary: "text-[10px] text-muted-foreground",
  },
  md: {
    main: "text-base",
    secondary: "text-xs text-muted-foreground",
  },
  lg: {
    main: "text-xl font-semibold",
    secondary: "text-sm text-muted-foreground",
  },
  kpi: {
    main: "text-3xl font-bold tabular-nums tracking-tight",
    secondary: "text-base text-muted-foreground",
  },
}

export function CurrencyDisplay({
  amount,
  currency: propCurrency,
  displayCurrency: propDisplayCurrency,
  showDual = true,
  size = "md",
  colored = false,
  className,
  secondaryClassName,
}: CurrencyDisplayProps) {
  const { displayCurrency: globalDisplayCurrency } = useSystemSettings()
  const { getRate } = useExchangeRates()

  const displayCurrency = propDisplayCurrency || globalDisplayCurrency
  const recordCurrency = propCurrency || displayCurrency

  const numericAmount = Number(amount)
  const value = Number.isFinite(numericAmount) ? numericAmount : 0

  const rate = getRate(recordCurrency, displayCurrency)
  const convertedAmount = rate !== null ? value * rate : null

  const formatter = (curr: Currency) =>
    new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const toneClass =
    colored && value !== 0
      ? value > 0
        ? "text-success"
        : "text-danger"
      : "text-foreground"

  const sizeClasses = sizeClassMap[size]

  // Determine the "other" currency for dual display
  const otherCurrency =
    displayCurrency === Currency.USD ? Currency.NIO : Currency.USD
  const otherRate = getRate(displayCurrency, otherCurrency)
  const otherAmount = (convertedAmount ?? value) * (otherRate ?? 1)

  // Dual Display: Main (Converted/Display) + Secondary (Alternate)
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn(sizeClasses.main, toneClass)}>
        {convertedAmount !== null
          ? formatter(displayCurrency).format(convertedAmount)
          : formatter(recordCurrency).format(value)}
      </span>
      {showDual && (
        <span className={cn(sizeClasses.secondary, secondaryClassName)}>
          {formatter(otherCurrency).format(otherAmount)}
        </span>
      )}
    </span>
  )
}
