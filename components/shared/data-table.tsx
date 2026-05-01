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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  mobileHidden?: boolean
  mobileLabel?: string
  mobileCardVisible?: boolean
}

function humanizeLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function isHiddenOnMobile(meta?: ColumnMeta) {
  if (meta?.mobileCardVisible) {
    return false
  }

  return Boolean(
    meta?.mobileHidden || /(^|\s)hidden(\s|$)/.test(meta?.className ?? "")
  )
}

function getMobileColumnLabel<TData, TValue>(
  column: ColumnDef<TData, TValue>,
  fallbackId: string
) {
  const meta = column.meta as ColumnMeta | undefined

  if (meta?.mobileLabel) {
    return meta.mobileLabel
  }

  if (fallbackId === "actions") {
    return "Acciones"
  }

  if (typeof column.header === "string") {
    return column.header
  }

  const accessorKey = (column as { accessorKey?: string | number }).accessorKey
  if (typeof accessorKey === "string") {
    return humanizeLabel(accessorKey)
  }

  return humanizeLabel(fallbackId)
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
  const pageCount = Math.max(table.getPageCount(), 1)
  const currentPage = Math.min(pagination.pageIndex + 1, pageCount)

  const mobileRows = rows.filter((row) => row.getVisibleCells().length > 0)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-2.5">
            {searchKey ? (
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder={searchPlaceholder}
                className="w-full sm:max-w-xs"
                isLoading={isLoading}
              />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`mobile-skeleton-${index}`}
              className="rounded-xl border border-border/70 bg-card/95 p-4 shadow-card"
            >
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : mobileRows.length > 0 ? (
          mobileRows.map((row) => {
            const allCells = row.getVisibleCells()
            const actionCell = allCells.find(
              (cell) => cell.column.id === "actions"
            )
            const visibleCells = allCells.filter((cell) => {
              if (cell.column.id === "actions") {
                return false
              }

              const meta = cell.column.columnDef.meta as ColumnMeta | undefined
              return !isHiddenOnMobile(meta)
            })

            const primaryCell = visibleCells[0]
            const secondaryCells = visibleCells.slice(1)

            return (
              <article
                key={row.id}
                className={cn(
                  "rounded-md px-4 py-3 border border-border/70 bg-card/95 shadow-card",
                  getRowClassName?.(row.original)
                )}
              >
                {primaryCell ? (
                  <div className="space-y-1.5">
                    <p className="label-overline">
                      {getMobileColumnLabel(
                        primaryCell.column.columnDef,
                        primaryCell.column.id
                      )}
                    </p>
                    <div className="min-w-0 text-sm leading-relaxed font-semibold text-foreground">
                      {flexRender(
                        primaryCell.column.columnDef.cell,
                        primaryCell.getContext()
                      )}
                    </div>
                  </div>
                ) : null}

                {secondaryCells.length > 0 ? (
                  <dl className="mt-4 grid gap-3 grid-cols-2">
                    {secondaryCells.map((cell) => (
                      <div
                        key={cell.id}
                        className="space-y-1 rounded-lg border border-border/60 bg-muted/10 p-2.5"
                      >
                        <dt className="label-overline">
                          {getMobileColumnLabel(
                            cell.column.columnDef,
                            cell.column.id
                          )}
                        </dt>
                        <dd className="text-sm leading-relaxed text-foreground">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {actionCell ? (
                  <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
                    {flexRender(
                      actionCell.column.columnDef.cell,
                      actionCell.getContext()
                    )}
                  </div>
                ) : null}
              </article>
            )
          })
        ) : (
          <EmptyState
            icon={<InboxIcon />}
            title={emptyMessage}
            description={emptyDescription}
            action={emptyAction}
            compact
          />
        )}
      </div>

      <div className="table-enterprise hidden overflow-hidden md:block">
        <Table className="min-w-180">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border hover:bg-transparent"
              >
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
                        "label-overline h-11 bg-(--table-header)",
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
                    "h-13 cursor-pointer border-b border-border/55 transition-colors duration-100 hover:bg-muted/50",
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | ColumnMeta
                      | undefined
                    const alignActions =
                      cell.column.id === "actions" ? "text-right" : ""
                    const isCodeLikeColumn = /id|code|codigo/i.test(
                      cell.column.id
                    )
                    const firstColumnAccent =
                      cell.column.getIndex() === 0 && isCodeLikeColumn

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-4 text-sm",
                          firstColumnAccent && "mono-code text-brand",
                          meta?.className,
                          alignActions
                        )}
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
                <TableCell colSpan={columns.length} className="h-56">
                  <EmptyState
                    icon={<InboxIcon />}
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
        <p className="body-muted">
          Mostrando {start}–{end} de {total} resultados
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Pagina {currentPage} de {pageCount}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Filas por pagina</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) =>
                setPagination((prev) => ({
                  pageIndex: 0,
                  pageSize: Number(value),
                }))
              }
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-4" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
