"use client"

import * as React from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Currency } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useExchangeRates } from "@/hooks/use-exchange-rates"
import { ArrowRightIcon, Loader2, Plus, TrendingUp } from "lucide-react"
import { CurrencySelector } from "@/components/shared/currency-selector"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ExchangeRateTable() {
  const { rates, isLoading, refetch } = useExchangeRates()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state for new rate
  const [fromCurrency, setFromCurrency] = React.useState<Currency>(Currency.USD)
  const [toCurrency, setToCurrency] = React.useState<Currency>(Currency.NIO)
  const [rateValue, setRateValue] = React.useState("")

  async function handleAddRate(e: React.FormEvent) {
    e.preventDefault()
    if (!rateValue || isNaN(parseFloat(rateValue))) {
      toast.error("Ingresa una tasa válida")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/settings/exchange-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate: parseFloat(rateValue),
          valid_from: new Date().toISOString(),
        }),
      })

      if (!res.ok) throw new Error("Failed to add rate")

      toast.success("Tasa de cambio actualizada")
      setRateValue("")
      await refetch()
    } catch (error) {
      toast.error("Error al guardar la tasa")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="border border-border/70 shadow-card lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Actualizar Tasa</CardTitle>
          <CardDescription className="text-pretty">
            Establece la nueva paridad oficial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRate} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  De
                </Label>
                <CurrencySelector
                  value={fromCurrency}
                  onChange={setFromCurrency}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-center pt-6">
                <TrendingUp className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">
                  A
                </Label>
                <CurrencySelector
                  value={toCurrency}
                  onChange={setToCurrency}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="rate"
                className="text-[10px] text-muted-foreground uppercase"
              >
                Tasa de cambio
              </Label>
              <div className="relative">
                <Input
                  id="rate"
                  type="number"
                  step="0.0001"
                  placeholder="36.5000"
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  className="pl-8 font-bold"
                />
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Guardar Tasa
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Historial de Tasas</CardTitle>
          <CardDescription className="text-pretty">
            Registro de paridades anteriores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Paridad</TableHead>
                <TableHead>Tasa</TableHead>
                <TableHead>Válida desde</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay registros de tasas.
                  </TableCell>
                </TableRow>
              ) : (
                rates?.map((rate, index) => (
                  <TableRow key={rate.id}>
                    <TableCell className="pl-6 font-medium">
                      {rate.fromCurrency}{" "}
                      <ArrowRightIcon className="mx-1 inline size-4 text-muted-foreground" />{" "}
                      {rate.toCurrency}
                    </TableCell>
                    <TableCell className="font-bold tabular-nums">
                      {parseFloat(rate.rate).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(rate.validFrom), "d MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {index === 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-success/10 text-success border-success/20"
                        >
                          Vigente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="opacity-50">
                          Anterior
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
