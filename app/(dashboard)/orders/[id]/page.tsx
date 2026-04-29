import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getWorkOrderDetail } from "@/lib/data/orders"
import { PageHeader } from "@/components/shared/page-header"
import { OrderDetail } from "@/components/modules/orders/order-detail"

interface OrderDetailPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params
  const data = await getWorkOrderDetail(id)

  if (!data.order) {
    notFound()
  }

  const order = data.order

  return (
    <section className="page-shell">
      <PageHeader
        title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
        description="Detalle completo del pedido, flujo de producción y trazabilidad."
        breadcrumbs={[
          { label: "Pedidos", href: "/orders" },
          { label: `#${order.id.slice(0, 8).toUpperCase()}` },
        ]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              <ArrowLeftIcon className="size-3.5" />
              Volver
            </Link>
          </Button>
        }
      />
      <div className="page-content">
        <OrderDetail
          order={{
            id: order.id,
            customerId: order.customerId,
            customerName: order.customer.fullName,
            customerPhone: order.customer.phone,
            customerEmail: order.customer.email,
            receivedDate: order.receivedDate.toISOString(),
            deliveryDate: order.deliveryDate.toISOString(),
            status: order.status,
            channel: order.channel,
            advancePaid: decimalToNumber(order.advancePaid),
            total: decimalToNumber(order.total),
            balanceDue: decimalToNumber(order.balanceDue),
            notes: order.notes,
            cancelledReason: order.cancelledReason,
            referenceImages: order.referenceImages,
            items: order.items.map((item) => ({
              id: item.id,
              description: item.description,
              size: item.size,
              color: item.color,
              designNotes: item.designNotes,
              quantity: item.quantity,
              unitPrice: decimalToNumber(item.unitPrice),
              subtotal: decimalToNumber(item.subtotal),
              measurements:
                item.measurements && typeof item.measurements === "object"
                  ? (item.measurements as Record<string, unknown>)
                  : null,
              catalogItemName: item.catalogItem?.name ?? null,
              inventoryItemName: item.inventoryItem?.name ?? null,
            })),
            statusHistory: data.statusHistory.map((entry) => ({
              id: entry.id,
              action: entry.action,
              createdAt: entry.createdAt.toISOString(),
              actorName: entry.createdByProfile?.fullName ?? null,
            })),
          }}
        />
      </div>
    </section>
  )
}
