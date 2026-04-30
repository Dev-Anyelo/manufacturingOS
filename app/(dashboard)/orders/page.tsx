import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkOrderStatus } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { getWorkOrders } from "@/lib/data/orders"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
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

        <KpiSection label="Resumen de órdenes">
          <CompactKpiCard
            label="Recibidos"
            value={stats.received}
            icon={<ClipboardListIcon />}
            iconClass="bg-muted text-muted-foreground"
          />
          <CompactKpiCard
            label="En producción"
            value={stats.inProduction}
            icon={<ScissorsIcon />}
            iconClass={
              stats.inProduction > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Listos"
            value={stats.ready}
            icon={<PackageCheckIcon />}
            iconClass={
              stats.ready > 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            }
          />
          <CompactKpiCard
            label="Entregados hoy"
            value={stats.deliveredToday}
            icon={<TruckIcon />}
            iconClass={
              stats.deliveredToday > 0
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
            }
          />
        </KpiSection>

        {/* ── Workspace ── */}
        <OrdersWorkspace initialOrders={orderRows} />
      </div>
    </section>
  )
}
