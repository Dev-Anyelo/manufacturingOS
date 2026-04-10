"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { BellIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNotificationStore } from "@/stores/notificationStore"
import { NotificationPanel } from "@/components/notifications/notification-panel"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NotificationBellProps = {
  unreadCount?: number
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  const notifications = useNotificationStore((state) => state.notifications)
  const storeUnreadCount = useNotificationStore((state) => state.unreadCount)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)

  const unread = unreadCount ?? storeUnreadCount
  const [pulse, setPulse] = React.useState(false)
  const previousUnreadRef = React.useRef(unread)

  React.useEffect(() => {
    const previous = previousUnreadRef.current
    previousUnreadRef.current = unread

    if (unread > previous) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 800)
      return () => clearTimeout(timeout)
    }
  }, [unread])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Abrir notificaciones"
        >
          <BellIcon className={cn("size-4", pulse && "animate-pulse")} />
          {unread > 0 ? (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Centro de notificaciones</SheetTitle>
        </SheetHeader>
        <div className="mt-4 h-[calc(100%-3rem)]">
          <NotificationPanel
            items={notifications}
            onMarkAllAsRead={() => void markAllAsRead()}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
