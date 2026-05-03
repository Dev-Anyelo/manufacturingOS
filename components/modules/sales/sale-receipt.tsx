"use client"

import { SaleChannel } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PrinterIcon, RotateCcwIcon } from "lucide-react"
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

const channelLabel = (channel: SaleChannel | string) => {
  switch (channel) {
    case SaleChannel.in_person:
      return "En persona"
    case SaleChannel.marketplace:
      return "Marketplace"
    case SaleChannel.order:
      return "Pedido"
    case SaleChannel.whatsapp:
      return "WhatsApp"
    case SaleChannel.other:
      return "Otro"
    default:
      return channel
  }
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit: "Crédito",
  mixed: "Mixto",
}

export function SaleReceipt({
  open,
  onOpenChange,
  receipt,
  onNewSale,
}: SaleReceiptProps) {
  if (!receipt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl sm:max-w-105 print:max-h-none print:rounded-none print:border-0 print:shadow-none">
        {/* ── Header ── */}
        <DialogHeader className="relative overflow-hidden border-b border-border bg-muted/60 px-4 py-4 backdrop-blur-sm dark:bg-muted/40 print:hidden">
          <div className="relative flex items-start justify-between">
            <div className="w-full space-y-1 text-center">
              <DialogTitle className="text-base font-bold tracking-tight md:text-lg">
                manufacturingOS
              </DialogTitle>
              <DialogDescription className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                Recibo #{receipt.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="max-h-[calc(95vh-220px)] overflow-x-hidden overflow-y-auto print:max-h-none">
          <div className="space-y-4 px-4 py-4">
            {/* Meta info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[
                { label: "Cliente", value: receipt.customerName },
                { label: "Canal", value: channelLabel(receipt.channel) },
                {
                  label: "Método de pago",
                  value:
                    paymentMethodLabels[receipt.paymentMethod] ??
                    receipt.paymentMethod,
                },
                {
                  label: "Fecha",
                  value: receipt.createdAt.toLocaleString("es-NI", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }),
                },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-0.5">
                  <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </p>
                  <p className="text-[13px] leading-snug font-medium text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="-ml-6 size-3 shrink-0 rounded-full border border-border bg-muted" />
              <div className="mx-1 flex-1 border-t border-dashed border-border" />
              <div className="-mr-6 size-3 shrink-0 rounded-full border border-border bg-muted" />
            </div>

            {/* Items */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Artículos
              </p>

              {receipt.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs leading-snug font-semibold text-foreground sm:text-sm">
                      {item.name}
                    </p>

                    <p className="mt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                      {item.quantity} × ${item.unitPrice.toFixed(2)}
                      {item.size ? <span> · {item.size}</span> : null}
                    </p>
                  </div>

                  <span className="shrink-0 font-mono text-xs font-bold text-foreground tabular-nums sm:text-sm">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="-ml-6 size-3 shrink-0 rounded-full border border-border bg-muted" />
              <div className="mx-1 flex-1 border-t border-dashed border-border" />
              <div className="-mr-6 size-3 shrink-0 rounded-full border border-border bg-muted" />
            </div>

            {/* Totals */}
            <div className="space-y-2">
              {[
                { label: "Subtotal", amount: receipt.subtotal },
                { label: "Descuento", amount: receipt.discount },
              ].map(({ label, amount }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {label}
                  </span>

                  <span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              ))}

              <Separator className="my-1 bg-border" />

              {/* Total */}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-base font-bold tracking-wide text-foreground">
                  Total
                </span>

                <span className="font-mono text-base font-bold text-foreground tabular-nums">
                  ${receipt.total.toFixed(2)}
                </span>
              </div>

              {[
                { label: "Pagado", amount: receipt.amountPaid },
                { label: "Cambio", amount: receipt.changeGiven },
              ].map(({ label, amount }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {label}
                  </span>

                  <span className="font-mono text-xs text-muted-foreground tabular-nums sm:text-sm">
                    ${amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="border-t border-border bg-background px-4 py-4 print:hidden">
          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="w-full"
            >
              <PrinterIcon className="size-3.5" />
              Imprimir
            </Button>

            <Button type="button" onClick={onNewSale} className="w-full">
              <RotateCcwIcon className="size-3.5" />
              Nueva venta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

