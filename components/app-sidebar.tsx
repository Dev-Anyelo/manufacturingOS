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
  FactoryIcon,
  ShoppingCartIcon,
  ReceiptTextIcon,
  WalletIcon,
  UsersRoundIcon,
  ShirtIcon,
  Settings2Icon,
  CommandIcon,
  LayersPlusIcon,
} from "lucide-react"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navigationSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "General",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboardIcon,
      },
      {
        title: "Reportes",
        url: "/reports",
        icon: BookOpenTextIcon,
      },
    ],
  },
  {
    label: "Operaciones",
    items: [
      {
        title: "Inventario",
        url: "/inventory",
        icon: LayersPlusIcon,
      },
      {
        title: "Produccion",
        url: "/production",
        icon: FactoryIcon,
      },
      {
        title: "Pedidos",
        url: "/orders",
        icon: ReceiptTextIcon,
      },
      {
        title: "Catalogo",
        url: "/catalog",
        icon: ShirtIcon,
      },
    ],
  },
  {
    label: "Comercial y Finanzas",
    items: [
      {
        title: "Ventas",
        url: "/sales",
        icon: ShoppingCartIcon,
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
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Configuracion",
        url: "/settings",
        icon: Settings2Icon,
        adminOnly: true,
      },
    ],
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: CurrentUser
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const roleLabel = {
    [UserRole.Admin]: "Administrador",
    [UserRole.Manager]: "Gerente",
    [UserRole.Employee]: "Empleado",
    [UserRole.Readonly]: "Solo lectura",
  }[user.role]

  const filteredSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.adminOnly) {
          return true
        }

        return user.role === UserRole.Admin
      }),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <Sidebar collapsible="offcanvas" variant="floating" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:h-auto! data-[slot=sidebar-menu-button]:rounded-xl! data-[slot=sidebar-menu-button]:border! data-[slot=sidebar-menu-button]:border-sidebar-border/60! data-[slot=sidebar-menu-button]:bg-sidebar-accent/40! data-[slot=sidebar-menu-button]:px-3! data-[slot=sidebar-menu-button]:py-2.5!"
            >
              <Link href="/" className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
                  <CommandIcon className="size-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    manufacturingOS
                  </p>
                  <p className="truncate text-[11px] text-sidebar-foreground/65">
                    ERP Textil · {roleLabel}
                  </p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2.5">
        {filteredSections.map((section) => (
          <NavMain
            key={section.label}
            label={section.label}
            items={section.items}
          />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/80">
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
