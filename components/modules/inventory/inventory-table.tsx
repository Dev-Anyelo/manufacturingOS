"use client"

import Link from "next/link"
import { toast } from "sonner"
import Image from "next/image"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable } from "@/components/shared/data-table"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { InventoryForm } from "@/components/modules/inventory/inventory-form"
import { StockIndicator } from "@/components/modules/inventory/stock-indicator"
import { AdjustStockDialog } from "@/components/modules/inventory/adjust-stock-dialog"

import {
  ArrowUpDown,
  Building2Icon,
  CogIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  ShirtIcon,
  Trash2Icon,
  WrenchIcon,
  BoxesIcon,
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

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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

import { useIsMobile } from "@/hooks/use-mobile"

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

const categoryConfig: Record<
  InventoryTableRow["category"],
  {
    label: string
    Icon: typeof ShirtIcon
    tileClass: string
    badgeClass: string
  }
> = {
  fabric: {
    label: "Telas",
    Icon: ShirtIcon,
    tileClass:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    badgeClass:
      "border-violet-200/80 bg-violet-100 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
  },
  supplies: {
    label: "Insumos",
    Icon: PackageIcon,
    tileClass:
      "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    badgeClass:
      "border-blue-200/80 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  tools: {
    label: "Herramientas",
    Icon: WrenchIcon,
    tileClass:
      "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    badgeClass:
      "border-amber-200/80 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  machinery: {
    label: "Maquinaria",
    Icon: CogIcon,
    tileClass:
      "border-slate-400/35 bg-muted text-slate-700 dark:text-slate-200",
    badgeClass:
      "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  },
}

function getStockStatus(row: InventoryTableRow) {
  if (row.quantity <= 0) return "out"
  if (row.quantity <= row.minimumStock) return "critical"
  if (row.quantity <= row.minimumStock * 2) return "low"
  return "normal"
}

type TableActions = {
  onAdjust: (item: InventoryTableRow) => void
  onEdit: (item: InventoryTableRow) => void
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
        const catConfig = categoryConfig[item.category]
        const CatIcon = catConfig.Icon

        return (
          <div className="flex min-w-0 items-center gap-3">
            {item.imageUrl ? (
              <div className="relative size-9 shrink-0 overflow-hidden rounded-md border border-border/60">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md border",
                  catConfig.tileClass
                )}
              >
                <CatIcon className="size-4" />
              </span>
            )}
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm leading-tight font-medium">
                {item.name}
              </p>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-normal", catConfig.badgeClass)}
                >
                  {catConfig.label}
                </Badge>
              </div>
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
        mobileCardVisible: true,
        mobileLabel: "Stock",
      },
    },
    {
      id: "unitPrice",
      header: () => <div className="text-right">Precio</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium tabular-nums">
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
          return (
            <span className="text-xs text-muted-foreground italic">
              Sin proveedor
            </span>
          )
        }

        const truncated = supplier.length > 22
        const text = truncated ? `${supplier.slice(0, 22)}...` : supplier

        const inner = (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <Building2Icon className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">{text}</span>
          </span>
        )

        if (!truncated) {
          return inner
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>{inner}</TooltipTrigger>
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
              <Button
                variant="ghost"
                size="icon"
                className="size-10 min-h-10 min-w-10 opacity-70 transition-opacity hover:opacity-100"
              >
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Abrir acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/inventory/${item.id}`}>
                  <EyeIcon className="size-4" />
                  Ver detalle
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEdit(item)}>
                <PencilIcon className="size-4" />
                Editar material
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onAdjust(item)}>
                <ArrowUpDown className="size-4" />
                Ajustar stock
              </DropdownMenuItem>
              {actions.canDeactivate ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => actions.onDeactivate(item)}
                  >
                    <Trash2Icon className="size-4" />
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

/** Sheet wrapper for InventoryForm (create or edit) */
function InventoryFormSheet({
  open,
  onOpenChange,
  mode,
  item,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  item?: InventoryTableRow | null
  onSuccess: () => void
}) {
  const isMobile = useIsMobile()

  const defaultValues =
    mode === "edit" && item
      ? {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          minimum_stock: item.minimumStock,
          unit: item.unit,
          unit_price: item.unitPrice,
          supplier: item.supplier,
          image_url: item.imageUrl,
        }
      : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
              <BoxesIcon className="size-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base text-pretty">
                {mode === "create" ? "Nuevo material" : "Editar material"}
              </SheetTitle>
              <SheetDescription className="text-sm text-pretty">
                {mode === "create"
                  ? "Agrega un nuevo material al inventario."
                  : `Edita los datos de "${item?.name}".`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4">
            <InventoryForm
              mode={mode}
              itemId={mode === "edit" ? item?.id : undefined}
              defaultValues={defaultValues}
              onSuccess={() => {
                onOpenChange(false)
                onSuccess()
              }}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function InventoryTable({ items, canDeactivate }: InventoryTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryFilter = searchParams.get("category") || "all"
  const stockFilter = searchParams.get("status") || "all"

  const [adjustingItem, setAdjustingItem] =
    React.useState<InventoryTableRow | null>(null)
  const [editingItem, setEditingItem] =
    React.useState<InventoryTableRow | null>(null)
  const [deletingItem, setDeletingItem] =
    React.useState<InventoryTableRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

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
        onEdit: (item) => setEditingItem(item),
        onDeactivate: (item) => setDeletingItem(item),
        canDeactivate,
      }),
    [canDeactivate]
  )

  async function handleDeactivate() {
    if (!deletingItem) return
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
        emptyMessage="No hay materiales registrados"
        emptyDescription="Busca otro termino o agrega el primer material al inventario."
        emptyAction={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Nuevo material
          </Button>
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="size-4 shrink-0" />
              Nuevo material
            </Button>
            <Select
              value={categoryFilter}
              onValueChange={(v) => updateFilters("category", v)}
            >
              <SelectTrigger>
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

            <Select
              value={stockFilter}
              onValueChange={(v) => updateFilters("status", v)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Estado" />
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

      {/* Adjust stock sheet */}
      <AdjustStockDialog
        open={Boolean(adjustingItem)}
        onOpenChange={(open) => {
          if (!open) setAdjustingItem(null)
        }}
        item={adjustingItem}
        onAdjusted={() => {
          setAdjustingItem(null)
          router.refresh()
        }}
      />

      {/* Create material sheet */}
      <InventoryFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSuccess={() => router.refresh()}
      />

      {/* Edit material sheet */}
      <InventoryFormSheet
        open={Boolean(editingItem)}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null)
        }}
        mode="edit"
        item={editingItem}
        onSuccess={() => router.refresh()}
      />

      {/* Delete confirmation — professional AlertDialog */}
      <AlertDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingItem(null)
        }}
      >
        <AlertDialogContent className="max-w-md border-destructive/30">
          <AlertDialogHeader className="gap-2 px-3 py-3">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2Icon className="size-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Desactivar material
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm leading-relaxed text-pretty">
              Esta acción{" "}
              <strong className="text-foreground">no se puede deshacer</strong>.
              Se desactivará permanentemente{" "}
              <strong className="text-foreground">
                &quot;{deletingItem?.name}&quot;
              </strong>{" "}
              del catálogo operativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 border-t px-4 py-4 sm:gap-2">
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeactivate()
              }}
            >
              <Trash2Icon className="size-4" />
              {isDeleting ? "Desactivando..." : "Sí, desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
