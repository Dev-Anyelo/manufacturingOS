import * as React from "react"
import { cn } from "@/lib/utils"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface EmptyStateProps {
  icon: React.ReactNode | React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const iconNode = React.useMemo(() => {
    if (React.isValidElement(icon)) {
      return icon
    }

    if (typeof icon === "function") {
      const Icon = icon
      return <Icon className={compact ? "size-5" : "size-6"} />
    }

    return null
  }, [compact, icon])

  return (
    <Empty
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-linear-to-b from-muted/10 to-transparent p-6",
        compact ? "min-h-40" : "min-h-56",
        className
      )}
    >
      <EmptyHeader
        className={compact ? "max-w-md gap-1.5" : "max-w-xl gap-2.5"}
      >
        <EmptyMedia variant="icon">
          <span className="rounded-lg border border-border/70 bg-card/50 p-2 text-muted-foreground opacity-70">
            {iconNode}
          </span>
        </EmptyMedia>
        <EmptyTitle className={cn("text-sm font-semibold text-foreground")}>
          {title}
        </EmptyTitle>
        <EmptyDescription className="text-xs leading-relaxed text-pretty text-muted-foreground">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {action ? (
        <EmptyContent className="flex-row justify-center gap-2 pt-2">
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
