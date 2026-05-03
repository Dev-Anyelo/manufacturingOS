import Link from "next/link"
import { notFound } from "next/navigation"
import { getSaleById } from "@/lib/data/sales"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCurrentUser } from "@/lib/auth/current-user"
import { PageHeader } from "@/components/shared/page-header"
import { SaleDetail } from "@/components/modules/sales/sale-detail"
import { UpdateSalePaymentButton } from "@/components/modules/sales/update-sale-payment-button"

interface SaleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const user = await getCurrentUser()
  if (!user) {
    notFound()
  }

  const { id } = await params
  const sale = await getSaleById(id)

  if (!sale) {
    notFound()
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={`Venta #${sale.id.slice(0, 8)}`}
        description="Consulta items, pagos y estado para esta venta."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Ventas", href: "/sales" },
          { label: `#${sale.id.slice(0, 8)}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="max-w-fit"
            >
              <Link href="/sales">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            {sale.status !== "paid" ? (
              <UpdateSalePaymentButton 
                saleId={sale.id}
                balanceDue={decimalToNumber(sale.balanceDue)}
              />
            ) : null}
            <Button asChild size="sm" className="max-w-fit">
              <Link href="/sales/new">
                <Plus className="h-4 w-4" />
                <span className="hidden md:block">Nueva venta</span>
              </Link>
            </Button>
          </div>
        }
      />

      <div className="page-content space-y-6">
        <SaleDetail
          sale={{
            id: sale.id,
            saleDate: sale.saleDate,
            channel: sale.channel,
            paymentMethod: sale.paymentMethod,
            total: decimalToNumber(sale.total),
            totalCurrency: sale.totalCurrency,
            discount: decimalToNumber(sale.discount),
            amountPaid: decimalToNumber(sale.amountPaid),
            changeGiven: decimalToNumber(sale.changeGiven),
            balanceDue: decimalToNumber(sale.balanceDue),
            status: sale.status,
            customerName: sale.customer?.fullName ?? "Cliente ocasional",
            customerPhone: sale.customer?.phone,
            customerEmail: sale.customer?.email,
            items: sale.items.map((item) => ({
              id: item.id,
              description: item.description,
              size: item.size,
              quantity: item.quantity,
              unitPrice: decimalToNumber(item.unitPrice),
              unitPriceCurrency: item.unitPriceCurrency,
              discount: decimalToNumber(item.discount),
              subtotal: decimalToNumber(item.subtotal),
            })),
          }}
        />
      </div>
    </div>
  )
}
