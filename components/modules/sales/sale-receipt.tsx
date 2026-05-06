"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTimeNI } from "@/lib/currency/exchange"
import { SaleChannel, Currency, PaymentMethod } from "@prisma/client"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { SaleReceiptData } from "@/components/modules/sales/types"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  PrinterIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
  ShareIcon,
  StoreIcon,
  SmartphoneIcon,
  ShoppingBagIcon,
  TruckIcon,
  MoreHorizontalIcon,
  BanknoteIcon,
  ArrowLeftRightIcon,
  CreditCardIcon,
  SplitIcon,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ─────────────────────────────────────────────────────────────────
interface SaleReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: SaleReceiptData | null
  onNewSale: () => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const channelConfig: Record<
  SaleChannel,
  { label: string; icon: React.ReactNode; color: string }
> = {
  in_person: {
    label: "En persona",
    icon: <StoreIcon className="size-3" />,
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  marketplace: {
    label: "Marketplace",
    icon: <ShoppingBagIcon className="size-3" />,
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  },
  order: {
    label: "Pedido",
    icon: <TruckIcon className="size-3" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <SmartphoneIcon className="size-3" />,
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
  other: {
    label: "Otro",
    icon: <MoreHorizontalIcon className="size-3" />,
    color: "bg-muted text-muted-foreground",
  },
}

const paymentConfig: Record<string, { label: string; icon: React.ReactNode }> =
  {
    cash: { label: "Efectivo", icon: <BanknoteIcon className="size-3.5" /> },
    transfer: {
      label: "Transferencia",
      icon: <ArrowLeftRightIcon className="size-3.5" />,
    },
    credit: { label: "Crédito", icon: <CreditCardIcon className="size-3.5" /> },
    mixed: { label: "Mixto", icon: <SplitIcon className="size-3.5" /> },
  }

function getChannelConfig(channel: SaleChannel) {
  return (
    channelConfig[channel] ?? {
      label: channel,
      icon: <MoreHorizontalIcon className="size-3" />,
      color: "bg-muted text-muted-foreground",
    }
  )
}

function getPaymentConfig(method: PaymentMethod) {
  return (
    paymentConfig[method] ?? {
      label: method,
      icon: <CreditCardIcon className="size-3.5" />,
    }
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function ReceiptDivider() {
  return (
    <div className="relative -mx-6 flex items-center py-1 print:hidden">
      <div className="size-4 shrink-0 rounded-full border border-border bg-muted dark:bg-background" />
      <div className="flex-1 border-t border-dashed border-border" />
      <div className="size-4 shrink-0 rounded-full border border-border bg-muted dark:bg-background" />
    </div>
  )
}

function PrintDivider() {
  return (
    <div className="relative -mx-6 hidden items-center py-1 print:flex">
      <div className="size-3 shrink-0 rounded-full border border-gray-300" />
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <div className="size-3 shrink-0 rounded-full border border-gray-300" />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function SaleReceipt({
  open,
  onOpenChange,
  receipt,
  onNewSale,
}: SaleReceiptProps) {
  if (!receipt) return null

  const channel = getChannelConfig(receipt.channel)
  const payment = getPaymentConfig(receipt.paymentMethod)
  const receiptNumber = receipt.id.slice(0, 8).toUpperCase()
  const hasDiscount = receipt.discount > 0

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Recibo #${receiptNumber}`,
        text: `Recibo de compra – ${receipt.customerName} – Total: $${receipt.total.toFixed(2)}`,
      })
    } catch {
      // share not supported or cancelled
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          "rounded-2xl border border-border bg-background text-foreground shadow-2xl",
          "sm:max-w-105",
          // Print overrides - Standardize for thermal printers (80mm)
          "print:static print:mx-auto print:block print:w-full print:max-w-[80mm] print:border-0 print:shadow-none",
          "print:bg-white print:text-black",
          "max-h-[95dvh] print:max-h-none"
        )}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <DialogHeader className="relative border-b border-border print:border-gray-200">
          {/* Background accent — hidden in print */}
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/2 print:hidden" />

          <div className="relative px-6 pt-6 pb-5">
            {/* Brand row */}
            <div className="flex flex-col items-center justify-center gap-2">
              {/* Logo / Brand */}
              <div className="space-y-0.5">
                <DialogTitle className="text-base leading-none font-bold tracking-tight">
                  DANIELLS CONFECCIONES
                </DialogTitle>
              </div>

              {/* Receipt badge */}
              <div className="shrink-0 text-center">
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 space-y-0.5">
                    <p className="font-mono text-sm font-bold tracking-wider text-muted-foreground uppercase print:text-gray-400">
                      Recibo
                    </p>
                    <p className="font-mono text-sm font-bold tracking-wider text-muted-foreground uppercase print:text-black">
                      #{receiptNumber}
                    </p>
                  </div>
                </DialogDescription>
              </div>
            </div>

            {/* Status + Channel row */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <Badge
                variant="outline"
                className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 print:border-gray-300 print:bg-transparent print:text-gray-700"
              >
                <CheckCircle2Icon className="size-3" />
                Pagado
              </Badge>

              <Badge
                variant="secondary"
                className={cn(
                  "gap-1.5 text-xs print:border print:border-gray-300 print:bg-transparent print:text-gray-600",
                  channel.color
                )}
              >
                {channel.icon}
                {channel.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ───────────────────────────────────── */}
        <ScrollArea className="flex-1 print:flex-none print:overflow-visible">
          <div className="space-y-5 px-6 py-5 print:py-4">
            {/* ── Meta grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              {/* Customer */}
              <div className="col-span-2 space-y-0.5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase print:text-gray-400">
                  Cliente
                </p>
                <p className="text-sm font-semibold text-foreground print:text-black">
                  {receipt.customerName}
                </p>
              </div>

              {/* Date */}
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase print:text-gray-400">
                  Fecha
                </p>
                <p className="text-xs leading-snug font-medium text-foreground print:text-black">
                  {formatDateTimeNI(receipt.createdAt)}
                </p>
              </div>

              {/* Payment */}
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase print:text-gray-400">
                  Pago
                </p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground print:text-black">
                  <span className="text-muted-foreground print:text-gray-500">
                    {payment.icon}
                  </span>
                  {payment.label}
                </div>
              </div>
            </div>

            <ReceiptDivider />
            <PrintDivider />

            {/* ── Items ──────────────────────────────────────────── */}
            <div className="space-y-1">
              <p className="mb-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase print:text-gray-400">
                Artículos ({receipt.items.length})
              </p>

              <div className="divide-y divide-border print:divide-gray-200">
                {receipt.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start justify-between gap-3 py-2.5",
                      idx === 0 && "pt-0",
                      idx === receipt.items.length - 1 && "pb-0"
                    )}
                  >
                    {/* Item info */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground print:text-black">
                          {item.name}
                        </p>
                        {item.size && (
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 py-0 text-[10px] font-medium print:border-gray-300 print:text-gray-600"
                          >
                            {item.size}
                          </Badge>
                        )}
                        {item.color && (
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 py-0 text-[10px] font-medium print:border-gray-300 print:text-gray-600"
                          >
                            {item.color}
                          </Badge>
                        )}
                      </div>

                      <p className="font-mono text-[11px] text-muted-foreground tabular-nums print:text-gray-500">
                        {item.quantity} ×{" "}
                        <CurrencyDisplay
                          amount={item.unitPrice}
                          currency={item.unitPriceCurrency as Currency}
                          showDual={false}
                          size="sm"
                        />
                      </p>
                    </div>

                    {/* Subtotal */}
                    <span className="shrink-0 font-mono text-sm font-bold text-foreground tabular-nums print:text-black">
                      <CurrencyDisplay
                        amount={item.subtotal}
                        currency={item.unitPriceCurrency as Currency}
                        showDual={false}
                        size="sm"
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ReceiptDivider />
            <PrintDivider />

            {/* ── Totals ─────────────────────────────────────────── */}
            <div className="space-y-2">
              {/* Subtotal row */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground print:text-gray-500">
                  Subtotal
                </span>
                <span className="font-mono text-foreground tabular-nums print:text-black">
                  <CurrencyDisplay
                    amount={receipt.subtotal}
                    currency={receipt.totalCurrency as Currency}
                    showDual={false}
                    size="sm"
                  />
                </span>
              </div>

              {/* Discount row — only shown if there's a discount */}
              {hasDiscount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground print:text-gray-500">
                    Descuento
                    <Badge className="h-4 bg-amber-100 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 print:border print:border-amber-400 print:bg-transparent print:text-amber-700">
                      −
                    </Badge>
                  </span>
                  <span className="font-mono text-amber-600 tabular-nums dark:text-amber-400 print:text-amber-700">
                    −
                    <CurrencyDisplay
                      amount={receipt.discount}
                      currency={receipt.totalCurrency as Currency}
                      showDual={false}
                      size="sm"
                    />
                  </span>
                </div>
              )}

              {/* Total row */}
              <div className="mt-3 rounded-xl bg-foreground/4 px-4 py-3 dark:bg-white/4 print:rounded-lg print:bg-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground print:text-black">
                    Total
                  </span>
                  <span className="font-mono text-xl font-bold tracking-tight text-foreground tabular-nums print:text-black">
                    <CurrencyDisplay
                      amount={receipt.total}
                      currency={receipt.totalCurrency as Currency}
                    />
                  </span>
                </div>
              </div>

              {/* Paid / Change */}
              <div className="space-y-1.5 pt-1">
                <Separator className="print:bg-gray-200" />
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground print:text-gray-500">
                      Pagado
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums print:text-black">
                      <CurrencyDisplay
                        amount={receipt.amountPaid}
                        currency={receipt.totalCurrency as Currency}
                        showDual={false}
                        size="sm"
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground print:text-gray-500">
                      Cambio
                    </span>
                    <span className="font-mono font-medium text-emerald-600 tabular-nums dark:text-emerald-400 print:text-emerald-700">
                      <CurrencyDisplay
                        amount={receipt.changeGiven}
                        currency={receipt.totalCurrency as Currency}
                        showDual={false}
                        size="sm"
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer note (print only) ────────────────────────── */}
            <div className="hidden border-t border-dashed border-gray-300 pt-4 text-center print:block">
              <p className="text-[10px] tracking-wide text-gray-400">
                ¡Gracias por su compra! • DANIELLS CONFECCIONES
              </p>
              <p className="mt-0.5 text-[9px] text-gray-300">
                #{receiptNumber} • {formatDateTimeNI(receipt.createdAt)}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* ── Footer actions ────────────────────────────────────── */}
        <DialogFooter className="border-t border-border bg-muted/40 px-6 py-4 dark:bg-muted/20 print:hidden">
          <TooltipProvider delayDuration={300}>
            <div className="flex w-full flex-col gap-2.5">
              {/* Primary row */}
              <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.print()}
                      className="w-full gap-2 font-medium"
                    >
                      <PrinterIcon className="size-3.5" />
                      Imprimir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Imprimir recibo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={onNewSale}
                      className="w-full gap-2 font-medium"
                    >
                      <RotateCcwIcon className="size-3.5" />
                      Nueva venta
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Registrar otra venta
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Secondary row — Share (native API, if available) */}
              {typeof navigator !== "undefined" && !!navigator.share && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ShareIcon className="size-3" />
                  Compartir recibo
                </Button>
              )}
            </div>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
