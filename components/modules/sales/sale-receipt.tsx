"use client"

import { Button } from "@/components/ui/button"
import { PrinterIcon, RotateCcwIcon } from "lucide-react"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { SaleReceiptData } from "@/components/modules/sales/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SaleReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: SaleReceiptData | null
  onNewSale: () => void
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit: "Credito",
  mixed: "Mixto",
}

export function SaleReceipt({
  open,
  onOpenChange,
  receipt,
  onNewSale,
}: SaleReceiptProps) {
  if (!receipt) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>Venta registrada</DialogTitle>
          <DialogDescription>
            Comparte o imprime este recibo para el cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 rounded-lg border border-border/60 bg-background p-4 print:border-0 print:p-0">
          <div className="text-center">
            <p className="text-lg font-semibold">manufacturingOS</p>
            <p className="text-xs text-muted-foreground">Recibo de venta</p>
            <p className="text-xs text-muted-foreground">
              N. {receipt.id.slice(0, 8)}
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-1 text-sm">
            <p>Cliente: {receipt.customerName}</p>
            <p>Canal: {receipt.channel}</p>
            <p>
              Metodo:{" "}
              {paymentMethodLabels[receipt.paymentMethod] ??
                receipt.paymentMethod}
            </p>
            <p>Fecha: {receipt.createdAt.toLocaleString("es-PA")}</p>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-2">
            {receipt.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x{" "}
                    <CurrencyDisplay amount={item.unitPrice} size="sm" />
                    {item.size ? ` · ${item.size}` : ""}
                  </p>
                </div>
                <CurrencyDisplay amount={item.subtotal} size="sm" />
              </div>
            ))}
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <CurrencyDisplay amount={receipt.subtotal} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span>Descuento</span>
              <CurrencyDisplay amount={receipt.discount} size="sm" />
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <CurrencyDisplay amount={receipt.total} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span>Pagado</span>
              <CurrencyDisplay amount={receipt.amountPaid} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span>Cambio</span>
              <CurrencyDisplay amount={receipt.changeGiven} size="sm" />
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
          >
            <PrinterIcon className="size-4" />
            Imprimir
          </Button>
          <Button
            type="button"
            className="bg-brand text-brand-foreground"
            onClick={onNewSale}
          >
            <RotateCcwIcon className="size-4" />
            Nueva venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
