"use client"

import { UserRole } from "@/types"
import { ThemeToggle } from "@/components/theme-toggle"
// import { GlobalCommandMenu } from "@/components/global-command-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"

type DashboardHeaderActionsProps = {
  userRole: UserRole
}

export function DashboardHeaderActions({ userRole }: DashboardHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* <GlobalCommandMenu userRole={userRole} /> */}
      <ThemeToggle />
      <NotificationBell />
    </div>
  )
}
