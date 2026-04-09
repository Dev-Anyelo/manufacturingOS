import { Badge } from "@/components/ui/badge"
import { BellIcon, LogOutIcon, UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import type { CurrentUser } from "@/lib/auth/current-user"
import { UserRole } from "@/types"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type SiteHeaderProps = {
  user: CurrentUser
}

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.Admin]: "Administrador",
  [UserRole.Manager]: "Gerente",
  [UserRole.Employee]: "Empleado",
  [UserRole.Readonly]: "Solo lectura",
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const initials = user.fullName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-2 px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-semibold">manufacturingOS</h1>
          <Badge variant="outline" className="hidden sm:inline-flex">
            {roleLabelMap[user.role]}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1 ring-offset-2 transition outline-none hover:bg-accent focus-visible:ring-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.avatarUrl ?? undefined}
                  alt={user.fullName}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <UserIcon />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notificaciones
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon />
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
