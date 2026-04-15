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
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <header className="animate-fade-in space-y-4">
      {breadcrumbs?.length ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <div key={`${item.label}-${index}`} className="contents">
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="text-xs font-medium text-foreground">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href}
                          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? (
                    <BreadcrumbSeparator>
                      <ChevronRightIcon className="size-3" />
                    </BreadcrumbSeparator>
                  ) : null}
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl space-y-1.5">
          <h1 className="text-2xl leading-none font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
