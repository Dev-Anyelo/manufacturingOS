import Link from "next/link"
import { notFound } from "next/navigation"
import { getSaleById } from "@/lib/data/sales"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCurrentUser } from "@/lib/auth/current-user"
import { ArrowLeft, ClipboardList, Plus } from "lucide-react"
import { SaleDetail } from "@/components/modules/sales/sale-detail"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Ventas / Detalle</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Detalle de venta
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta items, pagos y estado para esta venta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/sales">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Volver
            </Link>
          </Button>
          {sale.status !== "paid" ? (
            <UpdateSalePaymentButton saleId={sale.id} />
          ) : null}
          <Button asChild size="sm">
            <Link href="/sales/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva venta
            </Link>
          </Button>
        </div>
      </div>

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
