"use client"

import { Currency } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"

export interface SystemSettings {
  id: string
  lowStockThreshold: number
  baseCurrency: Currency
  displayCurrency: Currency
  timezone: string
  locale: string
  companyName: string
  companyPhone: string | null
  companyEmail: string | null
  companyAddress: string | null
  payrollDay: number
}

export function useSystemSettings() {
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery<SystemSettings>({
    queryKey: ["systemSettings"],
    queryFn: async () => {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const result = await res.json()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    settings,
    displayCurrency: settings?.displayCurrency ?? (Currency.USD as Currency),
    baseCurrency: settings?.baseCurrency ?? (Currency.USD as Currency),
    timezone: settings?.timezone ?? "America/Managua",
    locale: settings?.locale ?? "es-NI",
    companyName: settings?.companyName ?? "DANIELLS CONFECCIONES",
    isLoading,
    error,
    refetch,
  }
}
