import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RealtimeBootstrap } from "@/components/providers/realtime-bootstrap"

const layoutStyle = {
  "--sidebar-width": "14rem",
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
