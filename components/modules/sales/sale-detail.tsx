import { SaleStatus } from "@prisma/client"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface SaleDetailData {
  id: string
  saleDate: Date
  channel: string
  paymentMethod: string
  total: number
  discount: number
  amountPaid: number
  changeGiven: number
  balanceDue: number
  status: SaleStatus
  customerName: string
  customerPhone?: string | null
  customerEmail?: string | null
  items: Array<{
    id: string
    description: string
    size: string | null
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
  }>
}

const channelLabelMap: Record<string, string> = {
  in_person: "En tienda",
  order: "Pedido",
  whatsapp: "WhatsApp",
  marketplace: "Marketplace",
  other: "Otro",
}

const paymentMethodLabelMap: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit: "Credito",
  mixed: "Mixto",
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export function SaleDetail({ sale }: { sale: SaleDetailData }) {
  const totalItems = sale.items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Total venta
            </p>
            <CurrencyDisplay
              amount={sale.total}
              size="lg"
              className="font-semibold"
            />
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Pagado
            </p>
            <CurrencyDisplay
              amount={sale.amountPaid}
              size="lg"
              className="font-semibold"
            />
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Descuento
            </p>
            <CurrencyDisplay
              amount={sale.discount}
              size="lg"
              className="font-semibold"
            />
          </CardContent>
        </Card>
        <Card className="border border-border shadow-sm">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Saldo pendiente
            </p>
            <CurrencyDisplay
              amount={sale.balanceDue}
              size="lg"
              className={
                sale.balanceDue > 0
                  ? "text-warning font-semibold"
                  : "font-semibold"
              }
            />
            <p className="text-xs text-muted-foreground">
              {totalItems} unidades vendidas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border border-border shadow-sm lg:col-span-2">
        <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Venta #{sale.id.slice(0, 8)}</span>
              <StatusBadge status={sale.status} type="sale" />
            </CardTitle>
            <CardDescription>
              Registrada el {formatDate(sale.saleDate)} •{" "}
              {channelLabelMap[sale.channel] ?? sale.channel}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Canal</p>
              <p className="text-sm font-medium">
                {channelLabelMap[sale.channel] ?? sale.channel}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Metodo de pago</p>
              <p className="text-sm font-medium">
                {paymentMethodLabelMap[sale.paymentMethod] ??
                  sale.paymentMethod}
              </p>
            </div>
          </CardContent>
        </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-4 text-sm">
            <p className="font-medium">{sale.customerName}</p>
            <p className="text-muted-foreground">
              {sale.customerPhone || "Sin telefono"}
            </p>
            <p className="text-muted-foreground">
              {sale.customerEmail || "Sin correo"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Items vendidos</CardTitle>
          <CardDescription>
            {sale.items.length} lineas de venta • {totalItems} unidades totales
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripcion</TableHead>
                <TableHead className="hidden sm:table-cell">Talla</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {item.size ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.unitPrice} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.subtotal} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Resumen financiero</CardTitle>
          <CardDescription>
            Consolidado de caja de la transaccion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total bruto</span>
            <CurrencyDisplay amount={sale.total} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Descuento</span>
            <CurrencyDisplay amount={sale.discount} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pagado</span>
            <CurrencyDisplay amount={sale.amountPaid} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cambio</span>
            <CurrencyDisplay amount={sale.changeGiven} />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium">Saldo pendiente</span>
            <CurrencyDisplay
              amount={sale.balanceDue}
              className={sale.balanceDue > 0 ? "text-warning" : ""}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
