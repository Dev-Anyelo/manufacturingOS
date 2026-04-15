import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { OrderSummaryItem } from "@/components/modules/orders/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  GripVerticalIcon,
  MessageCircleIcon,
  ScissorsIcon,
  StoreIcon,
  UserCircle2Icon,
} from "lucide-react"

const channelLabelMap: Record<OrderSummaryItem["channel"], string> = {
  in_person: "Tienda",
  referral: "Referido",
  social_media: "Redes",
  returning_customer: "Recurrente",
  other: "Otro",
}

const channelIconMap: Record<OrderSummaryItem["channel"], ReactNode> = {
  in_person: <StoreIcon className="size-3" />,
  referral: <UserCircle2Icon className="size-3" />,
  social_media: <MessageCircleIcon className="size-3" />,
  returning_customer: <UserCircle2Icon className="size-3" />,
  other: <StoreIcon className="size-3" />,
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getUrgency(deliveryDate: string) {
  const now = new Date()
  const delivery = new Date(deliveryDate)
  const diff = delivery.getTime() - now.getTime()
  return {
    isOverdue: diff < 0,
    isUrgent: diff >= 0 && diff <= 24 * 60 * 60 * 1000,
    diff,
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value))
}

interface OrderCardProps {
  order: OrderSummaryItem
  isDragging?: boolean
  className?: string
}

export function OrderCard({ order, isDragging = false, className }: OrderCardProps) {
  const { isOverdue, isUrgent } = getUrgency(order.deliveryDate)

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block"
      aria-label={`Ver pedido ${order.id.slice(0, 8)} de ${order.customerName}`}
    >
      <Card
        className={cn(
          "group relative border border-border/50 bg-card shadow-sm transition-all duration-150",
          "hover:-translate-y-0.5 hover:border-border hover:shadow-md cursor-pointer",
          isDragging && "scale-[1.02] rotate-1 opacity-90 shadow-xl",
          // Priority left border accent
          isOverdue
            ? "border-l-2 border-l-red-500"
            : isUrgent
            ? "border-l-2 border-l-amber-500"
            : "",
          className
        )}
      >
        {/* Drag handle */}
        <div className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
          <GripVerticalIcon className="size-3.5 text-muted-foreground" />
        </div>

        <CardHeader className="p-3 pb-2 gap-2">
          <div className="flex items-start gap-2 pr-4">
            <Avatar className="size-7 flex-shrink-0">
              <AvatarFallback className="bg-brand-muted text-brand text-[10px] font-semibold">
                {getInitials(order.customerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight">
                {order.customerName}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                #{order.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Status badges row */}
          <div className="flex flex-wrap items-center gap-1">
            {isOverdue ? (
              <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                Vencido
              </Badge>
            ) : null}
            {isUrgent ? (
              <Badge className="bg-amber-500 text-[9px] h-4 px-1.5 text-white">
                Urgente
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className="gap-1 text-[9px] h-4 px-1.5 text-muted-foreground"
            >
              {channelIconMap[order.channel]}
              {channelLabelMap[order.channel]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-3 space-y-2">
          <Separator className="opacity-40" />

          <div className="flex items-center justify-between text-[10px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <ScissorsIcon className="size-3" />
              {order.garmentCount} prendas
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                isOverdue
                  ? "text-danger"
                  : isUrgent
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              <CalendarClockIcon className="size-3" />
              {formatDate(order.deliveryDate)}
            </span>
          </div>

          {order.balanceDue > 0 ? (
            <div className="flex items-center justify-between rounded-md bg-warning-soft border border-warning-soft px-2 py-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <CircleDollarSignIcon className="size-3" />
                Saldo
              </span>
              <span className="text-xs font-bold text-warning tabular-nums">
                <CurrencyDisplay amount={order.balanceDue} size="sm" />
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px]">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <CircleDollarSignIcon className="size-3" />
                Saldo
              </span>
              <span className="text-success font-medium text-[10px]">
                Pagado
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
