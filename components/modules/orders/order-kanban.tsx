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

const columnStyles: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.received]: "border-t-slate-400",
  [WorkOrderStatus.confirmed]: "border-t-blue-500",
  [WorkOrderStatus.in_production]: "border-t-amber-500",
  [WorkOrderStatus.ready]: "border-t-brand",
  [WorkOrderStatus.delivered]: "border-t-emerald-600",
  [WorkOrderStatus.cancelled]: "border-t-red-500",
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
    data: {
      type: "card",
      status: order.status,
      order,
    },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
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
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: {
      type: "column",
      status,
    },
  })

  return (
    <div
      className={cn(
        "w-80 shrink-0 space-y-3 rounded-xl border border-t-2 border-border/60 bg-muted/20 p-3",
        columnStyles[status]
      )}
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {statusLabelMap[status]}
        </h3>
        <Badge variant="outline">{orders.length}</Badge>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 rounded-lg p-1 transition-colors",
          isOver && "bg-brand-muted"
        )}
      >
        <SortableContext
          items={orders.map((order) => order.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              Sin pedidos en esta etapa.
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

export function OrderKanban({
  ordersByStatus,
  onStatusIntent,
}: OrderKanbanProps) {
  const isMobile = useIsMobile()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [activeOrder, setActiveOrder] = React.useState<OrderSummaryItem | null>(
    null
  )
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

    if (candidate) {
      setActiveOrder(candidate as OrderSummaryItem)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveOrder(null)

    if (!event.over) {
      return
    }

    const draggedOrder = event.active.data.current?.order as
      | OrderSummaryItem
      | undefined

    if (!draggedOrder) {
      return
    }

    const overData = event.over.data.current as
      | { type?: string; status?: WorkOrderStatus }
      | undefined

    const targetStatus = overData?.status

    if (!targetStatus || targetStatus === draggedOrder.status) {
      return
    }

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
                  <span>{statusLabelMap[status]}</span>
                  <Badge variant="secondary" className="text-xs">
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
        className="flex gap-4 overflow-x-auto pb-2"
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
          <OrderCard order={activeOrder} className="w-80" />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
