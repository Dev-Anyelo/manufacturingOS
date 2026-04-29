import { UserRole } from "@/types"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth/current-user"
import { CalendarDaysIcon, ShieldCheckIcon } from "lucide-react"
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

  const todayLabel = new Intl.DateTimeFormat("es-PA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date())

  return (
    <header className="sticky top-0 z-40 flex h-15 shrink-0 items-center gap-2 border-b border-border/80 bg-background/88 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-15 supports-backdrop-filter:bg-background/70">
      <div className="flex w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="hidden h-6 lg:inline-flex"
          />
          <div className="min-w-0 space-y-0.5">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              Centro de operaciones
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground md:block">
              manufacturingOS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground md:inline-flex">
            <CalendarDaysIcon className="size-3.5" />
            <span className="capitalize">{todayLabel}</span>
          </div>
          <div className="hidden items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/8 px-2.5 py-1 text-[11px] text-brand lg:inline-flex">
            <ShieldCheckIcon className="size-3.5" />
            <span>{roleLabel}</span>
          </div>
          <NotificationBell />
        </div>
      </div>
    </header>
  )
}
