"use client"

import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { revalidatePaths } from "@/lib/ui/revalidatePaths"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { formatDateOnlyNI, normalizeDateOnly } from "@/lib/currency/exchange"

import {
  ScissorsIcon,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  PencilLineIcon,
  ArrowUpRight,
} from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export interface ProductionTableRow {
  id: string
  sessionDate: string
  employeeId: string
  employeeName: string
  totalGarments: number
  totalYardsUsed: number
  createdByName: string
}

interface ProductionTableProps {
  sessions: ProductionTableRow[]
  canDelete?: boolean
}

function formatDateFull(value: string) {
  return formatDateOnlyNI(value, "PPPP")
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function ProductionTable({
  sessions,
  canDelete = false,
}: ProductionTableProps) {
  const [employeeFilter, setEmployeeFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>(
    {}
  )
  const [sessionToDelete, setSessionToDelete] =
    React.useState<ProductionTableRow | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const employeeOptions = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const session of sessions) {
      if (!map.has(session.employeeId)) {
        map.set(session.employeeId, session.employeeName)
      }
    }
    return [...map.entries()].map(([id, fullName]) => ({ id, fullName }))
  }, [sessions])

  const filtered = React.useMemo(() => {
    return sessions.filter((session) => {
      if (employeeFilter !== "all" && session.employeeId !== employeeFilter) {
        return false
      }
      const currentDate = normalizeDateOnly(session.sessionDate)
      const fromDate = normalizeDateOnly(dateRange.from)
      if (currentDate && fromDate && currentDate < fromDate) return false
      if (dateRange.to) {
        const inclusiveTo = normalizeDateOnly(dateRange.to)
        if (inclusiveTo) {
          inclusiveTo.setUTCHours(23, 59, 59, 999)
        }
        if (currentDate && inclusiveTo && currentDate > inclusiveTo) {
          return false
        }
      }
      return true
    })
  }, [dateRange.from, dateRange.to, employeeFilter, sessions])

  async function handleDelete() {
    if (!sessionToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/production/${sessionToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("No se pudo eliminar la sesión.")
      }

      await revalidatePaths(["/production", "/inventory", "/reports", "/"])
      toast.success("Sesión eliminada correctamente.")
      setSessionToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar.")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<ProductionTableRow>[] = [
    {
      accessorKey: "sessionDate",
      header: "Fecha",
      cell: ({ row }) => {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">
                {formatDateOnlyNI(row.original.sessionDate)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {formatDateFull(row.original.sessionDate)}
              </p>
            </TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      accessorKey: "employeeName",
      header: "Empleado",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(row.original.employeeName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {row.original.employeeName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "totalGarments",
      header: () => (
        <div className="flex items-center justify-end gap-1 text-right">
          <ScissorsIcon className="size-3 text-muted-foreground" />
          Prendas
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-sm font-semibold tabular-nums">
            {row.original.totalGarments}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "totalYardsUsed",
      header: () => <div className="text-right">Yardas usadas</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-sm font-medium tabular-nums">
            {row.original.totalYardsUsed.toFixed(2)}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">yd</span>
        </div>
      ),
      meta: {
        className: "hidden sm:table-cell",
        headerClassName: "hidden sm:table-cell",
        mobileCardVisible: true,
        mobileLabel: "Yardas",
      },
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  href={`/production/${row.original.id}`}
                  className="flex items-center gap-2"
                >
                  <ArrowUpRight className="size-4" />
                  Detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/production/${row.original.id}/edit`}
                  className="flex items-center gap-2"
                >
                  <PencilLineIcon className="size-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                  onClick={() => setSessionToDelete(row.original)}
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
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="employeeName"
        searchPlaceholder="Buscar empleado..."
        emptyMessage="Sin sesiones de produccion"
        emptyDescription="Registra una nueva sesion para comenzar a medir rendimiento."
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="min-h-10 text-xs sm:min-h-9">
                <SelectValue placeholder="Empleado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={setDateRange}
            />
          </div>
        }
      />

      <AlertDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) =>
          !open && !isDeleting && setSessionToDelete(null)
        }
      >
        <AlertDialogContent className="px-4 py-4 sm:max-w-md sm:px-6 sm:py-6">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-center">
              ¿Eliminar sesión de producción?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-pretty">
              Esta acción devolverá las yardas utilizadas al inventario y
              eliminará el registro permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid w-full grid-cols-2 gap-2">
            <AlertDialogCancel disabled={isDeleting} className="w-full">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleDelete}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
