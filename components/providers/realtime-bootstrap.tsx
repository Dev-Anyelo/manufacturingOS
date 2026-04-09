"use client"

import { useNotifications } from "@/hooks/use-notifications"
import { useRealtimeInventory } from "@/hooks/use-realtime-inventory"

export function RealtimeBootstrap() {
  useNotifications()
  useRealtimeInventory()

  return null
}
