"use client"

import { create } from "zustand"
import { NotificationType } from "@/types"
import { createClient } from "@/lib/supabase/client"
import type { Database, Json } from "@/lib/supabase/types"
import { createJSONStorage, persist } from "zustand/middleware"

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]

type NotificationMetadata = Json | null

export type AppNotification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  metadata: NotificationMetadata
  read: boolean
  createdAt: string
  expiresAt: string | null
}

type CreateNotificationInput = {
  type: NotificationType
  title: string
  body: string
  metadata?: NotificationMetadata
  expiresAt?: string | null
}

type AddNotificationOptions = {
  persistInDatabase?: boolean
}

interface NotificationStore {
  notifications: AppNotification[]
  unreadCount: number
  initialized: boolean
  setInitialized: (value: boolean) => void
  setNotifications: (notifications: AppNotification[]) => void
  syncFromServer: (userId: string) => Promise<void>
  addNotification: (
    input: CreateNotificationInput,
    options?: AddNotificationOptions
  ) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
  upsertFromRealtime: (row: NotificationRow) => void
  removeFromRealtime: (id: string) => void
  clear: () => void
}

function mapRowToNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    metadata: row.metadata,
    read: row.read,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

function getUnreadCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.read).length
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      initialized: false,

      setInitialized: (value) => {
        set({ initialized: value })
      },

      setNotifications: (notifications) => {
        const sorted = [...notifications].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        set({
          notifications: sorted,
          unreadCount: getUnreadCount(sorted),
        })
      },

      syncFromServer: async (userId) => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(100)

        if (error) {
          return
        }

        const notifications = (data ?? []).map(mapRowToNotification)
        get().setNotifications(notifications)
      },

      addNotification: async (input, options = { persistInDatabase: true }) => {
        const persistInDatabase = options.persistInDatabase ?? true

        if (!persistInDatabase) {
          const localNotification: AppNotification = {
            id: `local-${crypto.randomUUID()}`,
            userId: "local",
            type: input.type,
            title: input.title,
            body: input.body,
            metadata: input.metadata ?? null,
            read: false,
            createdAt: new Date().toISOString(),
            expiresAt: input.expiresAt ?? null,
          }

          const nextNotifications = [localNotification, ...get().notifications]
          set({
            notifications: nextNotifications,
            unreadCount: getUnreadCount(nextNotifications),
          })
          return
        }

        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.id) {
          return
        }

        const { data, error } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            type: input.type,
            title: input.title,
            body: input.body,
            metadata: input.metadata ?? null,
            expires_at: input.expiresAt ?? null,
            read: false,
          })
          .select("*")
          .single()

        if (error || !data) {
          return
        }

        get().upsertFromRealtime(data)
      },

      markAsRead: async (id) => {
        const supabase = createClient()

        if (!id.startsWith("local-")) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", id)
            .eq("read", false)
        }

        const nextNotifications = get().notifications.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )

        set({
          notifications: nextNotifications,
          unreadCount: getUnreadCount(nextNotifications),
        })
      },

      markAllAsRead: async () => {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user?.id) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false)
        }

        const nextNotifications = get().notifications.map((notification) => ({
          ...notification,
          read: true,
        }))

        set({
          notifications: nextNotifications,
          unreadCount: 0,
        })
      },

      removeNotification: async (id) => {
        const supabase = createClient()

        if (!id.startsWith("local-")) {
          await supabase.from("notifications").delete().eq("id", id)
        }

        get().removeFromRealtime(id)
      },

      upsertFromRealtime: (row) => {
        const mapped = mapRowToNotification(row)
        const existing = get().notifications
        const index = existing.findIndex(
          (notification) => notification.id === mapped.id
        )

        const next = [...existing]

        if (index >= 0) {
          next[index] = mapped
        } else {
          next.unshift(mapped)
        }

        next.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        set({
          notifications: next,
          unreadCount: getUnreadCount(next),
        })
      },

      removeFromRealtime: (id) => {
        const next = get().notifications.filter(
          (notification) => notification.id !== id
        )

        set({
          notifications: next,
          unreadCount: getUnreadCount(next),
        })
      },

      clear: () => {
        set({
          notifications: [],
          unreadCount: 0,
          initialized: false,
        })
      },
    }),
    {
      name: "manufacturing-os-notifications",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
)
