import { Separator } from "@/components/ui/separator"
import { UserRole } from "@/types"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth/current-user"
import { NotificationBell } from "@/components/notifications/notification-bell"

type SiteHeaderProps = {
  user: CurrentUser
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const roleLabel = {
    [UserRole.Admin]: "Administrador",
    [UserRole.Manager]: "Gerente",
    [UserRole.Employee]: "Empleado",
    [UserRole.Readonly]: "Solo lectura",
  }[user.role]

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border/80 bg-background/85 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 supports-backdrop-filter:bg-background/70">
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="hidden h-6 lg:inline-flex"
          />
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold sm:text-base">Taller GG</h1>
            <p className="hidden text-[11px] text-muted-foreground md:block">
              {roleLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
