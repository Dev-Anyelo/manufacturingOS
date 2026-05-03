"use client"

import { z } from "zod"
import { toast } from "sonner"
import * as React from "react"
import { useForm } from "react-hook-form"
import { Currency } from "@prisma/client"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSystemSettings } from "@/hooks/use-system-settings"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CurrencySelector } from "@/components/shared/currency-selector"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const currencySettingsSchema = z.object({
  displayCurrency: z.nativeEnum(Currency),
})

type CurrencySettingsValues = z.infer<typeof currencySettingsSchema>

export function CurrencySettingsForm() {
  const {
    settings,
    displayCurrency,
    refetch,
    isLoading: isSettingsLoading,
  } = useSystemSettings()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CurrencySettingsValues>({
    resolver: zodResolver(currencySettingsSchema),
    values: {
      displayCurrency: displayCurrency as Currency,
    },
  })

  async function onSubmit(data: CurrencySettingsValues) {
    setIsSubmitting(true)
    try {
      if (!settings) throw new Error("Settings not loaded")

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: settings.companyName,
          company_phone: settings.companyPhone,
          company_email: settings.companyEmail,
          company_address: settings.companyAddress,
          low_stock_threshold: settings.lowStockThreshold,
          base_currency: settings.baseCurrency,
          display_currency: data.displayCurrency,
          timezone: settings.timezone,
        }),
      })

      if (!res.ok) throw new Error("Failed to update settings")

      toast.success("Configuración de moneda actualizada")
      await refetch()
    } catch (error) {
      toast.error("Error al actualizar la configuración")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const selectedDisplayCurrency = form.watch("displayCurrency")
  const secondaryCurrency =
    selectedDisplayCurrency === Currency.USD ? Currency.NIO : Currency.USD

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 shadow-card">
        <CardHeader>
          <CardTitle>Monedas del Sistema</CardTitle>
          <CardDescription>
            Configura cómo se muestran los montos en toda la aplicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Moneda Principal</Label>
                <div className="flex items-center gap-3">
                  <CurrencySelector
                    value={form.watch("displayCurrency")}
                    onChange={(val) => form.setValue("displayCurrency", val)}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta moneda se mostrará como el valor principal en cards y
                  tablas.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="opacity-70">Moneda Secundaria</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {secondaryCurrency === Currency.USD
                    ? "Dólares (USD)"
                    : "Córdobas (NIO)"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se calculará automáticamente como la contraparte de la moneda
                  principal.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
              <Label className="mb-3 block text-xs font-semibold tracking-wider text-brand uppercase">
                Vista previa de visualización
              </Label>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Ejemplo de monto (65.00 USD)
                  </p>
                  <CurrencyDisplay
                    amount={65}
                    currency={Currency.USD}
                    displayCurrency={selectedDisplayCurrency}
                    showDual={true}
                    size="lg"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    form.watch("displayCurrency") === displayCurrency
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Aplicar cambios
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
