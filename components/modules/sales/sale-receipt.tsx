"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTimeNI } from "@/lib/currency/exchange"
import { SaleChannel, PaymentMethod } from "@prisma/client"
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

// ─── Constants ──────────────────────────────────────────────────────────────
const COMPANY = {
  name: "DANIELLS CONFECCIONES",
  phones: ["+505 8215 1882", "+1 (510) 880-9097"],
} as const

// ─── Types ──────────────────────────────────────────────────────────────────
interface SaleReceiptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: SaleReceiptData | null
  onNewSale: () => void
}

// ─── Config maps ────────────────────────────────────────────────────────────
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

const paymentConfig: Record<
  PaymentMethod,
  { label: string; icon: React.ReactNode }
> = {
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

// ─── Sub-components ─────────────────────────────────────────────────────────

/**
 * MetaField — small label / value block used in the meta grid.
 * Keeps every "data point" of the receipt aligned consistently.
 */
function MetaField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase print:text-gray-500">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground print:text-black">
        {children}
      </div>
    </div>
  )
}

/**
 * Ticket-style divider with rounded "cut-outs" on each side.
 * Used between the receipt sections to keep that POS / paper-ticket feel.
 */
function ReceiptDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative -mx-6 flex items-center print:hidden", className)}
    >
      <div className="size-4 shrink-0 rounded-full border border-border bg-muted dark:bg-background" />
      <div className="flex-1 border-t border-dashed border-border" />
      <div className="size-4 shrink-0 rounded-full border border-border bg-muted dark:bg-background" />
    </div>
  )
}

/**
 * Print-only divider — simpler, grayscale, no rounded cut-outs because
 * those don't translate well to physical paper.
 */
function PrintDivider() {
  return (
    <div
      aria-hidden
      className="my-3 hidden border-t border-dashed border-gray-300 print:block"
    />
  )
}

/**
 * Compact, accessible list of the workshop phone numbers.
 * Reused in header (subtle) and footer (printable).
 */
function PhoneList({
  className,
  itemClassName,
}: {
  className?: string
  itemClassName?: string
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1",
        className
      )}
    >
      {COMPANY.phones.map((phone) => (
        <li key={phone}>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className={cn(
              "inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground print:text-gray-700 last:text-red-300",
              itemClassName
            )}
          >
            <span className="tabular-nums">{phone}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
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
  const formattedDate = formatDateTimeNI(receipt.createdAt)
  const itemCount = receipt.items.reduce((sum, i) => sum + i.quantity, 0)

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print()
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Recibo #${receiptNumber}`,
        text: `Recibo de compra – ${receipt.customerName} – Total: ${receipt.total.toFixed(
          2
        )} ${receipt.totalCurrency}`,
      })
    } catch {
      /* share not supported or cancelled */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // ── Layout ─────────────────────────────────────────────
          "flex flex-col gap-0 overflow-hidden p-0",
          "rounded-2xl border border-border bg-background text-foreground shadow-2xl",
          "w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-md",
          "max-h-[min(92dvh,820px)]",
          // ── Print: behave like an 80mm thermal ticket ──────────
          "print:static! print:m-0! print:mx-auto print:block!",
          "print:max-h-none! print:w-full! print:max-w-[80mm]!",
          "print:rounded-none! print:border-0! print:shadow-none!",
          "print:bg-white! print:text-black!",
          "print:overflow-visible!"
        )}
      >
        {/* ── Accessible labels (visually hidden) ──────────────── */}
        <DialogTitle className="sr-only">
          Recibo #{receiptNumber} — {COMPANY.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Recibo de venta para {receipt.customerName} por un total de{" "}
          {receipt.total} {receipt.totalCurrency}.
        </DialogDescription>

        {/* ─────────────────────────────────────────────────────────
            HEADER — fixed (never scrolls).
            ───────────────────────────────────────────────────────── */}
        <DialogHeader
          className={cn(
            "shrink-0 space-y-0 border-b border-border px-6 pt-6 pb-5",
            "relative",
            "print:border-gray-200 print:px-4 print:pt-4 print:pb-3"
          )}
        >
          {/* Subtle background accent — hidden in print */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/2 print:hidden"
          />

          <div className="relative flex flex-col items-center gap-2 text-center">
            <h2 className="text-base leading-none font-bold tracking-tight text-foreground print:text-black">
              {COMPANY.name}
            </h2>

            <p className="font-mono text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase print:text-black">
              Recibo{" "}
              <span className="text-foreground print:text-black">
                #{receiptNumber}
              </span>
            </p>

            <PhoneList className="justify-center" />

            {/* Status + Channel pills */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5 border-emerald-200 bg-emerald-50 font-medium text-emerald-700",
                  "dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400",
                  "print:border-gray-400! print:bg-transparent! print:text-black!"
                )}
              >
                <CheckCircle2Icon className="size-3" />
                Pagado
              </Badge>

              <Badge
                variant="secondary"
                className={cn(
                  "gap-1.5 text-xs font-medium",
                  channel.color,
                  "print:border! print:border-gray-400! print:bg-transparent! print:text-black!"
                )}
              >
                {channel.icon}
                {channel.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* ─────────────────────────────────────────────────────────
            BODY — scrolls when content is long.
            ───────────────────────────────────────────────────────── */}
        <ScrollArea
          className={cn(
            "min-h-0 flex-1",
            "print:h-auto! print:max-h-none! print:overflow-visible!"
          )}
        >
          <div
            className={cn(
              "space-y-5 px-6 py-5",
              "print:space-y-3 print:px-4 print:py-3"
            )}
          >
            {/* ── Customer + Meta grid ─────────────────────────── */}
            <section
              aria-label="Detalles de la transacción"
              className="space-y-4"
            >
              <MetaField label="Cliente">
                <p className="truncate text-sm font-semibold text-foreground print:text-black">
                  {receipt.customerName}
                </p>
              </MetaField>

              <div className="grid grid-cols-2 gap-4">
                <MetaField label="Fecha">
                  <p className="text-xs leading-snug font-medium text-foreground print:text-black">
                    {formattedDate}
                  </p>
                </MetaField>

                <MetaField label="Pago">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground print:text-black">
                    <span className="text-muted-foreground print:text-gray-500">
                      {payment.icon}
                    </span>
                    {payment.label}
                  </span>
                </MetaField>
              </div>
            </section>

            <ReceiptDivider />
            <PrintDivider />

            {/* ── Items list ───────────────────────────────────── */}
            <section aria-label="Artículos comprados" className="space-y-2">
              <div className="flex items-end justify-between">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase print:text-gray-500">
                  Artículos ({receipt.items.length})
                </p>
                <p className="font-mono text-[10px] text-muted-foreground tabular-nums print:text-gray-500">
                  {itemCount} unid.
                </p>
              </div>

              <ul
                className={cn(
                  "divide-y divide-border",
                  "print:divide-gray-200!"
                )}
              >
                {receipt.items.map((item, idx) => (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-start justify-between gap-3 py-2.5",
                      idx === 0 && "pt-0",
                      idx === receipt.items.length - 1 && "pb-0",
                      "print:py-2!"
                    )}
                  >
                    {/* Description */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="min-w-0 truncate text-sm font-semibold text-foreground print:text-black">
                          {item.name}
                        </p>
                        {item.size && (
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 px-1 py-0 text-[10px] font-medium print:border-gray-300! print:text-gray-700!"
                          >
                            {item.size}
                          </Badge>
                        )}
                        {item.color && (
                          <Badge
                            variant="outline"
                            className="h-4 shrink-0 px-1 py-0 text-[10px] font-medium print:border-gray-300! print:text-gray-700!"
                          >
                            {item.color}
                          </Badge>
                        )}
                      </div>

                      <p className="font-mono text-[11px] text-muted-foreground tabular-nums print:text-gray-600">
                        {item.quantity} ×{" "}
                        <CurrencyDisplay
                          amount={item.unitPrice}
                          currency={item.unitPriceCurrency}
                          showDual={false}
                          size="sm"
                        />
                      </p>
                    </div>

                    {/* Subtotal */}
                    <span className="shrink-0 self-center font-mono text-sm font-bold text-foreground tabular-nums print:text-black">
                      <CurrencyDisplay
                        amount={item.subtotal}
                        currency={item.unitPriceCurrency}
                        showDual={false}
                        size="sm"
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <ReceiptDivider />
            <PrintDivider />

            {/* ── Totals ───────────────────────────────────────── */}
            <section aria-label="Resumen de totales" className="space-y-2">
              <dl className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground print:text-gray-700">
                    Subtotal
                  </dt>
                  <dd className="font-mono text-foreground tabular-nums print:text-black">
                    <CurrencyDisplay
                      amount={receipt.subtotal}
                      currency={receipt.totalCurrency}
                      showDual={false}
                      size="sm"
                    />
                  </dd>
                </div>

                {hasDiscount && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="flex items-center gap-1.5 text-muted-foreground print:text-gray-700">
                      Descuento
                      <Badge
                        variant="outline"
                        className="h-4 border-amber-300 bg-amber-50 px-1 text-[10px] font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 print:border-gray-400! print:bg-transparent! print:text-black!"
                      >
                        −
                      </Badge>
                    </dt>
                    <dd className="font-mono text-amber-600 tabular-nums dark:text-amber-400 print:text-black">
                      −
                      <CurrencyDisplay
                        amount={receipt.discount}
                        currency={receipt.totalCurrency}
                        showDual={false}
                        size="sm"
                      />
                    </dd>
                  </div>
                )}
              </dl>

              {/* Highlighted total card */}
              <div
                className={cn(
                  "mt-3 rounded-xl bg-foreground/5 px-4 py-3",
                  "dark:bg-white/4",
                  "print:rounded-md! print:bg-gray-100! print:px-3! print:py-2!"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-base font-bold text-foreground print:text-black">
                    Total
                  </span>
                  <span className="text-right font-mono text-xl leading-none font-bold tracking-tight text-foreground tabular-nums print:text-black">
                    <CurrencyDisplay
                      amount={receipt.total}
                      currency={receipt.totalCurrency}
                    />
                  </span>
                </div>
              </div>

              <Separator className="my-3 print:bg-gray-300!" />

              <dl className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground print:text-gray-700">
                    Pagado
                  </dt>
                  <dd className="font-mono font-medium text-foreground tabular-nums print:text-black">
                    <CurrencyDisplay
                      amount={receipt.amountPaid}
                      currency={receipt.totalCurrency}
                      showDual={false}
                      size="sm"
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground print:text-gray-700">
                    Cambio
                  </dt>
                  <dd
                    className={cn(
                      "font-mono font-semibold tabular-nums",
                      "text-emerald-600 dark:text-emerald-400",
                      "print:text-black!"
                    )}
                  >
                    <CurrencyDisplay
                      amount={receipt.changeGiven}
                      currency={receipt.totalCurrency}
                      showDual={false}
                      size="sm"
                    />
                  </dd>
                </div>
              </dl>
            </section>

            {/* ── Optional notes ──────────────────────────────── */}
            {receipt.notes && (
              <>
                <ReceiptDivider />
                <PrintDivider />
                <section aria-label="Notas" className="space-y-1.5">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase print:text-gray-500">
                    Notas
                  </p>
                  <p className="text-xs leading-relaxed text-foreground print:text-black">
                    {receipt.notes}
                  </p>
                </section>
              </>
            )}

            {/* ── Print-only footer ───────────────────────────── */}
            <div className="hidden border-t border-dashed border-gray-300 pt-3 text-center print:block">
              <p className="text-[11px] font-semibold tracking-wide text-gray-700">
                ¡Gracias por su compra!
              </p>
              <p className="mt-1 text-[10px] text-gray-600">
                Para soporte o cambios, contáctanos:
              </p>
              <PhoneList className="mt-1.5 justify-center" />
              <p className="mt-2 font-mono text-[9px] tracking-wider text-gray-500 uppercase">
                #{receiptNumber} · {formattedDate}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* ─────────────────────────────────────────────────────────
            FOOTER — fixed at the bottom (shrink-0).
            ───────────────────────────────────────────────────────── */}
        <DialogFooter
          className={cn(
            "shrink-0 flex-col gap-3 border-t border-border bg-muted/40 px-6 py-4",
            "dark:bg-muted/20",
            "sm:flex-col sm:items-stretch sm:space-x-0",
            "print:hidden"
          )}
        >
          <TooltipProvider delayDuration={300}>
            <div className="flex w-full flex-col gap-2">
              {/* Primary actions */}
              <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrint}
                      className="w-full gap-2 font-medium"
                    >
                      <PrinterIcon className="size-3.5" />
                      Imprimir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Imprimir recibo (Ctrl/⌘ + P)
                  </TooltipContent>
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

              {/* Secondary action — share */}
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
