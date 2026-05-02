"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { WorkOrderStatus } from "@prisma/client"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { OrderSummaryItem } from "@/components/modules/orders/types"

import {
  channelLabelMap,
  cn,
  formatDate,
  isOverdue,
  statusConfig,
} from "@/lib/utils"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusOptions: WorkOrderStatus[] = [
  WorkOrderStatus.delivered,
  WorkOrderStatus.cancelled,
]

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
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Eye,
} from "lucide-react"

// Columns will be defined inside the component to access state

interface OrdersTableProps {
  orders: OrderSummaryItem[]
  /** Hide estado filter when parent workspace applies pipeline tabs */
  suppressStatusFilter?: boolean
  canDelete?: boolean
}

export function OrdersTable({
  orders,
  suppressStatusFilter = false,
  canDelete = false,
}: OrdersTableProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | WorkOrderStatus
  >("all")
  const [channelFilter, setChannelFilter] = React.useState<
    "all" | OrderSummaryItem["channel"]
  >("all")
  const [orderToDelete, setOrderToDelete] = React.useState<OrderSummaryItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    if (!orderToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "No se pudo eliminar el pedido.")
      }

      toast.success("Pedido eliminado correctamente.")
      setOrderToDelete(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = React.useMemo<ColumnDef<OrderSummaryItem>[]>(
    () => [
      {
        accessorKey: "deliveryDate",
        header: "Entrega",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.deliveryDate)}</span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="max-w-56 truncate text-sm font-medium">
              {row.original.customerName}
            </p>
            <p className="text-xs text-muted-foreground">
              #{row.original.id.slice(0, 8)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "channel",
        header: "Canal",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {channelLabelMap[row.original.channel]}
          </span>
        ),
        meta: {
          className: "hidden md:table-cell",
          headerClassName: "hidden md:table-cell",
        },
      },
      {
        accessorKey: "garmentCount",
        header: "Prendas",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.garmentCount}</span>
        ),
        meta: {
          className: "hidden sm:table-cell",
          headerClassName: "hidden sm:table-cell",
          mobileCardVisible: true,
          mobileLabel: "Prendas",
        },
      },
      {
        accessorKey: "balanceDue",
        header: () => <div className="text-right">Saldo</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <CurrencyDisplay amount={row.original.balanceDue} colored size="sm" />
          </div>
        ),
        meta: {
          mobileCardVisible: true,
          mobileLabel: "Saldo",
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} type="work-order" />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${row.original.id}`} className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Ver detalles
                  </Link>
                </DropdownMenuItem>
                
                {canDelete && (row.original.status === WorkOrderStatus.received || row.original.status === WorkOrderStatus.cancelled) && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive flex items-center gap-2"
                    onClick={() => setOrderToDelete(row.original)}
                  >
                    <Trash2 className="size-4" />
                    Eliminar pedido
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

  const filtered = React.useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false
      if (channelFilter !== "all" && o.channel !== channelFilter) return false
      return true
    })
  }, [orders, statusFilter, channelFilter])

  const toolbar = (
    <>
      {!suppressStatusFilter ? (
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | WorkOrderStatus)
          }
        >
          <SelectTrigger className="min-h-10 sm:min-h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${statusConfig[status].dot}`}
                  />
                  {statusConfig[status].label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <Select
        value={channelFilter}
        onValueChange={(value) =>
          setChannelFilter(value as "all" | OrderSummaryItem["channel"])
        }
      >
        <SelectTrigger className="min-h-10 sm:min-h-9">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los canales</SelectItem>
          <SelectItem value="in_person">En tienda</SelectItem>
          <SelectItem value="referral">Referido</SelectItem>
          <SelectItem value="social_media">Redes sociales</SelectItem>
          <SelectItem value="returning_customer">Recurrente</SelectItem>
          <SelectItem value="other">Otro</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="customerName"
        searchPlaceholder="Buscar por cliente..."
        emptyMessage="Sin pedidos"
        emptyDescription="Ajusta los filtros para ver resultados"
        toolbar={toolbar}
        getRowClassName={(order) =>
          isOverdue(order)
            ? cn("tone-warning border-l-warning/50 border-l-2")
            : ""
        }
      />

      <AlertDialog
        open={Boolean(orderToDelete)}
        onOpenChange={(open) => !open && !isDeleting && setOrderToDelete(null)}
      >
        <AlertDialogContent className="px-4 py-4 sm:px-6 sm:py-6 sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center text-pretty">
              ¿Eliminar este pedido?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              Esta acción no se puede deshacer. Se eliminará el registro del
              pedido permanentemente. 
              <span className="mt-2 block text-xs font-medium text-muted-foreground">
                Solo se pueden eliminar pedidos en estado Recibido o Cancelado.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
