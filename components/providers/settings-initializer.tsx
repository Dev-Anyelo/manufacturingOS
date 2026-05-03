"use client"

import * as React from "react"
import { useSettingsStore } from "@/stores/settingsStore"

export function SettingsInitializer() {
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const fetchExchangeRate = useSettingsStore((state) => state.fetchExchangeRate)

  React.useEffect(() => {
    fetchSettings()
    fetchExchangeRate()
  }, [fetchSettings, fetchExchangeRate])

  return null
}
