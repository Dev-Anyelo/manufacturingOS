"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { WorkOrderStatus } from "@prisma/client"
import { OrderCard } from "@/components/modules/orders/order-card"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"

import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  OrderStatusColumns,
  OrderSummaryItem,
} from "@/components/modules/orders/types"

const statuses: WorkOrderStatus[] = [
  WorkOrderStatus.received,
  WorkOrderStatus.confirmed,
  WorkOrderStatus.in_production,
  WorkOrderStatus.ready,
  WorkOrderStatus.delivered,
  WorkOrderStatus.cancelled,
]

const statusLabelMap: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.received]: "Recibido",
  [WorkOrderStatus.confirmed]: "Confirmado",
  [WorkOrderStatus.in_production]: "En produccion",
  [WorkOrderStatus.ready]: "Listo",
  [WorkOrderStatus.delivered]: "Entregado",
  [WorkOrderStatus.cancelled]: "Cancelado",
}

const columnConfig: Record<
  WorkOrderStatus,
  {
    headerBg: string
    bodyBg: string
    borderColor: string
    badgeClasses: string
    dotColor: string
  }
> = {
  [WorkOrderStatus.received]: {
    headerBg: "bg-muted/60 border-slate-300/40 dark:border-slate-600/40",
    bodyBg: "bg-muted/20",
    borderColor: "border-slate-300/50 dark:border-slate-600/50",
    badgeClasses: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotColor: "bg-slate-400",
  },
  [WorkOrderStatus.confirmed]: {
    headerBg: "bg-blue-50/60 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/40",
    bodyBg: "bg-blue-50/20 dark:bg-blue-950/10",
    borderColor: "border-blue-200/50 dark:border-blue-800/50",
    badgeClasses: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  [WorkOrderStatus.in_production]: {
    headerBg: "bg-amber-50/60 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40",
    bodyBg: "bg-amber-50/20 dark:bg-amber-950/10",
    borderColor: "border-amber-200/50 dark:border-amber-800/50",
    badgeClasses: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  [WorkOrderStatus.ready]: {
    headerBg: "bg-emerald-50/60 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40",
    bodyBg: "bg-emerald-50/20 dark:bg-emerald-950/10",
    borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
    badgeClasses: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    dotColor: "bg-emerald-500",
  },
  [WorkOrderStatus.delivered]: {
    headerBg: "bg-brand-muted border-brand/20",
    bodyBg: "bg-brand-muted/40",
    borderColor: "border-brand/20",
    badgeClasses: "bg-success-soft text-success border-success-soft",
    dotColor: "bg-brand",
  },
  [WorkOrderStatus.cancelled]: {
    headerBg: "bg-red-50/60 border-red-200/60 dark:bg-red-950/20 dark:border-red-800/40",
    bodyBg: "bg-red-50/20 dark:bg-red-950/10",
    borderColor: "border-red-200/50 dark:border-red-800/50",
    badgeClasses: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
    dotColor: "bg-red-500",
  },
}

interface OrderKanbanProps {
  ordersByStatus: OrderStatusColumns
  onStatusIntent: (
    order: OrderSummaryItem,
    targetStatus: WorkOrderStatus
  ) => void
}

function SortableOrderCard({ order }: { order: OrderSummaryItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: order.id,
    data: { type: "card", status: order.status, order },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <OrderCard order={order} isDragging={isDragging} />
    </div>
  )
}

function KanbanColumn({
  status,
  orders,
}: {
  status: WorkOrderStatus
  orders: OrderSummaryItem[]
}) {
  const config = columnConfig[status]
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  })

  return (
    <div className="w-[270px] sm:w-[290px] shrink-0 flex flex-col">
      {/* Column header */}
      <div
        className={cn(
          "rounded-t-xl border px-3 py-2.5 flex items-center justify-between gap-2",
          config.headerBg,
          config.borderColor,
          "border-b-0"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn("h-2 w-2 rounded-full flex-shrink-0", config.dotColor)}
          />
          <h3 className="text-xs font-semibold text-foreground">
            {statusLabelMap[status]}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center justify-center h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold",
            config.badgeClasses
          )}
        >
          {orders.length}
        </span>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-b-xl border min-h-[400px] p-2 space-y-2 transition-colors duration-150 flex-1",
          config.bodyBg,
          config.borderColor,
          "border-t-0",
          isOver && "ring-2 ring-brand/40 ring-inset"
        )}
      >
        <SortableContext
          items={orders.map((order) => order.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border/40">
              <p className="text-xs text-muted-foreground/60">
                Sin pedidos
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <SortableOrderCard key={order.id} order={order} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function OrderKanban({ ordersByStatus, onStatusIntent }: OrderKanbanProps) {
  const isMobile = useIsMobile()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [activeOrder, setActiveOrder] = React.useState<OrderSummaryItem | null>(null)
  const [mobileStatusFilter, setMobileStatusFilter] = React.useState<
    WorkOrderStatus | "all"
  >("all")

  const mobileCounts = React.useMemo(() => {
    return statuses.reduce(
      (acc, status) => {
        acc[status] = ordersByStatus[status].length
        return acc
      },
      {} as Record<WorkOrderStatus, number>
    )
  }, [ordersByStatus])

  const mobileList = React.useMemo(() => {
    if (mobileStatusFilter === "all") {
      return statuses.flatMap((status) => ordersByStatus[status])
    }
    return ordersByStatus[mobileStatusFilter]
  }, [mobileStatusFilter, ordersByStatus])

  function handleDragStart(event: DragStartEvent) {
    const candidate = event.active.data.current?.order
    if (candidate) setActiveOrder(candidate as OrderSummaryItem)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null)
    if (!event.over) return
    const draggedOrder = event.active.data.current?.order as OrderSummaryItem | undefined
    if (!draggedOrder) return
    const overData = event.over.data.current as
      | { type?: string; status?: WorkOrderStatus }
      | undefined
    const targetStatus = overData?.status
    if (!targetStatus || targetStatus === draggedOrder.status) return
    onStatusIntent(draggedOrder, targetStatus)
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        <Select
          value={mobileStatusFilter}
          onValueChange={(value) =>
            setMobileStatusFilter(value as WorkOrderStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filtrar etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      columnConfig[status].dotColor
                    )}
                  />
                  <span>{statusLabelMap[status]}</span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {mobileCounts[status]}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-2" aria-live="polite">
          {mobileList.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Sin pedidos para el filtro actual.
            </div>
          ) : (
            mobileList.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex gap-3 overflow-x-auto pb-4 kanban-scroll -mx-1 px-1"
        role="list"
        aria-label="Tablero de pedidos por estado"
      >
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            orders={ordersByStatus[status]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <OrderCard order={activeOrder} className="w-[290px] rotate-1 shadow-xl" />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
