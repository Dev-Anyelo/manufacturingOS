"use client"

import { Badge } from "@/components/ui/badge"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { Currency } from "@prisma/client"
import { useExchangeRates } from "@/hooks/use-exchange-rates"

interface ProfitMarginIndicatorProps {
  ourPriceUnit: number | null
  ourPriceCurrency?: Currency
  estimatedCost: number | null
  estimatedCostCurrency?: Currency
}

export function ProfitMarginIndicator({
  ourPriceUnit,
  ourPriceCurrency = Currency.USD,
  estimatedCost,
  estimatedCostCurrency = Currency.USD,
}: ProfitMarginIndicatorProps) {
  const { getRate } = useExchangeRates()

  if (!ourPriceUnit || estimatedCost === null || estimatedCost === undefined) {
    return <Badge variant="outline">Sin costo base</Badge>
  }

  // Convert both to a common currency (USD) for calculation if they differ
  let normalizedPrice = ourPriceUnit
  let normalizedCost = estimatedCost

  if (ourPriceCurrency !== Currency.USD) {
    const rate = getRate(ourPriceCurrency, Currency.USD)
    if (rate !== null) normalizedPrice = ourPriceUnit * rate
  }

  if (estimatedCostCurrency !== Currency.USD) {
    const rate = getRate(estimatedCostCurrency, Currency.USD)
    if (rate !== null) normalizedCost = estimatedCost * rate
  }

  if (normalizedPrice <= 0) {
    return <Badge variant="outline">Sin precio</Badge>
  }

  const margin = ((normalizedPrice - normalizedCost) / normalizedPrice) * 100
  const rounded = Number.isFinite(margin) ? margin : 0

  if (rounded < 0) {
    return (
      <Badge className="tone-danger gap-1">
        <TrendingDownIcon className="size-3.5" />
        {rounded.toFixed(1)}%
      </Badge>
    )
  }

  return (
    <Badge className="tone-success gap-1">
      <TrendingUpIcon className="size-3.5" />
      {rounded.toFixed(1)}%
    </Badge>
  )
}
