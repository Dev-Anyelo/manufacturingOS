"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { ChevronRightIcon, MailIcon, UserIcon, MoreHorizontal, Trash2, AlertTriangle, Eye } from "lucide-react"

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

export type CustomerRow = {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  totalPurchases: number
  salesCount: number
  workOrdersCount: number
}

interface CustomersTableProps {
  data: CustomerRow[]
  canDelete?: boolean
}

export function CustomersTable({ data, canDelete = false }: CustomersTableProps) {
  const router = useRouter()
  const [customerToDelete, setCustomerToDelete] = React.useState<CustomerRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    if (!customerToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "No se pudo eliminar el cliente.")
      }

      toast.success("Cliente eliminado correctamente.")
      setCustomerToDelete(null)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.")
    } finally {
      setIsDeleting(false)
    }
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
      header: "Ventas",
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
      header: "Pedidos",
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="tabular-nums text-sm">
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
      header: "Total Compras",
      cell: ({ row }) => {
        const amount = row.original.totalPurchases
        return (
          <div className={cn(
            "text-center font-medium tabular-nums",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/customers/${row.original.id}`} className="flex items-center gap-2">
                  <Eye className="size-4" />
                  Ver perfil
                </Link>
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive flex items-center gap-2"
                  onClick={() => setCustomerToDelete(row.original)}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="fullName"
        searchPlaceholder="Buscar clientes por nombre..."
        emptyMessage="Sin clientes"
        emptyDescription="Agrega tu primer cliente para empezar a gestionar su historial."
      />

      <AlertDialog
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => !open && !isDeleting && setCustomerToDelete(null)}
      >
        <AlertDialogContent className="sm:max-w-md px-4 py-4 sm:px-6 sm:py-6">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center text-balance">¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              Esta acción eliminará permanentemente al cliente y todo su historial. 
              <strong>No se puede deshacer si tiene ventas o pedidos asociados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 w-full">
            <AlertDialogCancel disabled={isDeleting} className="w-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
