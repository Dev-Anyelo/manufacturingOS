"use client"

import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"
import { AdjustStockDialog } from "@/components/modules/inventory/adjust-stock-dialog"

import {
  EllipsisVerticalIcon,
  EyeIcon,
  LayersIcon,
  PencilIcon,
  PowerIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface InventoryTableRow {
  id: string
  name: string
  category: "fabric" | "supplies" | "tools" | "machinery"
  quantity: number
  minimumStock: number
  unit: string
  unitPrice: number
  supplier: string | null
  imageUrl: string | null
}

interface InventoryTableProps {
  items: InventoryTableRow[]
  canDeactivate: boolean
}

const categoryLabelMap: Record<InventoryTableRow["category"], string> = {
  fabric: "Telas",
  supplies: "Insumos",
  tools: "Herramientas",
  machinery: "Maquinaria",
}

function getStockStatus(row: InventoryTableRow) {
  if (row.quantity <= 0) {
    return "out"
  }

  if (row.quantity <= row.minimumStock) {
    return "critical"
  }

  if (row.quantity <= row.minimumStock * 2) {
    return "low"
  }

  return "normal"
}

type TableActions = {
  onAdjust: (item: InventoryTableRow) => void
  onDeactivate: (item: InventoryTableRow) => void
  canDeactivate: boolean
}

function createInventoryColumns(
  actions: TableActions
): ColumnDef<InventoryTableRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Material",
      cell: ({ row }) => {
        const item = row.original

        return (
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <LayersIcon className="size-5 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {categoryLabelMap[item.category]}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      id: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <StockIndicator
          quantity={row.original.quantity}
          minimumStock={row.original.minimumStock}
          unit={row.original.unit}
        />
      ),
      meta: {
        className: "hidden lg:table-cell",
        headerClassName: "hidden lg:table-cell",
      },
    },
    {
      id: "unitPrice",
      header: () => <div className="text-right">Precio unitario</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <CurrencyDisplay amount={row.original.unitPrice} />
        </div>
      ),
      meta: {
        className: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
      },
    },
    {
      accessorKey: "supplier",
      header: "Proveedor",
      cell: ({ row }) => {
        const supplier = row.original.supplier

        if (!supplier) {
          return <span className="text-muted-foreground">-</span>
        }

        const truncated = supplier.length > 22
        const text = truncated ? `${supplier.slice(0, 22)}...` : supplier

        if (!truncated) {
          return <span className="text-sm">{text}</span>
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-sm">{text}</span>
            </TooltipTrigger>
            <TooltipContent>{supplier}</TooltipContent>
          </Tooltip>
        )
      },
      meta: {
        className: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Abrir acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/inventory/${item.id}`}>
                  <EyeIcon className="size-4" />
                  Ver
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/inventory/${item.id}/edit`}>
                  <PencilIcon className="size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onAdjust(item)}>
                <SlidersHorizontalIcon className="size-4" />
                Ajustar stock
              </DropdownMenuItem>
              {actions.canDeactivate ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDeactivate(item)}
                  >
                    <PowerIcon className="size-4" />
                    Desactivar
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

export function InventoryTable({ items, canDeactivate }: InventoryTableProps) {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [stockFilter, setStockFilter] = React.useState<string>("all")
  const [adjustingItem, setAdjustingItem] =
    React.useState<InventoryTableRow | null>(null)
  const [deletingItem, setDeletingItem] =
    React.useState<InventoryTableRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false
      }

      if (stockFilter !== "all" && getStockStatus(item) !== stockFilter) {
        return false
      }

      return true
    })
  }, [items, categoryFilter, stockFilter])

  const columns = React.useMemo(
    () =>
      createInventoryColumns({
        onAdjust: (item) => setAdjustingItem(item),
        onDeactivate: (item) => setDeletingItem(item),
        canDeactivate,
      }),
    [canDeactivate]
  )

  async function handleDeactivate() {
    if (!deletingItem) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/inventory/${deletingItem.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as {
        success: boolean
        error?: string
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "No se pudo desactivar el material.")
      }

      toast.success("Material desactivado correctamente.")
      setDeletingItem(null)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el material."
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredItems}
        searchKey="name"
        searchPlaceholder="Buscar por nombre o proveedor..."
        emptyMessage="Sin materiales disponibles"
        emptyDescription="Ajusta tus filtros o crea un nuevo material para empezar."
        emptyAction={
          <Button asChild size="sm" className="bg-brand text-brand-foreground">
            <Link href="/inventory/new">Nuevo material</Link>
          </Button>
        }
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="fabric">Telas</SelectItem>
                <SelectItem value="supplies">Insumos</SelectItem>
                <SelectItem value="tools">Herramientas</SelectItem>
                <SelectItem value="machinery">Maquinaria</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-[130px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Bajo</SelectItem>
                <SelectItem value="critical">Critico</SelectItem>
                <SelectItem value="out">Agotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AdjustStockDialog
        open={Boolean(adjustingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustingItem(null)
          }
        }}
        item={adjustingItem}
        onAdjusted={() => {
          setAdjustingItem(null)
          router.refresh()
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingItem(null)
          }
        }}
        title={
          deletingItem
            ? `Confirmar eliminar ${deletingItem.name}`
            : "Confirmar eliminacion"
        }
        description="Esta accion desactivara el material en el catalogo operativo."
        warningText={
          deletingItem
            ? `Eliminar ${deletingItem.name} es irreversible`
            : "Eliminar material es irreversible"
        }
        highlightedText={deletingItem?.name}
        variant="danger"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
