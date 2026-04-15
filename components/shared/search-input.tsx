"use client"

import * as React from "react"
import { Loader2Icon, SearchIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  isLoading?: boolean
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  debounceMs = 250,
  isLoading = false,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  React.useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), debounceMs)
    return () => clearTimeout(timer)
  }, [debounceMs, localValue, onChange])

  return (
    <div
      className={cn(
        "relative w-full rounded-md border border-border bg-surface-1",
        className
      )}
    >
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        placeholder={placeholder}
        className="h-8 border-0 bg-transparent pr-8 pl-8 text-sm shadow-none focus:ring-0"
      />
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
        {localValue ? (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setLocalValue("")}
            className="size-6"
            aria-label="Limpiar búsqueda"
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
