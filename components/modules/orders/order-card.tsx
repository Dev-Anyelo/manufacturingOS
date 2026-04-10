import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { OrderSummaryItem } from "@/components/modules/orders/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  MessageCircleIcon,
  ScissorsIcon,
  StoreIcon,
  UserCircle2Icon,
} from "lucide-react"

const channelLabelMap: Record<OrderSummaryItem["channel"], string> = {
  in_person: "En tienda",
  referral: "Referido",
  social_media: "Redes",
  returning_customer: "Recurrente",
  other: "Otro",
}

const channelIconMap: Record<OrderSummaryItem["channel"], ReactNode> = {
  in_person: <StoreIcon className="size-3.5" />,
  referral: <UserCircle2Icon className="size-3.5" />,
  social_media: <MessageCircleIcon className="size-3.5" />,
  returning_customer: <UserCircle2Icon className="size-3.5" />,
  other: <StoreIcon className="size-3.5" />,
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function getDeliveryTone(deliveryDate: string) {
  const now = new Date()
  const delivery = new Date(deliveryDate)
  const diff = delivery.getTime() - now.getTime()

  if (diff < 0) {
    return "text-danger"
  }

  if (diff <= 24 * 60 * 60 * 1000) {
    return "text-warning"
  }

  return "text-muted-foreground"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

interface OrderCardProps {
  order: OrderSummaryItem
  isDragging?: boolean
  className?: string
}

export function OrderCard({
  order,
  isDragging = false,
  className,
}: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`} className="block">
      <Card
        className={cn(
          "border border-border/60 bg-card py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
          isDragging && "opacity-70",
          className
        )}
      >
        <CardHeader className="gap-2 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>
                  {getInitials(order.customerName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-semibold">
                  {order.customerName}
                </CardTitle>
                <p className="truncate text-xs text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="gap-1 text-xs">
              {channelIconMap[order.channel]}
              {channelLabelMap[order.channel]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <ScissorsIcon className="size-3.5" />
              {order.garmentCount} prendas
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1",
                getDeliveryTone(order.deliveryDate)
              )}
            >
              <CalendarClockIcon className="size-3.5" />
              {formatDate(order.deliveryDate)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <CircleDollarSignIcon className="size-3.5" />
              Saldo
            </span>
            <CurrencyDisplay
              amount={order.balanceDue}
              size="sm"
              colored={order.balanceDue > 0}
              className={order.balanceDue > 0 ? "font-semibold" : ""}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
