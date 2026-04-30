"use client"

import * as React from "react"
import { cn, statusConfig } from "@/lib/utils"
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
import { FilterIcon, InboxIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

const statuses: WorkOrderStatus[] = [
  WorkOrderStatus.received,
  WorkOrderStatus.confirmed,
  WorkOrderStatus.in_production,
  WorkOrderStatus.ready,
  WorkOrderStatus.delivered,
  WorkOrderStatus.cancelled,
]

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
      className="touch-none"
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
  const cfg = statusConfig[status]
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  })

  return (
    <div className="flex min-w-[272px] flex-col lg:min-w-0">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-t-2xl border border-b-0 px-3.5 py-3",
          cfg.headerBg,
          cfg.border
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md text-inherit",
              cfg.badge ?? ""
            )}
          >
            {cfg.icon}
          </span>
          <h3 className="text-xs font-bold tracking-wide text-foreground/80">
            {cfg.label}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-xs font-bold",
            cfg.badge
          )}
        >
          {orders.length}
        </span>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-80 flex-1 space-y-2 rounded-b-2xl border border-t-0 p-2.5",
          "transition-all duration-100",
          cfg.bodyBg,
          cfg.border,
          isOver && "bg-primary/5 ring-1 ring-primary ring-inset"
        )}
      >
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <EmptyState
              icon={<InboxIcon />}
              title="Sin pedidos"
              description="No hay pedidos en esta etapa. Arrastra un pedido aquí o espera a que lleguen nuevos pedidos."
            />
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
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const [activeOrder, setActiveOrder] = React.useState<OrderSummaryItem | null>(
    null
  )
  const [mobileFilter, setMobileFilter] = React.useState<
    WorkOrderStatus | "all"
  >("all")

  const mobileList = React.useMemo(() => {
    if (mobileFilter === "all")
      return statuses.flatMap((s) => ordersByStatus[s])
    return ordersByStatus[mobileFilter]
  }, [mobileFilter, ordersByStatus])

  function handleDragStart(e: DragStartEvent) {
    const candidate = e.active.data.current?.order
    if (candidate) setActiveOrder(candidate as OrderSummaryItem)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveOrder(null)
    if (!e.over) return
    const dragged = e.active.data.current?.order as OrderSummaryItem | undefined
    if (!dragged) return
    const targetStatus = (e.over.data.current as any)?.status as
      | WorkOrderStatus
      | undefined
    if (!targetStatus || targetStatus === dragged.status) return
    onStatusIntent(dragged, targetStatus)
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FilterIcon className="size-4 text-muted-foreground" />
          <Select
            value={mobileFilter}
            onValueChange={(value) =>
              setMobileFilter(value as WorkOrderStatus | "all")
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl md:h-10">
              <SelectValue placeholder="Filtrar etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("size-2 rounded-full", statusConfig[s].dot)}
                    />
                    {statusConfig[s].label}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {ordersByStatus[s].length}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {mobileList.length === 0 ? (
            <EmptyState
              icon={<InboxIcon />}
              title="Sin pedidos para este filtro"
              description="No hay pedidos que coincidan con la etapa seleccionada."
              compact
            />
          ) : (
            mobileList.map((o) => <OrderCard key={o.id} order={o} />)
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
      <div className="-mx-4 overflow-x-auto pb-4 lg:mx-0">
        <div
          className="flex min-w-max gap-3 px-4 lg:grid lg:min-w-0 lg:grid-cols-6 lg:gap-3 lg:px-0"
          role="list"
        >
          {statuses.map((s) => (
            <KanbanColumn key={s} status={s} orders={ordersByStatus[s]} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeOrder && (
          <OrderCard
            order={activeOrder}
            className="w-72.5 rotate-1 shadow-2xl"
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
