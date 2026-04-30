"use client"

import Link from "next/link"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { BulkPriceDialog } from "@/components/modules/catalog/bulk-price-dialog"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  ArrowUpRight,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

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
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [garmentFilter, setGarmentFilter] = React.useState("all")
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

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
          <div className="text-right font-bold text-primary tabular-nums">
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
            className="min-h-10 px-3 text-xs sm:min-h-8 sm:h-8"
          >
            <Link href={`/catalog/${row.original.id}`}>
              Detalle 
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={garmentFilter} onValueChange={setGarmentFilter}>
              <SelectTrigger className="h-11 min-h-11 w-auto min-w-36 px-3 text-xs sm:h-10 sm:min-h-10">
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
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 w-auto px-3 text-xs sm:min-h-9"
              onClick={() => setBulkDialogOpen(true)}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              Ajuste masivo de precios
            </Button>

            <Button
              size="sm"
              className="min-h-11 w-auto gap-2 px-3 text-xs sm:min-h-9"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              Nuevo producto
            </Button>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/20 p-1">
              <Button
                type="button"
                variant={viewMode === "grid" ? "outline" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "size-10 shrink-0 rounded-md sm:size-9",
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Vista tarjetas"
              >
                <LayoutGridIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "outline" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className={cn(
                  "size-10 shrink-0 rounded-md sm:size-9",
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Vista tabla"
              >
                <ListIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        filteredItems.length === 0 ? (
          <EmptyState
            icon={<ShoppingBagIcon />}
            title="Sin productos en el catálogo"
            description="Agrega nuevos productos para iniciar ventas y pedidos."
            action={
              <Button asChild size="sm">
                <Link href="/catalog/new">Nuevo producto</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
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
          emptyMessage="Sin productos en catálogo"
          emptyDescription="Agrega nuevos productos para iniciar ventas y pedidos."
        />
      )}

      <BulkPriceDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Create product sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-2xl",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingBagIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nuevo producto</SheetTitle>
                <SheetDescription className="text-sm">
                  Agrega un nuevo producto al catálogo de prendas.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              <CatalogForm
                mode="create"
                onSuccess={() => {
                  setCreateOpen(false)
                  router.refresh()
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
