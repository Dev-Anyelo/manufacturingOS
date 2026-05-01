"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { groupByStatus } from "@/lib/utils"
import { WorkOrderStatus } from "@prisma/client"
import { OrderKanban } from "@/components/modules/orders/order-kanban"
import { OrdersTable } from "@/components/modules/orders/orders-table"
import type { OrderSummaryItem } from "@/components/modules/orders/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChangeStatusDialog } from "@/components/modules/orders/change-status-dialog"
import { Button } from "@/components/ui/button"
import { LayoutGridIcon, TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrdersWorkspaceProps {
  initialOrders: OrderSummaryItem[]
}

type PipelineFilter =
  | "all"
  | "received_bucket"
  | "in_production"
  | "ready"
  | "cancelled"

const PIPELINE_OPTIONS: Array<{ key: PipelineFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "received_bucket", label: "Recibidos" },
  { key: "in_production", label: "En producción" },
  { key: "ready", label: "Listos" },
  { key: "cancelled", label: "Cancelados" },
]

function matchesPipeline(order: OrderSummaryItem, filter: PipelineFilter) {
  switch (filter) {
    case "all":
      return true
    case "received_bucket":
      return (
        order.status === WorkOrderStatus.received ||
        order.status === WorkOrderStatus.confirmed
      )
    case "in_production":
      return order.status === WorkOrderStatus.in_production
    case "ready":
      return order.status === WorkOrderStatus.ready
    case "cancelled":
      return order.status === WorkOrderStatus.cancelled
  }
}

export function OrdersWorkspace({ initialOrders }: OrdersWorkspaceProps) {
  const router = useRouter()
  const [orders, setOrders] = React.useState(initialOrders)
  const [pipelineFilter, setPipelineFilter] =
    React.useState<PipelineFilter>("all")
  const [statusDialogState, setStatusDialogState] = React.useState<{
    order: OrderSummaryItem
    targetStatus: WorkOrderStatus
  } | null>(null)

  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const pipelineCounts = React.useMemo(() => {
    return {
      all: orders.length,
      received_bucket: orders.filter((o) =>
        matchesPipeline(o, "received_bucket")
      ).length,
      in_production: orders.filter((o) => matchesPipeline(o, "in_production"))
        .length,
      ready: orders.filter((o) => matchesPipeline(o, "ready")).length,
      cancelled: orders.filter((o) => matchesPipeline(o, "cancelled")).length,
    }
  }, [orders])

  const filteredOrders = React.useMemo(
    () => orders.filter((o) => matchesPipeline(o, pipelineFilter)),
    [orders, pipelineFilter]
  )

  const grouped = React.useMemo(
    () => groupByStatus(filteredOrders),
    [filteredOrders]
  )

  return (
    <>
      <div className="space-y-3">
        <p className="label-overline text-muted-foreground">
          Filtrar por etapa del embudo
        </p>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
          {PIPELINE_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              type="button"
              variant={pipelineFilter === key ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "h-10 shrink-0 rounded-lg px-3 text-xs font-medium sm:h-9 sm:text-sm",
                pipelineFilter === key && "border-primary/35 bg-primary/10"
              )}
              onClick={() => setPipelineFilter(key)}
            >
              <span>{label}</span>
              <span className="ml-1.5 inline-flex min-w-5 justify-center rounded-full border border-border/80 bg-background/80 px-1.5 text-[11px] font-semibold tabular-nums">
                {pipelineCounts[key]}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">
            <LayoutGridIcon className="size-4 shrink-0" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon className="size-4 shrink-0" />
            Tabla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0 focus-visible:outline-none">
          <OrderKanban
            ordersByStatus={grouped}
            onStatusIntent={(order, targetStatus) =>
              setStatusDialogState({ order, targetStatus })
            }
          />
        </TabsContent>

        <TabsContent value="table" className="mt-0 focus-visible:outline-none">
          <OrdersTable orders={filteredOrders} suppressStatusFilter />
        </TabsContent>
      </Tabs>

      {statusDialogState ? (
        <ChangeStatusDialog
          orderId={statusDialogState.order.id}
          currentStatus={statusDialogState.order.status}
          targetStatus={statusDialogState.targetStatus}
          open={Boolean(statusDialogState)}
          onOpenChange={(open) => {
            if (!open) setStatusDialogState(null)
          }}
          onSuccess={() => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id !== statusDialogState.order.id
                  ? o
                  : { ...o, status: statusDialogState.targetStatus }
              )
            )
            setStatusDialogState(null)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}
