"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}) {
  const pathname = usePathname()

  const isItemActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon
            const active = isItemActive(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                  className="h-8 rounded border-l-2 border-transparent px-3 text-sm text-sidebar-foreground/82 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary [&>svg]:mr-2.5 [&>svg]:size-4.5 [&>svg]:text-current"
                >
                  <Link
                    href={item.url}
                    aria-current={active ? "page" : undefined}
                  >
                    {Icon ? <Icon className="shrink-0" /> : null}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
