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
    <section className="page-shell">
      <PageHeader
        title="Nueva venta"
        description="Registra ventas en punto de venta con calculo de pago y recibo."
        actions={
          <Button asChild variant="outline">
            <Link href="/sales">
              <ArrowLeftIcon className="size-4" />
              Volver a ventas
            </Link>
          </Button>
        }
      />

      <div className="page-content mx-auto w-full max-w-350">
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
