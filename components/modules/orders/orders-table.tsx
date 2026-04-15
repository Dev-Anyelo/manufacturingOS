"use client"

import Link from "next/link"
import * as React from "react"
import { EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrderStatus } from "@prisma/client"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { OrderSummaryItem } from "@/components/modules/orders/types"

import {
  channelLabelMap,
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
  WorkOrderStatus.received,
  WorkOrderStatus.confirmed,
  WorkOrderStatus.in_production,
  WorkOrderStatus.ready,
  WorkOrderStatus.delivered,
  WorkOrderStatus.cancelled,
]

const columns: ColumnDef<OrderSummaryItem>[] = [
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
      <Button asChild variant="ghost" size="sm" className="justify-start">
        <Link href={`/orders/${row.original.id}`}>
          <EyeIcon className="size-4" />
          Ver
        </Link>
      </Button>
    ),
  },
]

interface OrdersTableProps {
  orders: OrderSummaryItem[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | WorkOrderStatus
  >("all")
  const [channelFilter, setChannelFilter] = React.useState<
    "all" | OrderSummaryItem["channel"]
  >("all")

  const filtered = React.useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false
      if (channelFilter !== "all" && o.channel !== channelFilter) return false
      return true
    })
  }, [orders, statusFilter, channelFilter])

  const toolbar = (
    <>
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          setStatusFilter(value as "all" | WorkOrderStatus)
        }
      >
        <SelectTrigger>
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

      <Select
        value={channelFilter}
        onValueChange={(value) =>
          setChannelFilter(value as "all" | OrderSummaryItem["channel"])
        }
      >
        <SelectTrigger>
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
    <DataTable
      columns={columns}
      data={filtered}
      searchKey="customerName"
      searchPlaceholder="Buscar por cliente..."
      emptyMessage="Sin pedidos"
      emptyDescription="Ajusta los filtros para ver resultados"
      toolbar={toolbar}
      getRowClassName={(order) =>
        isOverdue(order) ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
      }
    />
  )
}
