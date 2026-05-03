import { create } from "zustand"
import { Currency } from "@prisma/client"

interface SystemSettings {
  companyName: string | null
  baseCurrency: Currency
  displayCurrency: Currency
  lowStockThreshold: number
}

interface SettingsStore {
  settings: SystemSettings | null
  exchangeRate: number
  isLoading: boolean
  fetchSettings: () => Promise<void>
  fetchExchangeRate: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  exchangeRate: 36.62, // Tasa inicial por defecto
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch("/api/settings")
      const result = await response.json()
      if (result.success) {
        set({ settings: result.data })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      set({ isLoading: false })
    }
  },

  fetchExchangeRate: async () => {
    try {
      const response = await fetch("/api/settings/exchange-rates")
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        // Obtenemos la tasa más reciente (USD -> NIO)
        const latest = result.data[0]
        set({ exchangeRate: Number(latest.rate) })
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }
  },
}))
