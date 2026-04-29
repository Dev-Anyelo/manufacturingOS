import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getOrderFormBootstrap } from "@/lib/data/orders"
import { PageHeader } from "@/components/shared/page-header"
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
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Pedidos", href: "/orders" },
          { label: "Nuevo pedido" },
        ]}
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
