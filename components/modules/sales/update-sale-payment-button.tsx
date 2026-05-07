"use client"

import * as React from "react"
import { toast } from "sonner"
import { Currency } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { useIsMobile } from "@/hooks/use-mobile"
import { Textarea } from "@/components/ui/textarea"
import { getCurrencySymbol } from "@/lib/currency/exchange"
import { useExchangeRates } from "@/hooks/use-exchange-rates"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CurrencySelector } from "@/components/shared/currency-selector"
import { CheckCircle2Icon, Loader2Icon, BanknoteIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface UpdateSalePaymentButtonProps {
  saleId: string
  balanceDue: number
  currency?: Currency
}

export function UpdateSalePaymentButton({
  saleId,
  balanceDue,
  currency = Currency.USD,
}: UpdateSalePaymentButtonProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const { getRate } = useExchangeRates()
  const [selectedCurrency, setSelectedCurrency] =
    React.useState<Currency>(currency)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form state
  const [amountPaid, setAmountPaid] = React.useState<number | "">(balanceDue)
  const [paymentMethod, setPaymentMethod] = React.useState<string>("cash")
  const [notes, setNotes] = React.useState("")

  // Handle currency change - convert balance due as suggestion
  React.useEffect(() => {
    const rate = getRate(currency, selectedCurrency)
    if (rate !== null) {
      setAmountPaid(Number((balanceDue * rate).toFixed(2)))
    }
  }, [selectedCurrency, currency, balanceDue, getRate])

  React.useEffect(() => {
    if (open) {
      setAmountPaid(balanceDue)
      setPaymentMethod("cash")
      setNotes("")
    }
  }, [open, balanceDue])

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()

    const parsedAmount = Number(amountPaid)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("El monto debe ser mayor a cero.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/sales/${saleId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount_paid: parsedAmount,
          payment_currency: selectedCurrency,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        }),
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo actualizar el pago.")
      }

      await revalidatePaths(["/sales", `/sales/${saleId}`, "/reports", "/"])
      toast.success("Pago registrado correctamente.")
      setOpen(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el pago."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const content = (
    <>
      <div className="shrink-0 border-b border-border/70 bg-muted/10 px-4 py-4 text-left">
        <h2 className="flex items-center gap-2 text-base font-semibold text-pretty">
          <BanknoteIcon className="size-4 text-emerald-500" />
          Registrar pago
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          Saldo pendiente:{" "}
          <strong className="text-foreground">
            <CurrencyDisplay amount={balanceDue} currency={currency} />
          </strong>
        </p>
      </div>

      <form
        onSubmit={handleConfirm}
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Monto recibido</Label>
            <div className="flex gap-2">
              <CurrencySelector
                value={selectedCurrency}
                onChange={setSelectedCurrency}
                className="w-25"
              />
              <div className="relative flex-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 font-medium text-muted-foreground">
                  {getCurrencySymbol(selectedCurrency)}
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) =>
                    setAmountPaid(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            {(() => {
              const rateToSaleCurrency = getRate(selectedCurrency, currency)
              if (rateToSaleCurrency === null) return null

              const amountInSaleCurrency =
                Number(amountPaid) * rateToSaleCurrency
              const changeInSaleCurrency = amountInSaleCurrency - balanceDue

              if (changeInSaleCurrency > 0.01) {
                return (
                  <p className="text-xs font-medium text-muted-foreground">
                    Cambio a devolver:{" "}
                    <CurrencyDisplay
                      amount={changeInSaleCurrency}
                      currency={currency}
                      size="sm"
                    />
                  </p>
                )
              }
              return null
            })()}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Metodo de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar metodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="credit">Credito</SelectItem>
                <SelectItem value="mixed">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referencia de transaccion o detalles..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border/70 p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2Icon className="mr-1.5 size-4 animate-spin" />
            ) : (
              <CheckCircle2Icon className="mr-1.5 size-4" />
            )}
            Confirmar pago
          </Button>
        </div>
      </form>
    </>
  )

  const triggerBtn = (
    <Button type="button" variant="outline" size="sm">
      <CheckCircle2Icon className="mr-1.5 size-4" />
      Registrar pago
    </Button>
  )

  if (!isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{triggerBtn}</SheetTrigger>
        <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Registrar pago</SheetTitle>
          <SheetDescription className="sr-only">
            Registra un abono o pago total a esta venta
          </SheetDescription>
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{triggerBtn}</DrawerTrigger>
      <DrawerContent className="gap-0 overflow-hidden p-0">
        <DrawerTitle className="sr-only">Registrar pago</DrawerTitle>
        <DrawerDescription className="sr-only">
          Registra un abono o pago total a esta venta
        </DrawerDescription>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
