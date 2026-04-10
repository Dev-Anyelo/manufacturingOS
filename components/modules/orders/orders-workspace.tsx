"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { WorkOrderStatus } from "@prisma/client"
import { OrderKanban } from "@/components/modules/orders/order-kanban"
import { OrdersTable } from "@/components/modules/orders/orders-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChangeStatusDialog } from "@/components/modules/orders/change-status-dialog"

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

function groupByStatus(orders: OrderSummaryItem[]): OrderStatusColumns {
  const grouped = {
    [WorkOrderStatus.received]: [] as OrderSummaryItem[],
    [WorkOrderStatus.confirmed]: [] as OrderSummaryItem[],
    [WorkOrderStatus.in_production]: [] as OrderSummaryItem[],
    [WorkOrderStatus.ready]: [] as OrderSummaryItem[],
    [WorkOrderStatus.delivered]: [] as OrderSummaryItem[],
    [WorkOrderStatus.cancelled]: [] as OrderSummaryItem[],
  }

  for (const status of statuses) {
    grouped[status] = orders.filter((order) => order.status === status)
  }

  return grouped
}

interface OrdersWorkspaceProps {
  initialOrders: OrderSummaryItem[]
}

export function OrdersWorkspace({ initialOrders }: OrdersWorkspaceProps) {
  const router = useRouter()

  const [orders, setOrders] = React.useState(initialOrders)
  const [statusDialogState, setStatusDialogState] = React.useState<{
    order: OrderSummaryItem
    targetStatus: WorkOrderStatus
  } | null>(null)

  React.useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const grouped = React.useMemo(() => groupByStatus(orders), [orders])

  return (
    <>
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="table">Tabla</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <OrderKanban
            ordersByStatus={grouped}
            onStatusIntent={(order, targetStatus) => {
              setStatusDialogState({ order, targetStatus })
            }}
          />
        </TabsContent>

        <TabsContent value="table">
          <OrdersTable orders={orders} />
        </TabsContent>
      </Tabs>

      {statusDialogState ? (
        <ChangeStatusDialog
          orderId={statusDialogState.order.id}
          currentStatus={statusDialogState.order.status}
          targetStatus={statusDialogState.targetStatus}
          open={Boolean(statusDialogState)}
          onOpenChange={(open) => {
            if (!open) {
              setStatusDialogState(null)
            }
          }}
          onSuccess={() => {
            setOrders((previous) =>
              previous.map((order) => {
                if (order.id !== statusDialogState.order.id) {
                  return order
                }

                return {
                  ...order,
                  status: statusDialogState.targetStatus,
                }
              })
            )

            setStatusDialogState(null)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}
