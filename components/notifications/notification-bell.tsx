"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { BellIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { NotificationPanel } from "./notification-panel"
import { useNotificationStore } from "@/stores/notificationStore"
import type { AppNotification } from "@/stores/notificationStore"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type NotificationBellProps = {
  unreadCount?: number
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const isMobile = useIsMobile()
  const notifications = useNotificationStore((state) => state.notifications)
  const storeUnreadCount = useNotificationStore((state) => state.unreadCount)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  const unread = unreadCount ?? storeUnreadCount
  const [open, setOpen] = React.useState(false)
  const previousUnreadRef = React.useRef(unread)

  React.useEffect(() => {
    const previous = previousUnreadRef.current
    previousUnreadRef.current = unread

    if (unread > previous) {
      setOpen(true)
    }
  }, [unread])

  async function handleNotificationClick(notification: AppNotification) {
    await markAsRead(notification.id)
  }

  const triggerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-full border border-border/40 bg-background/70 text-foreground shadow-sm transition-colors hover:border-border hover:bg-background"
      aria-label="Abrir notificaciones"
    >
      <BellIcon className={cn("h-4 w-4", unread > 0 && "animate-pulse")} />
      {unread > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white shadow-sm">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Button>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="button"
              onClick={() => setOpen(true)}
              className="inline-flex"
            >
              {triggerButton}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {unread > 0
              ? `Notificaciones (${unread} sin leer)`
              : "Notificaciones"}
          </TooltipContent>
        </Tooltip>
        <SheetContent side="bottom" className="h-[82vh] rounded-t-3xl p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Notificaciones</SheetTitle>
          </SheetHeader>
          <NotificationPanel
            items={notifications}
            onMarkAllAsRead={() => void markAllAsRead()}
            onNotificationClick={(notification: AppNotification) => {
              void handleNotificationClick(notification)
            }}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {unread > 0
            ? `Notificaciones (${unread} sin leer)`
            : "Notificaciones"}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[24rem] p-0">
        <NotificationPanel
          items={notifications}
          onMarkAllAsRead={() => void markAllAsRead()}
          onNotificationClick={(notification: AppNotification) => {
            void handleNotificationClick(notification)
          }}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
