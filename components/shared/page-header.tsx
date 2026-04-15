import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"
import { type ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

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
    <header className="space-y-3">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight leading-none sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
            {actions}
          </div>
        ) : null}
      </div>

      <Separator className="opacity-60" />
    </header>
  )
}
