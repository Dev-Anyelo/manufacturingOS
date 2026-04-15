"use client"

import { cn } from "@/lib/utils"

export function SectionCard({
  title,
  icon,
  children,
  className,
  headerRight,
  noPadding = false,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/15 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-brand/85">{icon}</span>
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        </div>
        {headerRight}
      </div>
      <div className={noPadding ? "" : "p-5 sm:p-5.5"}>{children}</div>
    </div>
  )
}
