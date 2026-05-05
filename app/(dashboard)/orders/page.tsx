import { WorkOrderStatus } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { PageHeader } from "@/components/shared/page-header"
import { KpiSection } from "@/components/shared/kpi-section"
import { normalizeDateOnly } from "@/lib/currency/exchange"
import { requireCurrentUser } from "@/lib/auth/current-user"
import { CompactKpiCard } from "@/components/shared/compact-kpi-card"
import { getWorkOrders, getOrderFormBootstrap } from "@/lib/data/orders"
import { NewOrderSheet } from "@/components/modules/orders/new-order-sheet"
import { OrdersWorkspace } from "@/components/modules/orders/orders-workspace"

import {
  ClipboardListIcon,
  PackageCheckIcon,
  ScissorsIcon,
  TruckIcon,
} from "lucide-react"

export default async function OrdersPage() {
  const [orders, bootstrap, currentUser] = await Promise.all([
    getWorkOrders(),
    getOrderFormBootstrap(),
    requireCurrentUser(),
  ])

  const orderRows = orders.map((order) => ({
    id: order.id,
    customerId: order.customerId,
    customerName: order.customer.fullName,
    receivedDate: order.receivedDate.toISOString().slice(0, 10),
    deliveryDate: order.deliveryDate.toISOString().slice(0, 10),
    status: order.status,
    channel: order.channel,
    advancePaid: decimalToNumber(order.advancePaid),
    advancePaidCurrency: order.advancePaidCurrency,
    total: decimalToNumber(order.total),
    totalCurrency: order.totalCurrency,
    balanceDue: decimalToNumber(order.balanceDue),
    balanceDueCurrency: order.totalCurrency,
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
      const today = normalizeDateOnly(new Date())
      const deliveryDate = normalizeDateOnly(o.deliveryDate)
      return (
        today !== null &&
        deliveryDate !== null &&
        deliveryDate.getTime() === today.getTime()
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
            <NewOrderSheet
              customers={bootstrap.customers.map((c) => ({
                id: c.id,
                fullName: c.fullName,
                phone: c.phone,
                email: c.email,
              }))}
              catalogItems={bootstrap.catalogItems.map((c) => ({
                id: c.id,
                name: c.name,
                garmentType: c.garmentType,
                salePrice: decimalToNumber(c.salePrice),
              }))}
              inventoryItems={bootstrap.inventoryItems.map((i) => ({
                id: i.id,
                name: i.name,
                unit: i.unit,
                quantity: decimalToNumber(i.quantity),
              }))}
            />
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
        <OrdersWorkspace
          initialOrders={orderRows}
          canDelete={
            currentUser.role === "admin" || currentUser.role === "manager"
          }
        />
      </div>
    </section>
  )
}
