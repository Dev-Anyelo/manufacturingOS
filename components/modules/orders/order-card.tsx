import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import type { OrderSummaryItem } from "@/components/modules/orders/types"

import {
  channelIconMap,
  channelLabelMap,
  cn,
  formatCurrency,
  formatDate,
  isOverdue,
  statusConfig,
} from "@/lib/utils"

import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ScissorsIcon,
} from "lucide-react"

interface OrderCardProps {
  order: OrderSummaryItem
  isDragging?: boolean
  className?: string
}

export function OrderCard({ order, isDragging, className }: OrderCardProps) {
  const overdue = isOverdue(order)
  const cfg = statusConfig[order.status]
  const balance = order.balanceDue
  const paidPercent =
    order.total > 0
      ? Math.min(((order.total - balance) / order.total) * 100, 100)
      : 0

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-muted/20",
        "transition-all duration-150",
        isDragging
          ? "scale-105 rotate-2 border-primary opacity-95 shadow-xl ring-1 ring-primary"
          : "hover:-translate-y-px hover:border-border/80 hover:shadow-md",
        overdue &&
          "border-red-500/40 bg-red-500/5 dark:border-red-500/35 dark:bg-red-950/25",
        className
      )}
    >
      {/* Overdue ribbon */}
      {overdue ? (
        <Badge
          className="absolute -top-1.5 -right-1.5 z-10 inline-flex animate-pulse items-center gap-1 border border-red-600/30 bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white uppercase shadow-md dark:bg-red-500"
          variant="destructive"
        >
          <AlertTriangleIcon className="size-2.5 shrink-0" />
          ATRASADO
        </Badge>
      ) : null}

      <div className="p-3">
        {/* Header: customer + ID */}
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-semibold">
              {order.customerName}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <StatusBadge status={order.status} type="work-order" />
          </div>
        </div>

        {/* Meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="size-3" />
            {formatDate(order.deliveryDate)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ScissorsIcon className="size-3" />
            {order.garmentCount} prenda{order.garmentCount !== 1 ? "s" : ""}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
              "border-border bg-muted/20 text-muted-foreground"
            )}
          >
            {channelIconMap[order.channel]}
            {channelLabelMap[order.channel]}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-border" />

        {/* Footer: balance + action */}
        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground/60">Saldo pendiente</p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                balance > 0 ? "text-danger" : "text-success"
              )}
            >
              {formatCurrency(balance)}
            </p>
            <div className="mt-1 h-1 w-22 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 min-h-10 gap-1 rounded-lg px-3 text-xs font-medium sm:h-8 sm:min-h-8"
          >
            <Link href={`/orders/${order.id}`}>
              Ver detalle
              <ArrowUpRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Subtle left accent border per status */}
      <div
        className={cn("absolute inset-y-0 left-0 w-0.5 rounded-full", cfg.dot)}
      />
    </div>
  )
}
