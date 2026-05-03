"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DashboardNavSection } from "@/lib/nav/dashboard-links"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

type GlobalCommandMenuProps = {
  sections: DashboardNavSection[]
}

export function GlobalCommandMenu({ sections }: GlobalCommandMenuProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const normalizedQuery = query.trim().toLowerCase()

  const filteredSections = React.useMemo(() => {
    if (!normalizedQuery) return sections

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.title.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, normalizedQuery])

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  function navigateTo(url: string) {
    setOpen(false)
    router.push(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-10 gap-2 rounded-lg border-border/70 bg-muted/20 px-3 font-normal text-muted-foreground md:inline-flex md:max-w-[220px] lg:max-w-xs"
            aria-label="Abrir busqueda del sistema"
          >
            <SearchIcon className="size-4 shrink-0 opacity-70" />
            <span className="truncate text-xs text-muted-foreground">
              Buscar o navegar...
            </span>
            <kbd className="pointer-events-none ml-auto hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline">
              ⌘K
            </kbd>
          </Button>
        </DialogTrigger>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-lg border border-transparent bg-muted/30 md:hidden"
            aria-label="Abrir busqueda del sistema"
          >
            <SearchIcon className="size-4" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden gap-0 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Buscar...</DialogTitle>
        <Command className="rounded-none border-0 shadow-none">
          <CommandInput
            placeholder="Buscar modulo o ir a..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <CommandList>
            <CommandEmpty>No hay resultados.</CommandEmpty>
            {filteredSections.map((section, sectionIndex) => (
              <React.Fragment key={section.label}>
                {sectionIndex > 0 ? <CommandSeparator /> : null}
                <CommandGroup>
                  <p className="label-overline px-2 pt-2 pb-1">{section.label}</p>
                  {section.items.map((item) => (
                    <CommandItem
                      key={item.url}
                      onClick={() => navigateTo(item.url)}
                    >
                      {item.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
