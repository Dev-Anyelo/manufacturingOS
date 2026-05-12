"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronsUpDownIcon, XIcon, CheckIcon } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface EntityOption {
  id: string
  fullName: string
  phone?: string | null
  email?: string | null
  [key: string]: unknown
}

interface EntitySelectorProps {
  entities: EntityOption[]
  value: string | null
  onChange: (entityId: string | null) => void
  label?: string
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  renderEntity?: (entity: EntityOption) => React.ReactNode
}

function initialsFromName(name?: string | null) {
  if (!name) return "?"

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function EntitySelector({
  entities,
  value,
  onChange,
  label = "Seleccionar",
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
  className,
}: EntitySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedEntity = React.useMemo(() => {
    return entities.find((e) => e.id === value) || null
  }, [entities, value])

  const filteredEntities = React.useMemo(() => {
    const normalized = searchValue.trim().toLowerCase()

    if (!normalized) {
      return entities
    }

    return entities.filter((entity) => {
      return (
        entity.fullName.toLowerCase().includes(normalized) ||
        String(entity.phone ?? "")
          .toLowerCase()
          .includes(normalized) ||
        String(entity.email ?? "")
          .toLowerCase()
          .includes(normalized)
      )
    })
  }, [entities, searchValue])

  const handleSelect = (entityId: string) => {
    onChange(entityId)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between px-3 font-normal",
              !value && "text-muted-foreground",
              value && "bg-muted/30"
            )}
          >
            {selectedEntity ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="size-5 shrink-0">
                  <AvatarFallback className="text-[10px]">
                    {initialsFromName(selectedEntity.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedEntity.fullName}</span>
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[300px] p-0 sm:w-[400px]" 
          align="start"
          data-vaul-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <div
              className="flex items-center border-b p-2"
              cmdk-input-wrapper=""
            >
              <Input
                className="flex h-10 w-full text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 opacity-50"
                  onClick={() => setSearchValue("")}
                >
                  <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <CommandList
              className="max-h-[260px] touch-pan-y overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              data-vaul-no-drag
            >
              {filteredEntities.length === 0 ? (
                <CommandEmpty className="py-4 text-center text-sm">
                  {emptyMessage}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredEntities.map((entity) => (
                    <CommandItem
                      key={entity.id}
                      value={entity.id}
                      onClick={() => handleSelect(entity.id)}
                      className="flex items-center gap-2 py-2"
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {initialsFromName(entity.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">
                          {entity.fullName}
                        </span>
                        {entity.phone && (
                          <span className="truncate text-xs text-muted-foreground">
                            {entity.phone}
                          </span>
                        )}
                      </div>
                      {value === entity.id && (
                        <CheckIcon className="size-4 shrink-0 text-brand" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
