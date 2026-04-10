import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getWorkOrders } from "@/lib/data/orders"
import { OrdersWorkspace } from "@/components/modules/orders/orders-workspace"

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

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-6">
      <PageHeader
        title="Pedidos"
        description="Gestiona pedidos a medida con estado de produccion y entrega."
        actions={
          <Button asChild className="bg-brand text-brand-foreground">
            <Link href="/orders/new">Nuevo pedido</Link>
          </Button>
        }
      />

      <OrdersWorkspace initialOrders={orderRows} />
    </div>
  )
}
