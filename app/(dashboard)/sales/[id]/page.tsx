import Link from "next/link"
import { notFound } from "next/navigation"
import { getSaleById } from "@/lib/data/sales"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ArrowLeft, Plus } from "lucide-react"
import { SaleDetail } from "@/components/modules/sales/sale-detail"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-6">
      <PageHeader
        title={`Venta #${sale.id.slice(0, 8)}`}
        description="Consulta items, pagos y estado para esta venta."
        breadcrumbs={[
          { label: "Ventas", href: "/sales" },
          { label: `#${sale.id.slice(0, 8)}` },
        ]}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/sales">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Volver
              </Link>
            </Button>
            {sale.status !== "paid" ? (
              <UpdateSalePaymentButton saleId={sale.id} />
            ) : null}
            <Button
              asChild
              size="sm"
            >
              <Link href="/sales/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Nueva venta
              </Link>
            </Button>
          </>
        }
      />

      <SaleDetail
        sale={{
          id: sale.id,
          saleDate: sale.saleDate,
          channel: sale.channel,
          paymentMethod: sale.paymentMethod,
          total: decimalToNumber(sale.total),
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
            discount: decimalToNumber(item.discount),
            subtotal: decimalToNumber(item.subtotal),
          })),
        }}
      />

      <Card className="border border-dashed border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">
            Siguiente paso recomendado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Si el cliente tiene saldo pendiente, registra el abono desde la ficha
          de cobros cuando el prompt de Cuentas por cobrar este habilitado.
        </CardContent>
      </Card>
    </div>
  )
}
