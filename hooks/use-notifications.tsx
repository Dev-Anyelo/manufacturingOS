"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BellIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  Clock3Icon,
  Package2Icon,
  ReceiptTextIcon,
  ScissorsIcon,
  TriangleAlertIcon,
  WalletIcon,
  CircleSlash2Icon,
  BadgeDollarSignIcon,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import { NotificationType } from "@/types"
import { useNotificationStore } from "@/stores/notificationStore"

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]

function getToastIcon(type: NotificationType) {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    [NotificationType.LowStock]: <TriangleAlertIcon className="size-4" />,
    [NotificationType.OutOfStock]: <CircleSlash2Icon className="size-4" />,
    [NotificationType.OrderReady]: <CheckCircle2Icon className="size-4" />,
    [NotificationType.OrderOverdue]: <Clock3Icon className="size-4" />,
    [NotificationType.SaleCompleted]: <BadgeDollarSignIcon className="size-4" />,
    [NotificationType.ProductionSaved]: <ScissorsIcon className="size-4" />,
    [NotificationType.PaymentDue]: <WalletIcon className="size-4" />,
    [NotificationType.MonthlyReport]: <BarChart3Icon className="size-4" />,
    [NotificationType.InventoryUpdated]: <Package2Icon className="size-4" />,
    [NotificationType.ExpenseRecorded]: <ReceiptTextIcon className="size-4" />,
    [NotificationType.OrderCancelled]: <CircleSlash2Icon className="size-4" />,
  }

  return iconMap[type] ?? <BellIcon className="size-4" />
}

export function useNotifications() {
  const setInitialized = useNotificationStore((state) => state.setInitialized)
  const syncFromServer = useNotificationStore((state) => state.syncFromServer)
  const upsertFromRealtime = useNotificationStore(
    (state) => state.upsertFromRealtime
  )
  const removeFromRealtime = useNotificationStore(
    (state) => state.removeFromRealtime
  )
  const clear = useNotificationStore((state) => state.clear)

  React.useEffect(() => {
    const supabase = createClient()
    let channelName = ""

    let isMounted = true

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) {
        if (isMounted) {
          clear()
        }
        return
      }

      await syncFromServer(user.id)

      if (!isMounted) {
        return
      }

      setInitialized(true)
      channelName = `notifications:${user.id}`

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (
              payload.eventType === "INSERT" ||
              payload.eventType === "UPDATE"
            ) {
              upsertFromRealtime(payload.new as NotificationRow)

              if (payload.eventType === "INSERT") {
                const row = payload.new as NotificationRow
                const notificationType = row.type as NotificationType

                toast(row.title, {
                  description: row.body,
                  icon: getToastIcon(notificationType),
                })
              }

              return
            }

            if (payload.eventType === "DELETE") {
              const oldData = payload.old as { id?: string }
              if (oldData.id) {
                removeFromRealtime(oldData.id)
              }
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanupPromise = init()

    return () => {
      isMounted = false
      void cleanupPromise.then((cleanup) => {
        cleanup?.()
      })

      if (channelName) {
        const channel = supabase
          .getChannels()
          .find((item) => item.topic === channelName)
        if (channel) {
          supabase.removeChannel(channel)
        }
      }
    }
  }, [
    clear,
    removeFromRealtime,
    setInitialized,
    syncFromServer,
    upsertFromRealtime,
  ])
}
