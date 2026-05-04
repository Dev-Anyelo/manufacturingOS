"use client"

import Link from "next/link"
import * as React from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useQueryClient } from "@tanstack/react-query"
import { type ColumnDef } from "@tanstack/react-table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"
import { BulkPriceDialog } from "@/components/modules/catalog/bulk-price-dialog"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import {
  ArrowUpRight,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  Trash2,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  CatalogCard,
  type CatalogCardItem,
} from "@/components/modules/catalog/catalog-card"

interface CatalogWorkspaceProps {
  items: CatalogCardItem[]
  canDelete?: boolean
}

type ViewMode = "grid" | "table"

export function CatalogWorkspace({
  items,
  canDelete = false,
}: CatalogWorkspaceProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")
  const [garmentFilter, setGarmentFilter] = React.useState("all")
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<CatalogCardItem | null>(
    null
  )
  const [itemToDeactivate, setItemToDeactivate] =
    React.useState<CatalogCardItem | null>(null)
  const [isDeactivating, setIsDeactivating] = React.useState(false)

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

  async function handleDeactivate() {
    if (!itemToDeactivate) return
    setIsDeactivating(true)

    try {
      const response = await fetch(`/api/catalog/${itemToDeactivate.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("No se pudo desactivar el producto.")
      }

      toast.success("Producto desactivado correctamente.")
      setItemToDeactivate(null)
      await queryClient.invalidateQueries({ queryKey: ["catalog"] })
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al desactivar."
      )
    } finally {
      setIsDeactivating(false)
    }
  }

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
              currency={row.original.ourPriceUnitCurrency as any}
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
              currency={row.original.ourPriceDozenCurrency as any}
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
        accessorKey: "totalStock",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            <span
              className={cn(
                "inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-0.5 text-xs",
                row.original.totalStock > 0
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {row.original.totalStock}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "estimatedCost",
        header: "Margen",
        cell: ({ row }) => (
          <ProfitMarginIndicator
            ourPriceUnit={row.original.ourPriceUnit}
            ourPriceCurrency={row.original.ourPriceUnitCurrency as any}
            estimatedCost={row.original.estimatedCost}
            estimatedCostCurrency={row.original.estimatedCostCurrency as any}
          />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-10 px-3 text-xs sm:h-8 sm:min-h-8"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingItem(row.original)}>
                  <PencilIcon className="size-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/catalog/${row.original.id}`}>
                    <ArrowUpRight className="size-3.5" />
                    Detalle
                  </Link>
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onClick={() => setItemToDeactivate(row.original)}
                  >
                    <Trash2 className="size-4" />
                    Desactivar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete]
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={garmentFilter} onValueChange={setGarmentFilter}>
              <SelectTrigger className="w-36 text-sm">
                <SelectValue placeholder="Tipo de prenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {garmentTypes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-md bg-muted">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDialogOpen(true)}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              <span className="hidden md:inline">Ajuste masivo de precios</span>
            </Button>

            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="size-3.5" />
              <span className="hidden sm:inline">Nuevo producto</span>
            </Button>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingBagIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Nuevo producto</SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Agrega un nuevo producto al catálogo de prendas.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <CatalogForm
                mode="create"
                onSuccess={async () => {
                  setCreateOpen(false)
                  await queryClient.invalidateQueries({ queryKey: ["catalog"] })
                  router.refresh()
                }}
                onCancel={() => setCreateOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Edit product sheet */}
      <Sheet
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-2xl",
            isMobile ? "max-h-[95vh] rounded-t-2xl" : ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <PencilIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Editar producto</SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Actualiza la información del producto seleccionado.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              {editingItem ? (
                <CatalogForm
                  mode="edit"
                  itemId={editingItem.id}
                  defaultValues={{
                    name: editingItem.name,
                    description: null,
                    garment_type: editingItem.garmentType ?? "",
                    market_price_unit: editingItem.marketPriceUnit ?? 0,
                    market_price_dozen: null,
                    our_price_unit: editingItem.ourPriceUnit ?? 0,
                    our_price_dozen: editingItem.ourPriceDozen,
                    estimated_cost: editingItem.estimatedCost,
                    notes: editingItem.notes,
                    image_url: editingItem.imageUrl,
                  }}
                  onSuccess={async () => {
                    setEditingItem(null)
                    await queryClient.invalidateQueries({
                      queryKey: ["catalog"],
                    })
                    router.refresh()
                  }}
                  onCancel={() => setEditingItem(null)}
                />
              ) : null}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(itemToDeactivate)}
        onOpenChange={(open) =>
          !open && !isDeactivating && setItemToDeactivate(null)
        }
      >
        <AlertDialogContent className="px-4 py-4 sm:px-6 sm:py-6">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center">
              ¿Desactivar producto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              El producto ya no aparecerá en el catálogo activo para ventas o
              pedidos. Puedes reactivarlo después si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeactivating}
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
