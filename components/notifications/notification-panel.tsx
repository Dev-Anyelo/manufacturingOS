import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  BarChart3Icon,
  BellIcon,
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  CircleSlash2Icon,
  Clock3Icon,
  Package2Icon,
  ReceiptTextIcon,
  ScissorsIcon,
  TriangleAlertIcon,
  WalletIcon,
  CheckIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import type { AppNotification } from "@/stores/notificationStore"

type NotificationPanelProps = {
  items?: AppNotification[]
  onMarkAllAsRead?: () => void
  onNotificationClick?: (notification: AppNotification) => void | Promise<void>
  onClose?: () => void
}

type NotificationGroup = {
  label: string
  items: AppNotification[]
}

const configMap = {
  [NotificationType.LowStock]: {
    icon: TriangleAlertIcon,
    iconClassName: "text-amber-500",
    toneClassName: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-500/10",
  },
  [NotificationType.OutOfStock]: {
    icon: CircleSlash2Icon,
    iconClassName: "text-red-500",
    toneClassName: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-500/10",
  },
  [NotificationType.OrderReady]: {
    icon: CheckCircle2Icon,
    iconClassName: "text-emerald-500",
    toneClassName: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-500/10",
  },
  [NotificationType.OrderOverdue]: {
    icon: Clock3Icon,
    iconClassName: "text-red-500",
    toneClassName: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-500/10",
  },
  [NotificationType.SaleCompleted]: {
    icon: BadgeDollarSignIcon,
    iconClassName: "text-green-500",
    toneClassName: "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-500/10",
  },
  [NotificationType.ProductionSaved]: {
    icon: ScissorsIcon,
    iconClassName: "text-sky-500",
    toneClassName: "border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-500/10",
  },
  [NotificationType.PaymentDue]: {
    icon: WalletIcon,
    iconClassName: "text-violet-500",
    toneClassName: "border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-500/10",
  },
  [NotificationType.MonthlyReport]: {
    icon: BarChart3Icon,
    iconClassName: "text-indigo-500",
    toneClassName: "border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-500/10",
  },
  [NotificationType.InventoryUpdated]: {
    icon: Package2Icon,
    iconClassName: "text-slate-500",
    toneClassName: "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-500/10",
  },
  [NotificationType.ExpenseRecorded]: {
    icon: ReceiptTextIcon,
    iconClassName: "text-amber-600",
    toneClassName: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-500/10",
  },
  [NotificationType.OrderCancelled]: {
    icon: CircleSlash2Icon,
    iconClassName: "text-zinc-500",
    toneClassName: "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-500/10",
  },
} satisfies Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>
    iconClassName: string
    toneClassName: string
  }
>

function getActionUrl(notification: AppNotification) {
  if (!notification.metadata || typeof notification.metadata !== "object") {
    return undefined
  }

  const metadata = notification.metadata as Record<string, unknown>
  const actionUrl = metadata.actionUrl ?? metadata.actionHref

  return typeof actionUrl === "string" ? actionUrl : undefined
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

function startOfDay(value: Date) {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function getGroupLabel(createdAt: string) {
  const now = startOfDay(new Date())
  const created = startOfDay(new Date(createdAt))
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000)

  if (diffDays === 0) {
    return "Hoy"
  }

  if (diffDays === 1) {
    return "Ayer"
  }

  if (diffDays < 7) {
    return "Esta semana"
  }

  return "Anterior"
}

function groupNotifications(items: AppNotification[]) {
  const groups: NotificationGroup[] = []

  for (const item of items) {
    const label = getGroupLabel(item.createdAt)
    const lastGroup = groups[groups.length - 1]

    if (lastGroup?.label === label) {
      lastGroup.items.push(item)
      continue
    }

    groups.push({ label, items: [item] })
  }

  return groups
}

export function NotificationPanel({
  items = [],
  onMarkAllAsRead,
  onNotificationClick,
  onClose,
}: NotificationPanelProps) {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = React.useState(15)
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all")

  React.useEffect(() => {
    setVisibleCount(15)
  }, [items.length, activeTab])

  const unreadCount = items.filter((item) => !item.read).length
  const sortedItems = [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )

  const filteredItems =
    activeTab === "unread"
      ? sortedItems.filter((item) => !item.read)
      : sortedItems

  const visibleItems = filteredItems.slice(0, visibleCount)
  const groupedItems = groupNotifications(visibleItems)
  const hasMore = visibleCount < filteredItems.length

  async function handleNotificationClick(notification: AppNotification) {
    await onNotificationClick?.(notification)

    const actionUrl = getActionUrl(notification)

    if (actionUrl) {
      router.push(actionUrl)
    }

    onClose?.()
  }

  const renderNotificationList = (emptyStateMessage: string) => {
    if (filteredItems.length === 0) {
      return (
        <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BellIcon className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-foreground">Estás al día</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {emptyStateMessage}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4 p-2 sm:p-3">
        {groupedItems.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </div>

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const config = configMap[item.type]
                const actionUrl = getActionUrl(item)
                const Icon = config.icon

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      void handleNotificationClick(item)
                    }}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl p-2.5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/60 active:scale-[0.98]",
                      !item.read && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                        config.toneClassName
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.iconClassName)} />
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-tight text-foreground",
                            !item.read ? "font-semibold" : "font-medium"
                          )}
                        >
                          {item.title}
                        </p>
                        {actionUrl ? (
                          <ArrowRightIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                        ) : null}
                      </div>

                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>

                      <p className="text-[10px] font-medium text-muted-foreground/60">
                        {getRelativeTime(item.createdAt)}
                      </p>
                    </div>

                    {!item.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {hasMore && (
          <div className="pt-2 pb-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setVisibleCount((current) => current + 15)}
            >
              Cargar más notificaciones
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-[82vh] flex-col overflow-hidden bg-background sm:h-130 sm:max-h-[calc(100vh-6rem)]">
      <div className="shrink-0 space-y-3 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Notificaciones
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
              Mantente al día con las operaciones del taller.
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onMarkAllAsRead}
              className="h-8 shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/80"
            >
              <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
              Marcar todo
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "all" | "unread")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 px-4 pb-0 sm:px-5">
          <TabsList className="grid w-full grid-cols-2 p-1">
            <TabsTrigger value="all" className="text-xs">
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              No leídas
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-4 min-w-4 px-1 rounded-full text-[9px] font-bold"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className="mt-3 opacity-50" />

        <div className="relative flex-1 overflow-hidden">
          <TabsContent
            value="all"
            className="absolute inset-0 mt-0 h-full w-full data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full w-full">
              {renderNotificationList("No hay notificaciones recientes.")}
            </ScrollArea>
          </TabsContent>

          <TabsContent
            value="unread"
            className="absolute inset-0 mt-0 h-full w-full data-[state=inactive]:hidden"
          >
            <ScrollArea className="h-full w-full">
              {renderNotificationList("No tienes notificaciones sin leer.")}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

