"use client"

import * as React from "react"
import { toast } from "sonner"
import { NotificationType } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useNotificationStore } from "@/stores/notificationStore"

type InventoryPayload = {
  id: string
  name: string
  quantity: number
  minimum_stock: number
  is_active: boolean
}

export function useRealtimeInventory() {
  const queryClient = useQueryClient()
  const addNotification = useNotificationStore((state) => state.addNotification)

  React.useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
        },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ["inventory"] })

          if (
            payload.eventType !== "INSERT" &&
            payload.eventType !== "UPDATE"
          ) {
            return
          }

          const item = payload.new as InventoryPayload

          if (!item?.is_active || item.quantity > item.minimum_stock) {
            return
          }

          await addNotification(
            {
              type:
                item.quantity <= 0
                  ? NotificationType.OutOfStock
                  : NotificationType.LowStock,
              title: item.quantity <= 0 ? "Material agotado" : "Stock critico",
              body:
                item.quantity <= 0
                  ? `${item.name} se ha agotado.`
                  : `${item.name} alcanzo el umbral minimo de stock.`,
              metadata: {
                inventory_item_id: item.id,
                quantity: item.quantity,
                minimum_stock: item.minimum_stock,
              },
            },
            { persistInDatabase: false }
          )

          toast.warning(
            item.quantity <= 0
              ? `${item.name} se ha agotado.`
              : `${item.name} esta en nivel critico de stock.`
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addNotification, queryClient])
}
