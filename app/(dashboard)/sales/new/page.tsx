import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getSalesPosBootstrap } from "@/lib/data/sales"
import { PageHeader } from "@/components/shared/page-header"
import { PosInterface } from "@/components/modules/sales/pos-interface"

export default async function NewSalePage() {
  const { catalogItems, customers } = await getSalesPosBootstrap()

  return (
    <section className="flex h-[calc(100vh-var(--header-height))] min-h-0 flex-col md:h-full">
      <PageHeader
        title="Nueva Venta"
        description="Registra ventas con cálculo de pago y recibo."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/sales">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Ventas", href: "/sales" },
          { label: "Nueva venta" },
        ]}
      />
      <div className="mt-1 flex-1">
        <PosInterface
          catalogItems={catalogItems.map((item) => ({
            id: item.id,
            name: item.name,
            garmentType: item.garmentType,
            salePrice: decimalToNumber(item.salePrice),
            imageUrl: item.imageUrl,
          }))}
          customers={customers.map((customer) => ({
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
          }))}
        />
      </div>
    </section>
  )
}
