import * as React from "react"

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
      return <Icon className={compact ? "size-4" : "size-5"} />
    }

    return null
  }, [compact, icon])

  return (
    <Empty className={className}>
      <EmptyHeader className={compact ? "max-w-md gap-1" : undefined}>
        <EmptyMedia variant="icon">{iconNode}</EmptyMedia>
        <EmptyTitle className={compact ? "text-xs" : undefined}>
          {title}
        </EmptyTitle>
        <EmptyDescription className={compact ? "text-xs" : undefined}>
          {description}
        </EmptyDescription>
      </EmptyHeader>
      {action ? (
        <EmptyContent className="flex-row justify-center gap-2">
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
  )
}
