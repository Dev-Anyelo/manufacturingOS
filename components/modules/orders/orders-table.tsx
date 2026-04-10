"use client"

import Link from "next/link"
import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { OrderSummaryItem } from "@/components/modules/orders/types"

const channelLabelMap: Record<OrderSummaryItem["channel"], string> = {
  in_person: "En tienda",
  referral: "Referido",
  social_media: "Redes",
  returning_customer: "Recurrente",
  other: "Otro",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
  }).format(new Date(value))
}

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
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [channelFilter, setChannelFilter] = React.useState("all")

  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false
      }

      if (channelFilter !== "all" && order.channel !== channelFilter) {
        return false
      }

      return true
    })
  }, [channelFilter, orders, statusFilter])

  return (
    <DataTable
      columns={columns}
      data={filteredOrders}
      searchKey="customerName"
      searchPlaceholder="Buscar por cliente..."
      emptyMessage="Sin pedidos registrados"
      emptyDescription="Crea tu primer pedido para iniciar el flujo del taller."
      getRowClassName={(row) => {
        const overdue =
          new Date(row.deliveryDate).getTime() < Date.now() &&
          row.status !== "delivered" &&
          row.status !== "cancelled"

        return overdue ? "row-warning-soft" : ""
      }}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-38">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="received">Recibido</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="in_production">En produccion</SelectItem>
              <SelectItem value="ready">Listo</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-38">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="in_person">En tienda</SelectItem>
              <SelectItem value="referral">Referido</SelectItem>
              <SelectItem value="social_media">Redes</SelectItem>
              <SelectItem value="returning_customer">Recurrente</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  )
}
