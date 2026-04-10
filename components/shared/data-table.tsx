"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  isLoading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  toolbar?: React.ReactNode
  getRowClassName?: (rowData: TData) => string
}

type ColumnMeta = {
  className?: string
  headerClassName?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
  isLoading = false,
  emptyMessage = "Sin resultados",
  emptyDescription = "Ajusta tus filtros o crea un nuevo registro.",
  emptyAction,
  toolbar,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [searchValue, setSearchValue] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchValue.trim()) {
      return data
    }

    const normalized = searchValue.toLowerCase()

    return data.filter((row) => {
      const value = (row as Record<string, unknown>)[searchKey]
      return String(value ?? "")
        .toLowerCase()
        .includes(normalized)
    })
  }, [data, searchKey, searchValue])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const rows = table.getRowModel().rows
  const total = filteredData.length
  const start = total === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const end = Math.min(total, (pagination.pageIndex + 1) * pagination.pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchKey ? (
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder={searchPlaceholder}
            className="w-full sm:max-w-sm"
            isLoading={isLoading}
          />
        ) : (
          <div />
        )}
        {toolbar ? (
          <div className="flex items-center gap-2">{toolbar}</div>
        ) : null}
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | ColumnMeta
                    | undefined
                  const alignActions =
                    header.column.id === "actions" ? "text-right" : ""

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        meta?.headerClassName,
                        meta?.className,
                        alignActions
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={`${column.id ?? columnIndex}-${index}`}>
                      <Skeleton className="h-4 w-full max-w-48" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/40",
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | ColumnMeta
                      | undefined
                    const alignActions =
                      cell.column.id === "actions" ? "text-right" : ""

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(meta?.className, alignActions)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-52">
                  <EmptyState
                    icon={InboxIcon}
                    title={emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                    compact
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {start}-{end} de {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-4" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
