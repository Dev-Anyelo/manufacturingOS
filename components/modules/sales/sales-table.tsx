"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserRole, Currency } from "@prisma/client"
import { useQueryClient } from "@tanstack/react-query"
import { formatDateNI } from "@/lib/currency/exchange"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CurrencyDisplay } from "@/components/shared/currency-display"

import {
  AlertTriangleIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  MoreHorizontal,
  MoreHorizontalIcon,
  PackageIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SalesTableRow {
  id: string
  saleDate: Date
  customerName: string
  channel: string
  paymentMethod: string
  total: number
  totalCurrency: Currency
  status: string
  balanceDue: number
}

const channelLabelMap: Record<string, string> = {
  in_person: "En tienda",
  order: "Pedido",
  whatsapp: "WhatsApp",
  marketplace: "Marketplace",
  other: "Otro",
}

const channelIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  in_person: StoreIcon,
  order: PackageIcon,
  whatsapp: MessageCircleIcon,
  marketplace: ShoppingCartIcon,
  other: MoreHorizontalIcon,
}

const paymentMethodLabelMap: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit: "Credito",
  mixed: "Mixto",
}

function getColumns(options: {
  canDelete: boolean
  onDelete: (sale: SalesTableRow) => void
}) {
  const { canDelete, onDelete } = options

  const columns: ColumnDef<SalesTableRow>[] = [
    {
      accessorKey: "saleDate",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="text-sm">{formatDateNI(row.original.saleDate)}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Cliente",
      cell: ({ row }) => {
        const name = row.original.customerName
        const initials = name.substring(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-6 rounded-md">
              <AvatarFallback className="rounded-md text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-44 truncate text-sm font-medium">
              {name}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "channel",
      header: "Canal",
      cell: ({ row }) => {
        const channel = row.original.channel
        const Icon = channelIconMap[channel] ?? MoreHorizontalIcon
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="size-3.5" />
            <span className="text-sm">
              {channelLabelMap[channel] ?? channel}
            </span>
          </div>
        )
      },
      meta: {
        className: "hidden md:table-cell",
        headerClassName: "hidden md:table-cell",
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Pago",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {paymentMethodLabelMap[row.original.paymentMethod] ??
            row.original.paymentMethod}
        </span>
      ),
      meta: {
        className: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
      },
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <CurrencyDisplay
            amount={row.original.total}
            currency={row.original.totalCurrency}
          />
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} type="sale" />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
          >
            <Link href={`/sales/${row.original.id}`} title="Ver">
              <ExternalLinkIcon className="size-3.5" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sales/${row.original.id}`}>Ver detalles</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/sales/${row.original.id}?print=true`}>
                  Imprimir recibo
                </Link>
              </DropdownMenuItem>
              {canDelete ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(row.original)}
                >
                  Eliminar venta
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return columns
}

interface SalesTableProps {
  sales: SalesTableRow[]
  currentUserRole: string
}

export function SalesTable({ sales, currentUserRole }: SalesTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [channelFilter, setChannelFilter] = React.useState("all")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [saleToDelete, setSaleToDelete] = React.useState<SalesTableRow | null>(
    null
  )

  const canDelete =
    currentUserRole === UserRole.admin || currentUserRole === UserRole.manager

  const filteredSales = React.useMemo(() => {
    return sales.filter((sale) => {
      if (statusFilter !== "all" && sale.status !== statusFilter) {
        return false
      }

      if (channelFilter !== "all" && sale.channel !== channelFilter) {
        return false
      }

      return true
    })
  }, [sales, statusFilter, channelFilter])

  const columns = React.useMemo(
    () =>
      getColumns({
        canDelete,
        onDelete: (sale) => setSaleToDelete(sale),
      }),
    [canDelete]
  )

  async function handleDeleteSale() {
    if (!saleToDelete) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/sales/${saleToDelete.id}`, {
        method: "DELETE",
      })

      const result = (await response.json()) as {
        success?: boolean
        error?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo eliminar la venta.")
      }

      toast.success("Venta eliminada correctamente")
      await queryClient.invalidateQueries({ queryKey: ["sales"] })
      router.refresh()
      setSaleToDelete(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la venta."
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredSales}
        searchKey="customerName"
        searchPlaceholder="Buscar por cliente..."
        emptyMessage="Sin ventas registradas"
        emptyDescription="Las transacciones apareceran cuando registres ventas desde POS."
        getRowClassName={(row) =>
          row.balanceDue > 0 ? "bg-amber-50/30 dark:bg-yellow-900/5" : ""
        }
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="in_person">En tienda</SelectItem>
                <SelectItem value="order">Pedido</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <AlertDialog
        open={Boolean(saleToDelete)}
        onOpenChange={(open) => !open && !isDeleting && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <div className="border-b border-border/70 px-5 py-4">
            <AlertDialogHeader>
              <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
                <AlertTriangleIcon className="size-5" />
              </div>
              <AlertDialogTitle className="text-center">
                ¿Eliminar esta venta?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-pretty">
                Esta acción no se puede deshacer. Se eliminará la venta y todos
                sus items.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="grid w-full grid-cols-2 gap-2 px-5 pb-5">
            <AlertDialogCancel disabled={isDeleting} className="w-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDeleteSale}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
