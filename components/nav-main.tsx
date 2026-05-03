"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
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
            const hasSubItems = item.items && item.items.length > 0
            const active = isItemActive(item.url)
            const isSubItemActive = item.items?.some((sub) =>
              pathname.startsWith(sub.url)
            )

            if (!hasSubItems) {
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
            }

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isSubItemActive || active}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isSubItemActive || active}
                      className="h-8 rounded border-l-2 border-transparent px-3 text-sm text-sidebar-foreground/82 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary [&>svg]:mr-2.5 [&>svg]:size-4.5 [&>svg]:text-current"
                    >
                      {Icon && <Icon className="shrink-0" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname.startsWith(subItem.url)}
                            className="h-8 rounded border-l-2 border-transparent px-3 text-sm text-sidebar-foreground/82 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary"
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
