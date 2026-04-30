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
  description?: ReactNode
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
    <header className="mb-1 flex animate-fade-in flex-col gap-3 pt-0 sm:gap-4">
      {breadcrumbs?.length ? (
        <Breadcrumb>
          <BreadcrumbList className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] sm:text-xs">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <div key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="text-xs font-medium text-foreground/95">
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
                    <BreadcrumbSeparator className="text-muted-foreground/55">
                      <ChevronRightIcon className="size-3" />
                    </BreadcrumbSeparator>
                  ) : null}
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="max-w-3xl space-y-1.5">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <div className="text-pretty text-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full shrink-0 flex-col gap-2 *:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:pb-0.5 sm:*:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
