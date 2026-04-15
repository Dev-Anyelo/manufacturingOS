"use client"

import Link from "next/link"
import * as React from "react"
import { UserRole } from "@/types"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { CurrentUser } from "@/lib/auth/current-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  BookOpenTextIcon,
  LayoutDashboardIcon,
  PackageIcon,
  FactoryIcon,
  ShoppingCartIcon,
  ReceiptTextIcon,
  WalletIcon,
  UsersRoundIcon,
  ShirtIcon,
  Settings2Icon,
  CommandIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Inventario",
      url: "/inventory",
      icon: PackageIcon,
    },
    {
      title: "Produccion",
      url: "/production",
      icon: FactoryIcon,
    },
    {
      title: "Ventas",
      url: "/sales",
      icon: ShoppingCartIcon,
    },
    {
      title: "Pedidos",
      url: "/orders",
      icon: ReceiptTextIcon,
    },
    {
      title: "Gastos",
      url: "/expenses",
      icon: WalletIcon,
    },
    {
      title: "Planilla",
      url: "/payroll",
      icon: UsersRoundIcon,
    },
    {
      title: "Catalogo",
      url: "/catalog",
      icon: ShirtIcon,
    },
    {
      title: "Reportes",
      url: "/reports",
      icon: BookOpenTextIcon,
    },
    {
      title: "Configuracion",
      url: "/settings",
      icon: Settings2Icon,
      adminOnly: true,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: CurrentUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navItems = data.navMain.filter((item) => {
    if (!item.adminOnly) {
      return true
    }

    return user.role === UserRole.Admin
  })

  return (
    <Sidebar collapsible="offcanvas" variant="floating" {...props}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:h-10! data-[slot=sidebar-menu-button]:px-3! data-[slot=sidebar-menu-button]:py-0!"
            >
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
                  <CommandIcon className="size-4" />
                </div>
                <div>
                  <span className="truncate text-sm font-semibold text-foreground">
                    Taller GG
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser
          user={{
            name: user.fullName,
            email: user.email,
            avatar: user.avatarUrl ?? "",
            role: user.role,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
