"use client"

import Image from "next/image"
import * as React from "react"
import { GARMENT_TYPES } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusIcon, ShirtIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/shared/search-input"
import type { PosCatalogItem } from "@/components/modules/sales/types"
import { CurrencyDisplay } from "@/components/shared/currency-display"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    <div className="space-y-4">
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
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(GARMENT_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className="group cursor-pointer border border-border/50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md"
            onClick={() => onAddItem(item)}
          >
            <CardContent className="p-3">
              <div className="relative mb-3 h-28 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ShirtIcon className="size-6" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                {item.garmentType ? (
                  <Badge variant="outline" className="text-xs">
                    {GARMENT_TYPES[
                      item.garmentType as keyof typeof GARMENT_TYPES
                    ] ?? item.garmentType}
                  </Badge>
                ) : null}

                <div className="flex items-center justify-between">
                  <CurrencyDisplay amount={item.salePrice} size="sm" />
                  <Button
                    type="button"
                    size="icon-sm"
                    className="bg-brand text-brand-foreground"
                    onClick={(event) => {
                      event.stopPropagation()
                      onAddItem(item)
                    }}
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
