import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RealtimeBootstrap } from "@/components/providers/realtime-bootstrap"

const layoutStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await requireCurrentUser()

  return (
    <SidebarProvider style={layoutStyle}>
      <RealtimeBootstrap />
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col w-full">
          <div className="flex flex-1 flex-col gap-4 px-4 w-full md:px-6 py-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
