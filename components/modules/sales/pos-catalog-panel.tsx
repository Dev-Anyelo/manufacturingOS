"use client"

import Image from "next/image"
import * as React from "react"
import { cn } from "@/lib/utils"
import { GARMENT_TYPES } from "@/types"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { PosCatalogItem } from "@/components/modules/sales/types"

import {
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
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
import { Input } from "@/components/ui/input"

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

function getStockStatus(stock: number | null | undefined) {
  if (stock === null || stock === undefined) return null
  if (stock <= 0) return { color: "bg-danger", label: "Agotado" }
  if (stock <= 5) return { color: "bg-warning", label: "Poco stock" }
  return { color: "bg-success", label: "En stock" }
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
    <div className="flex h-full min-h-0 flex-col bg-background shadow-none">
      {/* Header / Search Area */}
      <div className="border-b border-border/40 py-3 px-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pos-catalog-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className={cn(
                "h-11 w-full rounded-full bg-background pr-4 pl-10 text-sm transition-all outline-none",
                "shadow-sm focus:border-brand focus:ring-2 focus:ring-brand/20"
              )}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background p-1 shadow-sm">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5 text-muted-foreground transition-colors",
                view === "grid" && "bg-muted text-foreground shadow-sm"
              )}
              aria-label="Vista de cuadricula"
            >
              <LayoutGridIcon className="size-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "rounded-md p-1.5 text-muted-foreground transition-colors",
                view === "list" && "bg-muted text-foreground shadow-sm"
              )}
              aria-label="Vista de lista"
            >
              <ListIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories & Sorting */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/30 py-2">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max items-center gap-2 p-1">
            <button
              onClick={() => setGarmentType("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                garmentType === "all"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "border border-border/40 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Todos
            </button>
            {Object.entries(GARMENT_TYPES).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setGarmentType(value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                  garmentType === value
                    ? "bg-brand text-brand-foreground shadow-sm"
                    : "border border-border/40 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        <div className="ml-4 shrink-0 border-l border-border/40 pl-4">
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as CatalogSort)}
          >
            <SelectTrigger className="h-8 w-35 rounded-full border-border/50 bg-background text-xs shadow-sm">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  <span className="flex items-center gap-2">
                    {value === "popular" && (
                      <SparklesIcon className="size-3.5 text-brand" />
                    )}
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="py-2 md:px-2">
          {sortedItems.length === 0 ? (
            <EmptyState
              icon={<ShoppingCartIcon />}
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
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <CatalogProductRow
                  key={item.id}
                  item={item}
                  onAdd={onAddItem}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
  const stockStatus = getStockStatus(item.stock)

  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl bg-card/80 shadow-md",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
      )}
      onClick={() => onAdd(item)}
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShirtIcon className="size-8 opacity-20" />
          </div>
        )}

        {/* Hover quick add overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="translate-y-4 rounded-full bg-background/95 p-3 text-brand shadow-xl transition-transform duration-300 group-hover:translate-y-0">
            <PlusIcon className="size-6" />
          </div>
        </div>
      </div>

      {/* Info container */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 text-left">
        <p className="line-clamp-2 text-sm leading-tight font-semibold text-foreground text-pretty">
          {item.name}
        </p>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-lg font-bold tracking-tight text-brand tabular-nums">
              <CurrencyDisplay amount={item.salePrice} />
            </span>
            {stockStatus ? (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn("size-2 rounded-full", stockStatus.color)}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {item.stock} {stockStatus.label}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                Stock ilimitado
              </span>
            )}
          </div>
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
  const stockStatus = getStockStatus(item.stock)

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-2xl bg-card/80 p-3 shadow-sm",
        "cursor-pointer transition-all duration-300 hover:shadow-md active:scale-[0.99]"
      )}
      onClick={() => onAdd(item)}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/30">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShirtIcon className="size-6 opacity-20" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-base font-semibold text-foreground">
          {item.name}
        </p>
        <div className="mt-1 flex items-center gap-3">
          {stockStatus ? (
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", stockStatus.color)} />
              <span className="text-xs font-medium text-muted-foreground">
                {item.stock} disp.
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              Ilimitado
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 pr-2">
        <span className="text-lg font-bold text-brand tabular-nums">
          <CurrencyDisplay amount={item.salePrice} />
        </span>
        <Button
          type="button"
          size="icon"
          className="size-10 shrink-0 rounded-full bg-brand/10 text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
          aria-label={`Agregar ${item.name} al carrito`}
        >
          <PlusIcon className="size-5" />
        </Button>
      </div>
    </div>
  )
}
