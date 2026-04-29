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
      <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-brand/85">{icon}</span>
          <h3 className="truncate text-[13px] font-semibold text-foreground sm:text-[13px]">
            {title}
          </h3>
        </div>
        {headerRight ? (
          <div className="flex w-full items-center justify-start sm:w-auto sm:justify-end">
            {headerRight}
          </div>
        ) : null}
      </div>
      <div className={noPadding ? "" : "p-4 sm:p-5"}>{children}</div>
    </div>
  )
}
