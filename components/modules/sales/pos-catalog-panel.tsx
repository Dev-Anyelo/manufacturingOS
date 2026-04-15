"use client"

import Image from "next/image"
import * as React from "react"
import { GARMENT_TYPES } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, ShirtIcon, ShoppingCartIcon } from "lucide-react"
import { SearchInput } from "@/components/shared/search-input"
import type { PosCatalogItem } from "@/components/modules/sales/types"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { cn } from "@/lib/utils"

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
}

export function PosCatalogPanel({ items, onAddItem }: PosCatalogPanelProps) {
  const [search, setSearch] = React.useState("")
  const [garmentType, setGarmentType] = React.useState("all")

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

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-1 py-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar en catalogo..."
          />
          <Select value={garmentType} onValueChange={setGarmentType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de prenda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.entries(GARMENT_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Product grid */}
      <div className="pt-4 pb-2">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
            <ShoppingCartIcon className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search || garmentType !== "all"
                ? "Sin resultados para los filtros actuales."
                : "No hay productos en el catalogo."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <CatalogProductCard
                key={item.id}
                item={item}
                onAdd={onAddItem}
              />
            ))}
          </div>
        )}
      </div>
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
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-muted/20 overflow-hidden",
        "hover:border-border/80 hover:shadow-md transition-all duration-200 active:scale-[0.97]",
        "cursor-pointer"
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
              className="text-[0.625rem] px-1.5 py-0 h-4 font-medium bg-background/80 backdrop-blur-sm border border-border"
            >
              {garmentLabel}
            </Badge>
          </div>
        ) : null}

        {/* Hover overlay with + button */}
        <div className="absolute inset-0 flex items-center justify-center bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                className="size-9 rounded-full bg-brand text-brand-foreground shadow-lg hover:bg-brand/90 transition-transform scale-90 group-hover:scale-100"
                onClick={(event) => {
                  event.stopPropagation()
                  onAdd(item)
                }}
                aria-label={`Agregar ${item.name} al carrito`}
              >
                <PlusIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Agregar al carrito</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Info section */}
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-semibold line-clamp-2 leading-tight">
          {item.name}
        </p>
        <p className="text-sm font-bold text-brand tabular-nums">
          <CurrencyDisplay amount={item.salePrice} size="sm" />
        </p>
      </div>
    </div>
  )
}
