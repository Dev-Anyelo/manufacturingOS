"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { groupByStatus } from "@/lib/utils"
import { WorkOrderStatus } from "@prisma/client"
import { LayoutGridIcon, TableIcon } from "lucide-react"
import { OrderKanban } from "@/components/modules/orders/order-kanban"
import { OrdersTable } from "@/components/modules/orders/orders-table"
import type { OrderSummaryItem } from "@/components/modules/orders/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChangeStatusDialog } from "@/components/modules/orders/change-status-dialog"

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

  const quickSummary = React.useMemo(
    () => [
      {
        label: "Recibidos",
        value: grouped[WorkOrderStatus.received].length,
        className: "status-subtle",
      },
      {
        label: "En producción",
        value: grouped[WorkOrderStatus.in_production].length,
        className: "status-warning",
      },
      {
        label: "Listos",
        value: grouped[WorkOrderStatus.ready].length,
        className: "status-success",
      },
      {
        label: "Cancelados",
        value: grouped[WorkOrderStatus.cancelled].length,
        className: "status-danger",
      },
    ],
    [grouped]
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {quickSummary.map((item) => (
          <div
            key={item.label}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs ${item.className}`}
          >
            <span>{item.label}</span>
            <span className="font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList className="h-9 rounded-xl border border-border/60 bg-muted/20 p-1">
          <TabsTrigger
            value="kanban"
            className="h-7 gap-1.5 rounded-lg px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <LayoutGridIcon className="size-3.5" />
            Kanban
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="h-7 gap-1.5 rounded-lg px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <TableIcon className="size-3.5" />
            Tabla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-0">
          <OrderKanban
            ordersByStatus={grouped}
            onStatusIntent={(order, targetStatus) =>
              setStatusDialogState({ order, targetStatus })
            }
          />
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <OrdersTable orders={orders} />
        </TabsContent>
      </Tabs>

      {statusDialogState && (
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
      )}
    </>
  )
}
