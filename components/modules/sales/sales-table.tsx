"use client"

import Link from "next/link"
import * as React from "react"
import {
  ArrowUpRight,
  ExternalLinkIcon,
  MessageCircleIcon,
  MoreHorizontal,
  MoreHorizontalIcon,
  PackageIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type ColumnDef } from "@tanstack/react-table"
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

export interface SalesTableRow {
  id: string
  saleDate: Date
  customerName: string
  channel: string
  paymentMethod: string
  total: number
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

const channelIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
  }).format(value)
}

const columns: ColumnDef<SalesTableRow>[] = [
  {
    accessorKey: "saleDate",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.saleDate)}</span>
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
            <AvatarFallback className="text-[10px] rounded-md">{initials}</AvatarFallback>
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
        <CurrencyDisplay amount={row.original.total} />
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <StatusBadge status={row.original.status} type="sale" />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button asChild variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
          <Link href={`/sales/${row.original.id}`} title="Ver">
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/sales/${row.original.id}`}>Ver detalles</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/sales/${row.original.id}?print=true`}>Imprimir recibo</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
]

interface SalesTableProps {
  sales: SalesTableRow[]
}

export function SalesTable({ sales }: SalesTableProps) {
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [channelFilter, setChannelFilter] = React.useState("all")

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

  return (
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
  )
}
