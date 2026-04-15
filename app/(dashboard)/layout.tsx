import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RealtimeBootstrap } from "@/components/providers/realtime-bootstrap"

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

  return (
    <SidebarProvider style={layoutStyle}>
      <RealtimeBootstrap />
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex w-full flex-1 flex-col">
          <div className="content-container flex flex-1 flex-col gap-6 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
