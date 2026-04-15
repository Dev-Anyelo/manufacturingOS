import Link from "next/link"
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
  CalendarIcon,
  ChevronRightIcon,
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

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-muted/20",
        "transition-all duration-150",
        isDragging
          ? "scale-105 rotate-2 border-brand opacity-95 shadow-xl ring-1 ring-brand"
          : "hover:-translate-y-px hover:shadow-md hover:border-border/80",
        overdue &&
          "border-warning bg-warning-soft",
        className
      )}
    >
      {/* Overdue ribbon */}
      {overdue && (
        <div className="absolute -top-px -right-px flex items-center gap-1 rounded-tr-xl rounded-bl-lg bg-warning px-2 py-0.5 text-xs font-bold tracking-wider text-black uppercase shadow-sm">
          <AlertTriangleIcon className="size-2.5" />
          Atrasado
        </div>
      )}

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
            <p className="text-xs text-muted-foreground/60">
              Saldo pendiente
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                balance > 0
                  ? "text-danger"
                  : "text-success"
              )}
            >
              {formatCurrency(balance)}
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-lg px-2 text-xs font-medium"
          >
            <Link href={`/orders/${order.id}`}>
              Ver detalle
              <ChevronRightIcon className="size-3" />
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
