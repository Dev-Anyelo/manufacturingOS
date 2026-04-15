import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RealtimeBootstrap } from "@/components/providers/realtime-bootstrap"

const layoutStyle = {
  "--sidebar-width": "15rem",
  "--header-height": "56px",
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
          <div className="content-container flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-5 xl:px-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
