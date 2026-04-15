"use client"

import Link from "next/link"
import * as React from "react"
import { UserRole } from "@/types"
import { Badge } from "@/components/ui/badge"
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
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <CommandIcon className="size-4!" />
                <div>
                  <span className="truncate text-base font-semibold">
                    Taller GG
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1.5 py-2">
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
