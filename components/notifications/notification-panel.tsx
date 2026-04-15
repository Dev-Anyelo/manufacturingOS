import Link from "next/link"
import { NotificationType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { AppNotification } from "@/stores/notificationStore"

import {
  BellIcon,
  CheckCircle2Icon,
  Clock3Icon,
  PackageIcon,
  TriangleAlertIcon,
} from "lucide-react"

type NotificationPanelProps = {
  items?: AppNotification[]
  onMarkAllAsRead?: () => void
}

const defaultItems: AppNotification[] = [
  {
    id: "1",
    userId: "local",
    type: NotificationType.LowStock,
    title: "Stock critico",
    body: "La tela Denim Azul quedo por debajo del minimo.",
    metadata: {
      actionHref: "/inventory",
    },
    read: false,
    createdAt: new Date().toISOString(),
    expiresAt: null,
  },
]

function getIconByType(type: NotificationType) {
  if (
    type === NotificationType.LowStock ||
    type === NotificationType.OutOfStock
  ) {
    return <TriangleAlertIcon className="text-warning size-4" />
  }

  if (
    type === NotificationType.SaleCompleted ||
    type === NotificationType.ProductionSaved
  ) {
    return <CheckCircle2Icon className="text-success size-4" />
  }

  return <PackageIcon className="size-4 text-primary" />
}

function getRelativeTime(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) {
    return "Ahora"
  }

  if (diffMinutes < 60) {
    return `Hace ${diffMinutes} min`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `Hace ${diffHours} h`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `Hace ${diffDays} d`
}

export function NotificationPanel({
  items = defaultItems,
  onMarkAllAsRead,
}: NotificationPanelProps) {
  const unreadCount = items.filter((item) => !item.read).length
  const readCount = items.length - unreadCount

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/95">
      <div className="space-y-3 border-b border-border/60 bg-muted/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Notificaciones</h3>
          <Badge variant="outline" className="text-xs">
            {unreadCount} pendientes
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{items.length}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Sin leer</p>
            <p className="text-sm font-semibold">{unreadCount}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">Leidas</p>
            <p className="text-sm font-semibold">{readCount}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="w-full"
        >
          Marcar todo como leido
        </Button>
      </div>

      <Separator className="opacity-60" />

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <BellIcon className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No hay notificaciones</p>
          <p className="text-xs text-muted-foreground">
            Cuando ocurra algo importante, aparecera aqui.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-border/60 bg-card p-3 transition-colors hover:bg-accent/30"
            >
              <div className="mb-1 flex items-center gap-2">
                {getIconByType(item.type)}
                <p className="text-sm font-medium">{item.title}</p>
                {!item.read ? (
                  <Badge variant="secondary" className="ml-auto text-[11px]">
                    Nueva
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto text-[11px]">
                    Leida
                  </Badge>
                )}
              </div>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3Icon className="size-3" />
                  <span>{getRelativeTime(item.createdAt)}</span>
                </div>
                {typeof item.metadata === "object" &&
                item.metadata &&
                "actionHref" in item.metadata &&
                typeof item.metadata.actionHref === "string" ? (
                  <Link
                    href={item.metadata.actionHref}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Ver detalle
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
