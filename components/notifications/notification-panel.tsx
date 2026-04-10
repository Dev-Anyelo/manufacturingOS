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
    return <TriangleAlertIcon className="size-4 text-amber-500" />
  }

  if (
    type === NotificationType.SaleCompleted ||
    type === NotificationType.ProductionSaved
  ) {
    return <CheckCircle2Icon className="size-4 text-emerald-500" />
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
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">Notificaciones</h3>
        <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
          Marcar todo como leido
        </Button>
      </div>
      <Separator />

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
              className="rounded-md border bg-card p-3 transition-colors hover:bg-accent/30"
            >
              <div className="mb-1 flex items-center gap-2">
                {getIconByType(item.type)}
                <p className="text-sm font-medium">{item.title}</p>
                {!item.read ? <Badge variant="secondary">Nueva</Badge> : null}
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{item.body}</p>
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
