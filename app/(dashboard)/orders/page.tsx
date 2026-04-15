import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrderStatus } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { getWorkOrders } from "@/lib/data/orders"
import { StatCard } from "@/components/shared/stat-card"
import { PageHeader } from "@/components/shared/page-header"
import { OrdersWorkspace } from "@/components/modules/orders/orders-workspace"

import {
  ClipboardListIcon,
  PackageCheckIcon,
  ScissorsIcon,
  TruckIcon,
} from "lucide-react"

export default async function OrdersPage() {
  const orders = await getWorkOrders()

  const orderRows = orders.map((order) => ({
    id: order.id,
    customerId: order.customerId,
    customerName: order.customer.fullName,
    receivedDate: order.receivedDate.toISOString(),
    deliveryDate: order.deliveryDate.toISOString(),
    status: order.status,
    channel: order.channel,
    advancePaid: decimalToNumber(order.advancePaid),
    total: decimalToNumber(order.total),
    balanceDue: decimalToNumber(order.balanceDue),
    notes: order.notes,
    cancelledReason: order.cancelledReason,
    garmentCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
  }))

  const stats = {
    received: orderRows.filter((o) => o.status === WorkOrderStatus.received).length,
    inProduction: orderRows.filter((o) => o.status === WorkOrderStatus.in_production).length,
    ready: orderRows.filter((o) => o.status === WorkOrderStatus.ready).length,
    deliveredToday: orderRows.filter((o) => {
      if (o.status !== WorkOrderStatus.delivered) return false
      const today = new Date()
      const delivery = new Date(o.deliveryDate)
      return (
        delivery.getFullYear() === today.getFullYear() &&
        delivery.getMonth() === today.getMonth() &&
        delivery.getDate() === today.getDate()
      )
    }).length,
  }

  return (
    <section className="flex min-h-full flex-col gap-4">
      <div className="mx-auto w-full space-y-4">
        <PageHeader
          title="Pedidos"
          description="Gestiona pedidos a medida con estado de produccion y entrega."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Pedidos" },
          ]}
          actions={
            <Button
              asChild
              size="sm"
              className="h-9 bg-brand px-4 font-medium text-brand-foreground hover:bg-brand/90"
            >
              <Link href="/orders/new">
                <PlusIcon className="size-4" />
                Nuevo pedido
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="Recibidos"
            value={stats.received}
            description="Pedidos recibidos pendientes de confirmar"
            icon={<ClipboardListIcon className="size-5" />}
          />
          <StatCard
            title="En produccion"
            value={stats.inProduction}
            description="Pedidos actualmente en confeccion"
            icon={<ScissorsIcon className="size-5" />}
            variant={stats.inProduction > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Listos"
            value={stats.ready}
            description="Pedidos listos para entrega"
            icon={<PackageCheckIcon className="size-5" />}
            variant={stats.ready > 0 ? "success" : "default"}
          />
          <StatCard
            title="Entregados hoy"
            value={stats.deliveredToday}
            description="Pedidos entregados en el dia de hoy"
            icon={<TruckIcon className="size-5" />}
          />
        </div>

        <OrdersWorkspace initialOrders={orderRows} />
      </div>
    </section>
  )
}
