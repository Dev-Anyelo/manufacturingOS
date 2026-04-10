"use client"

import Link from "next/link"
import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "lucide-react"

import { DataTable } from "@/components/shared/data-table"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
  }).format(new Date(value))
}

function initials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const columns: ColumnDef<ProductionTableRow>[] = [
  {
    accessorKey: "sessionDate",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.sessionDate)}</span>
    ),
  },
  {
    accessorKey: "employeeName",
    header: "Empleado",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{initials(row.original.employeeName)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{row.original.employeeName}</span>
      </div>
    ),
  },
  {
    accessorKey: "totalGarments",
    header: () => <div className="text-right">Prendas</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm">{row.original.totalGarments}</div>
    ),
  },
  {
    accessorKey: "totalYardsUsed",
    header: () => <div className="text-right">Yardas</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm">
        {row.original.totalYardsUsed.toFixed(2)}
      </div>
    ),
    meta: {
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
  },
  {
    accessorKey: "createdByName",
    header: "Registrado por",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.createdByName}
      </span>
    ),
    meta: {
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button asChild variant="ghost" size="sm" className="justify-start">
        <Link href={`/production/${row.original.id}`}>
          <EyeIcon className="size-4" />
          Ver
        </Link>
      </Button>
    ),
  },
]

export function ProductionTable({ sessions }: ProductionTableProps) {
  const [employeeFilter, setEmployeeFilter] = React.useState("all")
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date }>(
    {}
  )

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

      const currentDate = new Date(session.sessionDate)

      if (dateRange.from && currentDate < dateRange.from) {
        return false
      }

      if (dateRange.to) {
        const inclusiveTo = new Date(dateRange.to)
        inclusiveTo.setHours(23, 59, 59, 999)

        if (currentDate > inclusiveTo) {
          return false
        }
      }

      return true
    })
  }, [dateRange.from, dateRange.to, employeeFilter, sessions])

  return (
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
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Empleado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
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
  )
}
