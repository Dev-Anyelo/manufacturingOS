"use client"

import { Currency } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"

export interface ExchangeRate {
  id: string
  fromCurrency: Currency
  toCurrency: Currency
  rate: string // Decimal is returned as string from API
  validFrom: string
  validTo: string | null
}

export function useExchangeRates() {
  const {
    data: rates,
    isLoading,
    error,
    refetch,
  } = useQuery<ExchangeRate[]>({
    queryKey: ["exchangeRates"],
    queryFn: async () => {
      const res = await fetch("/api/settings/exchange-rates")
      if (!res.ok) throw new Error("Failed to fetch exchange rates")
      const result = await res.json()
      return result.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const getRate = (from: Currency, to: Currency) => {
    if (from === to) return 1
    
    // Find the most recent rate for this pair
    const rate = rates?.find(
      (r) => r.fromCurrency === from && r.toCurrency === to
    )
    
    if (rate) return parseFloat(rate.rate)

    // Try inverse
    const inverse = rates?.find(
      (r) => r.fromCurrency === to && r.toCurrency === from
    )
    
    if (inverse) return 1 / parseFloat(inverse.rate)

    // Fallback hardcoded rates if DB is empty
    const FALLBACK_RATE = 36.62
    const fromStr = String(from)
    const toStr = String(to)
    const usdStr = String(Currency.USD)
    const nioStr = String(Currency.NIO)

    if (fromStr === usdStr && toStr === nioStr) return FALLBACK_RATE
    if (fromStr === nioStr && toStr === usdStr) return 1 / FALLBACK_RATE

    return null
  }

  return {
    rates,
    getRate,
    isLoading,
    error,
    refetch,
  }
}
