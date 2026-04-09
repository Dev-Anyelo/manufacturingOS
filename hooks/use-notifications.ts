"use client"

import * as React from "react"

import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import { useNotificationStore } from "@/stores/notificationStore"

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]

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
