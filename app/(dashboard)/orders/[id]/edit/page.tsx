import { notFound } from "next/navigation"
import { getWorkOrder, getOrderFormBootstrap } from "@/lib/data/orders"
import { PageHeader } from "@/components/shared/page-header"
import { OrderForm } from "@/components/modules/orders/order-form"
import { Currency } from "@prisma/client"
import { decimalToNumber } from "@/lib/api/utils"
import { WorkOrderStatus } from "@prisma/client"
import { redirect } from "next/navigation"

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const { id } = await params
  const [orderData, bootstrapData] = await Promise.all([
    getWorkOrder(id),
    getOrderFormBootstrap(),
  ])

  if (!orderData) notFound()

  if (
    orderData.status === WorkOrderStatus.delivered ||
    orderData.status === WorkOrderStatus.cancelled
  ) {
    redirect(`/orders/${orderData.id}`)
  }

  const customersData = bootstrapData.customers.map((customer) => ({
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
  }))

  const catalogItemsData = bootstrapData.catalogItems.map((item) => ({
    id: item.id,
    name: item.name,
    garmentType: item.garmentType,
    salePrice: decimalToNumber(item.salePrice),
  }))

  const inventoryItemsData = bootstrapData.inventoryItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: decimalToNumber(item.quantity),
  }))

  return (
    <div className="page-shell">
      <PageHeader
        title={`Editar Pedido #${orderData.id.slice(0, 8)}`}
        description="Actualiza la información del pedido."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Pedidos", href: "/orders" },
          { label: "Detalles", href: `/orders/${orderData.id}` },
          { label: "Editar" },
        ]}
      />
      <div className="page-content">
        <OrderForm
          customers={customersData}
          catalogItems={catalogItemsData}
          inventoryItems={inventoryItemsData}
          orderId={orderData.id}
          defaultValues={{
            customer_id: orderData.customerId,
            delivery_date: orderData.deliveryDate.toISOString().split("T")[0],
            channel: orderData.channel as any,
            advance_paid: decimalToNumber(orderData.advancePaid),
            advance_paid_currency: orderData.advancePaidCurrency as Currency,
            total: decimalToNumber(orderData.total),
            total_currency: orderData.totalCurrency as Currency,
            balance_due_currency: orderData.totalCurrency as Currency,
            notes: orderData.notes,
            reference_images: orderData.referenceImages,
            items: orderData.items.map((item: any) => ({
              catalog_item_id: item.catalogItemId,
              description: item.description,
              size: item.size,
              inventory_item_id: item.inventoryItemId,
              color: item.color,
              design_notes: item.designNotes,
              quantity: item.quantity,
              unit_price: decimalToNumber(item.unitPrice),
              unit_price_currency: item.unitPriceCurrency as Currency,
              measurements: item.measurements as any,
            })),
          }}
        />
      </div>
    </div>
  )
}
