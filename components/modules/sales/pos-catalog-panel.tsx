"use client"

import Image from "next/image"
import * as React from "react"
import { GARMENT_TYPES } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/search-input"
import type { PosCatalogItem } from "@/components/modules/sales/types"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ShirtIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PosCatalogPanelProps {
  items: PosCatalogItem[]
  onAddItem: (item: PosCatalogItem) => void
  addCounts?: Record<string, number>
}

type CatalogView = "grid" | "list"
type CatalogSort = "popular" | "name_asc" | "price_asc" | "price_desc"

const sortLabels: Record<CatalogSort, string> = {
  popular: "Populares",
  name_asc: "Nombre (A–Z)",
  price_asc: "Precio (menor)",
  price_desc: "Precio (mayor)",
}

export function PosCatalogPanel({
  items,
  onAddItem,
  addCounts,
}: PosCatalogPanelProps) {
  const [search, setSearch] = React.useState("")
  const [garmentType, setGarmentType] = React.useState("all")
  const [view, setView] = React.useState<CatalogView>("grid")
  const [sort, setSort] = React.useState<CatalogSort>("popular")

  const filteredItems = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      if (garmentType !== "all" && item.garmentType !== garmentType) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        String(item.garmentType ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      )
    })
  }, [items, search, garmentType])

  const sortedItems = React.useMemo(() => {
    const next = [...filteredItems]

    next.sort((a, b) => {
      if (sort === "popular") {
        const diff = (addCounts?.[b.id] ?? 0) - (addCounts?.[a.id] ?? 0)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name, "es")
      }

      if (sort === "name_asc") {
        return a.name.localeCompare(b.name, "es")
      }

      if (sort === "price_asc") {
        return a.salePrice - b.salePrice
      }

      if (sort === "price_desc") {
        return b.salePrice - a.salePrice
      }

      return 0
    })

    return next
  }, [addCounts, filteredItems, sort])

  const hasActiveFilters = Boolean(search.trim()) || garmentType !== "all"

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar (fixed) */}
      <div className="border-b border-border/70 bg-card/50 p-3 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Catálogo</p>
            <p className="text-xs text-muted-foreground">
              {sortedItems.length} producto{sortedItems.length === 1 ? "" : "s"}
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(next) => {
              if (next) setView(next as CatalogView)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Cambiar vista del catálogo"
          >
            <ToggleGroupItem value="grid" aria-label="Vista en cuadrícula">
              <LayoutGridIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista en lista">
              <ListIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            size="lg"
            placeholder="Buscar producto..."
            inputProps={{
              id: "pos-catalog-search",
              autoComplete: "off",
              inputMode: "search",
              "aria-label": "Buscar producto en catálogo",
            }}
            className="rounded-xl"
          />

          <Select value={garmentType} onValueChange={setGarmentType}>
            <SelectTrigger className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(GARMENT_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 gap-2 sm:max-w-xs">
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as CatalogSort)}
            >
              <SelectTrigger className="h-9 w-full rounded-xl text-xs">
                <SelectValue placeholder="Orden" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sortLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-2">
                      {value === "popular" ? (
                        <SparklesIcon className="size-4 text-muted-foreground" />
                      ) : null}
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 justify-start rounded-xl text-xs text-muted-foreground"
              onClick={() => {
                setSearch("")
                setGarmentType("all")
              }}
            >
              Limpiar filtros
            </Button>
          ) : (
            <div className="h-9" />
          )}
        </div>
      </div>

      {/* Results (scroll) */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3 pt-4">
          {sortedItems.length === 0 ? (
            <EmptyState
              icon={ShoppingCartIcon}
              title={hasActiveFilters ? "Sin resultados" : "Catálogo vacío"}
              description={
                hasActiveFilters
                  ? "No encontramos productos con los filtros actuales. Ajusta la búsqueda o categoría."
                  : "Aún no hay productos activos en el catálogo."
              }
              compact
              action={
                hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("")
                      setGarmentType("all")
                    }}
                  >
                    Mostrar todo
                  </Button>
                ) : null
              }
            />
          ) : view === "list" ? (
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <CatalogProductRow
                  key={item.id}
                  item={item}
                  onAdd={onAddItem}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {sortedItems.map((item) => (
                <CatalogProductCard
                  key={item.id}
                  item={item}
                  onAdd={onAddItem}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CatalogProductCard({
  item,
  onAdd,
}: {
  item: PosCatalogItem
  onAdd: (item: PosCatalogItem) => void
}) {
  const garmentLabel =
    GARMENT_TYPES[item.garmentType as keyof typeof GARMENT_TYPES] ??
    item.garmentType

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/60 shadow-card",
        "transition-[transform,border-color,background-color] duration-150",
        "hover:border-border hover:bg-card/80 active:scale-[0.99]"
      )}
      onClick={() => onAdd(item)}
    >
      {/* Image zone */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShirtIcon className="size-8 opacity-40" />
          </div>
        )}

        {/* Garment type badge top-left */}
        {item.garmentType ? (
          <div className="absolute top-1.5 left-1.5">
            <Badge
              variant="secondary"
              className="h-5 border border-border/70 bg-background/80 px-2 py-0 text-[0.625rem] font-medium backdrop-blur-sm"
            >
              {garmentLabel}
            </Badge>
          </div>
        ) : null}

        <div className="absolute top-2 right-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                className={cn(
                  "rounded-full border-border/70 bg-background/75 backdrop-blur-sm",
                  "transition-colors duration-150 hover:bg-background"
                )}
                onClick={(event) => {
                  event.stopPropagation()
                  onAdd(item)
                }}
                aria-label={`Agregar ${item.name} al carrito`}
              >
                <PlusIcon className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Info section */}
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm leading-snug font-semibold">
          {item.name}
        </p>
        <div className="flex items-end justify-between gap-2">
          <span className="text-sm font-bold text-brand tabular-nums">
            <CurrencyDisplay amount={item.salePrice} size="sm" />
          </span>
          <span className="text-[0.6875rem] text-muted-foreground">
            Stock: {item.stock ?? "—"}
          </span>
        </div>
      </div>
    </button>
  )
}

function CatalogProductRow({
  item,
  onAdd,
}: {
  item: PosCatalogItem
  onAdd: (item: PosCatalogItem) => void
}) {
  const garmentLabel =
    GARMENT_TYPES[item.garmentType as keyof typeof GARMENT_TYPES] ??
    item.garmentType

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-2.5 shadow-card",
        "transition-colors duration-150 hover:bg-card/80"
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShirtIcon className="size-5 opacity-40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          {item.garmentType ? (
            <Badge variant="secondary" className="h-5 px-2 text-[0.625rem]">
              {garmentLabel}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Stock: {item.stock ?? "—"}
          </span>
          <span className="text-sm font-bold text-brand tabular-nums">
            <CurrencyDisplay amount={item.salePrice} size="sm" />
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="icon"
        className="shrink-0"
        onClick={() => onAdd(item)}
        aria-label={`Agregar ${item.name} al carrito`}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  )
}
