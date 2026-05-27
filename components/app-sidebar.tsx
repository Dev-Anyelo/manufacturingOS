"use client"

import Link from "next/link"
import * as React from "react"
import { UserRole } from "@/types"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { CurrentUser } from "@/lib/auth/current-user"

import type { DashboardNavSection } from "@/lib/nav/dashboard-links"

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
  UsersIcon,
  ShirtIcon,
  Settings2Icon,
  LayersPlusIcon,
  ClockIcon,
} from "lucide-react"

const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/": LayoutDashboardIcon,
  "/reports": BookOpenTextIcon,
  "/inventory": LayersPlusIcon,
  "/production": FactoryIcon,
  "/orders": ReceiptTextIcon,
  "/catalog": ShirtIcon,
  "/sales": ShoppingCartIcon,
  "/expenses": WalletIcon,
  "/payroll": UsersRoundIcon,
  "/attendance": ClockIcon,
  "/customers": UsersIcon,
  "/settings": Settings2Icon,
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: CurrentUser
  sections: DashboardNavSection[]
}

export function AppSidebar({ user, sections, ...props }: AppSidebarProps) {
  const roleLabel = {
    [UserRole.Admin]: "Administrador",
    [UserRole.Manager]: "Gerente",
    [UserRole.Employee]: "Empleado",
    [UserRole.Readonly]: "Solo lectura",
  }[user.role]

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
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-semibold text-sidebar-foreground">
                    DANIELLS CONFECCIONES
                  </p>
                  <p className="truncate text-[11px] text-sidebar-foreground/65">
                    ERP textil · {roleLabel}
                  </p>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2.5">
        {sections.map((section) => (
          <NavMain
            key={section.label}
            label={section.label}
            items={section.items.map(item => ({
              ...item,
              icon: navIcons[item.url] ?? LayoutDashboardIcon
            }))}
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
