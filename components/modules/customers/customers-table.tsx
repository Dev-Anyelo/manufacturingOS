"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { ChevronRightIcon, MailIcon, UserIcon } from "lucide-react"

export type CustomerRow = {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  totalPurchases: number
  salesCount: number
  workOrdersCount: number
}

const columns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "fullName",
    header: "Cliente",
    cell: ({ row }) => {
      const c = row.original
      return (
        <Link href={`/customers/${c.id}`} className="group flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="size-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
              {c.fullName}
            </p>
            {c.phone ? (
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            ) : null}
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.original.email
      if (!email) {
        return <span className="text-xs text-muted-foreground italic">—</span>
      }
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MailIcon className="size-3.5 shrink-0 opacity-70" />
          <span className="truncate">{email}</span>
        </span>
      )
    },
    meta: {
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
  },
  {
    accessorKey: "salesCount",
    header: () => <div className="text-center">Ventas</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="tabular-nums">
          {row.original.salesCount}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "workOrdersCount",
    header: () => <div className="text-center">Pedidos</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge variant="outline" className="tabular-nums">
          {row.original.workOrdersCount}
        </Badge>
      </div>
    ),
    meta: {
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
  },
  {
    accessorKey: "totalPurchases",
    header: () => <div className="text-right">Total Compras</div>,
    cell: ({ row }) => {
      const amount = row.original.totalPurchases
      return (
        <div className={cn(
          "text-right font-medium tabular-nums",
          amount > 0 ? "text-foreground" : "text-muted-foreground"
        )}>
          {formatCurrency(amount)}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="text-right">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/customers/${row.original.id}`}>
            <ChevronRightIcon className="size-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]

export function CustomersTable({ data }: { data: CustomerRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="fullName"
      searchPlaceholder="Buscar clientes por nombre..."
      emptyMessage="Sin clientes"
      emptyDescription="Agrega tu primer cliente para empezar a gestionar su historial."
    />
  )
}

