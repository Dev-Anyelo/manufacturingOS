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
    received: orderRows.filter((o) => o.status === WorkOrderStatus.received)
      .length,
    inProduction: orderRows.filter(
      (o) => o.status === WorkOrderStatus.in_production
    ).length,
    ready: orderRows.filter((o) => o.status === WorkOrderStatus.ready).length,
    deliveredToday: orderRows.filter((o) => {
      if (o.status !== WorkOrderStatus.delivered) return false
      const today = new Date()
      const d = new Date(o.deliveryDate)
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      )
    }).length,
  }

  return (
    <section className="page-shell">
      <div className="page-content space-y-6">
        <PageHeader
          title="Órdenes"
          description="Gestiona las órdenes de tus clientes y el proceso de producción."
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Órdenes" },
          ]}
          actions={
            <Button
              asChild
              size="default"
              className="min-h-11 w-full gap-2 shadow-sm sm:w-auto sm:min-h-10"
            >
              <Link href="/orders/new">
                <PlusIcon className="size-4 shrink-0" />
                Nueva orden
              </Link>
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          <StatCard
            title="Recibidos"
            value={stats.received}
            description="Pendientes de confirmar"
            icon={<ClipboardListIcon className="size-5" />}
          />
          <StatCard
            title="En producción"
            value={stats.inProduction}
            description="Actualmente en confección"
            icon={<ScissorsIcon className="size-5" />}
            variant={stats.inProduction > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Listos"
            value={stats.ready}
            description="Listos para entrega"
            icon={<PackageCheckIcon className="size-5" />}
            variant={stats.ready > 0 ? "success" : "default"}
          />
          <StatCard
            title="Entregados hoy"
            value={stats.deliveredToday}
            description="Entregas del día de hoy"
            icon={<TruckIcon className="size-5" />}
            variant={stats.deliveredToday > 0 ? "info" : "default"}
          />
        </div>

        {/* ── Workspace ── */}
        <OrdersWorkspace initialOrders={orderRows} />
      </div>
    </section>
  )
}
