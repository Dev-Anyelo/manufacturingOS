import Link from "next/link"
import { type ReactNode } from "react"
import { ChevronRightIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  eyebrow?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
}: PageHeaderProps) {
  return (
    <header className="mb-1 flex animate-fade-in flex-col gap-3 pb-4">
      {breadcrumbs?.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <div key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="text-xs font-medium text-foreground/90">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground/90"
                        >
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbSeparator className="text-muted-foreground/60">
                      <ChevronRightIcon className="size-3" />
                    </BreadcrumbSeparator>
                  ) : null}
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="mt-1 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-1.5">
          <p className="eyebrow">{eyebrow ?? null}</p>
          <h1 className="text-[clamp(1.35rem,2.2vw,1.9rem)] leading-tight font-semibold text-foreground">
            {title}
          </h1>
          {description ? <p className="body-muted">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end sm:pb-0.5">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
