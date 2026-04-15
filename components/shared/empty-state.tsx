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
        "rounded-xl border border-dashed border-border bg-muted/20 p-6",
        compact ? "min-h-38" : "min-h-52",
        className
      )}
    >
      <EmptyHeader className={compact ? "max-w-md gap-1.5" : "max-w-xl gap-2"}>
        <EmptyMedia variant="icon">
          <span className="text-muted-foreground opacity-60">
            {iconNode}
          </span>
        </EmptyMedia>
        <EmptyTitle
          className={cn("text-sm font-medium text-foreground")}
        >
          {title}
        </EmptyTitle>
        <EmptyDescription className="text-xs text-pretty text-muted-foreground">
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
