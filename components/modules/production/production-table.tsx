"use client"

import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EyeIcon, ScissorsIcon } from "lucide-react"
import { type ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DateRangePicker } from "@/components/shared/date-range-picker"
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

function formatDateFull(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "full",
  }).format(new Date(value))
}

function getRelativeLabel(value: string) {
  const sessionDate = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (sessionDate.toDateString() === today.toDateString()) return "Hoy"
  if (sessionDate.toDateString() === yesterday.toDateString()) return "Ayer"
  return null
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
    cell: ({ row }) => {
      const relLabel = getRelativeLabel(row.original.sessionDate)
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-default">
              {relLabel ? (
                <div className="space-y-0.5">
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[10px] font-medium"
                  >
                    {relLabel}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(row.original.sessionDate)}
                  </p>
                </div>
              ) : (
                <span className="text-sm">
                  {formatDate(row.original.sessionDate)}
                </span>
              )}
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
          <AvatarFallback className="bg-brand-muted text-[10px] font-semibold text-brand">
            {initials(row.original.employeeName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{row.original.employeeName}</span>
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
    },
  },
  {
    accessorKey: "createdByName",
    header: "Registrado por",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
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
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
      >
        <Link href={`/production/${row.original.id}`}>
          <EyeIcon className="size-3.5" />
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
      if (dateRange.from && currentDate < dateRange.from) return false
      if (dateRange.to) {
        const inclusiveTo = new Date(dateRange.to)
        inclusiveTo.setHours(23, 59, 59, 999)
        if (currentDate > inclusiveTo) return false
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
            <SelectTrigger className="h-8 w-44 text-xs">
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
  )
}
