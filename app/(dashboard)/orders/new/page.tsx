import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { decimalToNumber } from "@/lib/api/utils"
import { getOrderFormBootstrap } from "@/lib/data/orders"
import { OrderForm } from "@/components/modules/orders/order-form"

export default async function NewOrderPage() {
  const { customers, catalogItems, inventoryItems } =
    await getOrderFormBootstrap()

  return (
    <section className="page-shell">
      <PageHeader
        title="Nuevo pedido"
        description="Registra prendas, cliente y detalles de entrega para iniciar produccion."
        actions={
          <Button asChild variant="outline">
            <Link href="/orders">
              <ArrowLeftIcon className="size-4" />
              Volver a pedidos
            </Link>
          </Button>
        }
      />

      <div className="page-content">
        <OrderForm
          customers={customers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
          }))}
          catalogItems={catalogItems.map((item) => ({
            id: item.id,
            name: item.name,
            garmentType: item.garmentType,
            salePrice: decimalToNumber(item.salePrice),
          }))}
          inventoryItems={inventoryItems.map((item) => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            quantity: decimalToNumber(item.quantity),
          }))}
        />
      </div>
    </section>
  )
}
