"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface KpiSectionProps {
  label?: string
  children: React.ReactNode
  /** Extra classes for the grid container */
  gridClassName?: string
  /** Force open state (ignores mobile detection) */
  forceOpen?: boolean
}

/**
 * Collapsible KPI section wrapper.
 * - Desktop: open by default
 * - Mobile: collapsed by default
 */
export function KpiSection({
  label = "Resumen",
  children,
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
  forceOpen,
}: KpiSectionProps) {
  const isMobile = useIsMobile()
  const defaultOpen = forceOpen ?? !isMobile
  const [open, setOpen] = React.useState(defaultOpen)

  // Re-sync when the mobile state resolves after hydration
  React.useEffect(() => {
    if (forceOpen === undefined) {
      setOpen(!isMobile)
    }
  }, [isMobile, forceOpen])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <span>{label}</span>
        <ChevronDownIcon
          className="size-4 transition-transform duration-200 data-[state=open]:rotate-180"
          data-state={open ? "open" : "closed"}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
        <div className={gridClassName}>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
