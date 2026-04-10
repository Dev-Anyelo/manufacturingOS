"use client"

import Link from "next/link"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LayoutGridIcon, ListIcon, SlidersHorizontalIcon } from "lucide-react"
import { BulkPriceDialog } from "@/components/modules/catalog/bulk-price-dialog"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  CatalogCard,
  type CatalogCardItem,
} from "@/components/modules/catalog/catalog-card"

interface CatalogWorkspaceProps {
  items: CatalogCardItem[]
}

type ViewMode = "grid" | "table"

export function CatalogWorkspace({ items }: CatalogWorkspaceProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [garmentFilter, setGarmentFilter] = React.useState("all")
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (garmentFilter === "all") {
        return true
      }

      return item.garmentType === garmentFilter
    })
  }, [garmentFilter, items])

  const garmentTypes = React.useMemo(() => {
    const values = new Set<string>()

    for (const item of items) {
      if (item.garmentType) {
        values.add(item.garmentType)
      }
    }

    return [...values].sort()
  }, [items])

  const columns = React.useMemo<ColumnDef<CatalogCardItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Prenda",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.garmentType ?? "Sin tipo"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "ourPriceUnit",
        header: () => <div className="text-right">Unitario</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CurrencyDisplay
              amount={row.original.ourPriceUnit ?? 0}
              size="sm"
            />
          </div>
        ),
      },
      {
        accessorKey: "ourPriceDozen",
        header: () => <div className="text-right">Docena</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CurrencyDisplay
              amount={row.original.ourPriceDozen ?? 0}
              size="sm"
            />
          </div>
        ),
        meta: {
          className: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "estimatedCost",
        header: "Margen",
        cell: ({ row }) => (
          <ProfitMarginIndicator
            ourPriceUnit={row.original.ourPriceUnit}
            estimatedCost={row.original.estimatedCost}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="sm" className="justify-start">
            <Link href={`/catalog/${row.original.id}`}>Detalle</Link>
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) {
                setViewMode(value as ViewMode)
              }
            }}
            variant="outline"
            spacing={0}
          >
            <ToggleGroupItem value="grid" aria-label="Vista tarjetas">
              <LayoutGridIcon className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Vista tabla">
              <ListIcon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Select value={garmentFilter} onValueChange={setGarmentFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tipo de prenda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {garmentTypes.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
          <SlidersHorizontalIcon className="size-4" />
          Ajuste masivo
        </Button>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredItems}
          searchKey="name"
          searchPlaceholder="Buscar prenda..."
          emptyMessage="Sin productos de catalogo"
          emptyDescription="Agrega nuevos productos para iniciar ventas y pedidos."
        />
      )}

      <BulkPriceDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
