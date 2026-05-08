import type { CSSProperties } from "react"
import { hasPermission } from "@/lib/permissions"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RealtimeBootstrap } from "@/components/providers/realtime-bootstrap"
import { SettingsInitializer } from "@/components/providers/settings-initializer"

import {
  dashboardNavSections,
  DashboardNavSection,
} from "@/lib/nav/dashboard-links"

const layoutStyle = {
  "--sidebar-width": "16.5rem",
  "--header-height": "60px",
} as CSSProperties

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireCurrentUser()

  let pendingLeavesCount = 0
  if (user.role === "admin" || user.role === "manager") {
    const { prisma } = await import("@/lib/prisma")
    pendingLeavesCount = await prisma.leaveRequest.count({
      where: { status: "pending" },
    })
  }

  const filteredSections: DashboardNavSection[] = []

  for (const section of dashboardNavSections) {
    const validItems = []
    for (const item of section.items) {
      if (!item.module) {
        validItems.push(item)
        continue
      }

      const hasAccess = await hasPermission(user.id, item.module, "view")
      if (hasAccess) {
        let modifiedItem = { ...item }
        if (modifiedItem.url === "/attendance") {
          if (user.role === "employee") {
            modifiedItem.title = "Mi Asistencia"
          } else {
            modifiedItem.badge = pendingLeavesCount
          }
        }
        validItems.push(modifiedItem)
      }
    }

    if (validItems.length > 0) {
      filteredSections.push({
        ...section,
        items: validItems,
      })
    }
  }

  return (
    <SidebarProvider style={layoutStyle}>
      <RealtimeBootstrap />
      <SettingsInitializer />
      <AppSidebar variant="inset" user={user} sections={filteredSections} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="relative flex w-full flex-1 flex-col overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklab,var(--color-brand)_12%,transparent),transparent_52%),radial-gradient(circle_at_88%_0%,color-mix(in_oklab,var(--color-info)_10%,transparent),transparent_48%)]"
          />
          <div className="content-container relative z-10 flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
