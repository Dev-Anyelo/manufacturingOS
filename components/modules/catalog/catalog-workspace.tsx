"use client"

import Link from "next/link"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import {
  LayoutGridIcon,
  ListIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { BulkPriceDialog } from "@/components/modules/catalog/bulk-price-dialog"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

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
      if (garmentFilter === "all") return true
      return item.garmentType === garmentFilter
    })
  }, [garmentFilter, items])

  const garmentTypes = React.useMemo(() => {
    const values = new Set<string>()
    for (const item of items) {
      if (item.garmentType) values.add(item.garmentType)
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
            <p className="text-sm font-semibold">{row.original.name}</p>
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
          <div className="text-right font-bold text-brand tabular-nums">
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
          <div className="text-right text-muted-foreground tabular-nums">
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
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <Link href={`/catalog/${row.original.id}`}>Detalle</Link>
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Items" value={items.length} />
        <MiniStat label="Filtrados" value={filteredItems.length} />
        <MiniStat label="Tipos" value={garmentTypes.length} />
        <MiniStat
          label="Vista"
          value={viewMode === "grid" ? "Tarjetas" : "Tabla"}
          accent
        />
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/20 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-md text-xs transition-all",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Vista tarjetas"
              >
                <LayoutGridIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex h-7 w-8 items-center justify-center rounded-md text-xs transition-all",
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Vista tabla"
              >
                <ListIcon className="size-3.5" />
              </button>
            </div>

            <Select value={garmentFilter} onValueChange={setGarmentFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-52">
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

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full px-3 text-xs sm:w-auto"
            onClick={() => setBulkDialogOpen(true)}
          >
            <SlidersHorizontalIcon className="size-3.5" />
            Ajuste masivo
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        filteredItems.length === 0 ? (
          <EmptyState
            icon={ShoppingBagIcon}
            title="Sin productos en el catalogo"
            description="Agrega nuevos productos para iniciar ventas y pedidos."
            action={
              <Button
                asChild
                size="sm"
                className="bg-brand text-brand-foreground"
              >
                <Link href="/catalog/new">Nuevo producto</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        )
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
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}

function MiniStat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/75 px-3 py-2">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={cn("text-sm font-semibold", accent && "text-brand")}>
        {value}
      </p>
    </div>
  )
}
