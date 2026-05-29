"use client"

import * as React from "react"
import { cn, formatCurrency } from "@/lib/utils"
import { Currency, Prisma } from "@prisma/client"
import { Skeleton } from "@/components/ui/skeleton"
import { useExchangeRates } from "@/hooks/use-exchange-rates"
import { useSystemSettings } from "@/hooks/use-system-settings"

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
  const { displayCurrency: globalDisplayCurrency, isLoading: settingsLoading } =
    useSystemSettings()
  const { getRate, isLoading: ratesLoading } = useExchangeRates()
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const displayCurrency = propDisplayCurrency || globalDisplayCurrency
  const recordCurrency = propCurrency || displayCurrency

  const numericAmount = Number(amount)
  const value = Number.isFinite(numericAmount) ? numericAmount : 0

  const rate = getRate(recordCurrency, displayCurrency)
  const convertedAmount = rate !== null ? value * rate : null

  const formatValue = (val: number, curr: Currency) => formatCurrency(val, curr)

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

  // The amount in the "displayCurrency"
  const mainAmount = convertedAmount !== null ? convertedAmount : value

  // The amount in the "otherCurrency"
  const otherRate = getRate(displayCurrency, otherCurrency)
  const otherAmount = otherRate !== null ? mainAmount * otherRate : null

  // Dual Display: Main (Converted/Display) + Secondary (Alternate)
  if (!isMounted || settingsLoading || ratesLoading) {
    return <Skeleton className={cn("h-8 w-24", className)} />
  }

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn(sizeClasses.main, toneClass)}>
        {formatValue(
          mainAmount,
          convertedAmount !== null ? displayCurrency : recordCurrency
        )}
      </span>
      {showDual && otherAmount !== null && (
        <span className={cn(sizeClasses.secondary, secondaryClassName)}>
          {formatValue(otherAmount, otherCurrency)}
        </span>
      )}
    </span>
  )
}
