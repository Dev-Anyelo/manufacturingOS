import { cn } from "@/lib/utils"
import { SaleStatus, Currency } from "@prisma/client"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatDateOnlyNI } from "@/lib/currency/exchange"

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

import {
  BanknoteIcon,
  CalendarIcon,
  CreditCardIcon,
  GlobeIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  ShoppingBagIcon,
  StoreIcon,
  ArrowLeftRightIcon,
  WalletIcon,
  PercentIcon,
  ReceiptIcon,
  UserCircleIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react"

export interface SaleDetailData {
  id: string
  saleDate: Date
  channel: string
  paymentMethod: string
  total: number
  totalCurrency: Currency
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
    unitPriceCurrency: Currency
    discount: number
    subtotal: number
  }>
}

const channelLabelMap: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  in_person: { label: "En tienda", icon: StoreIcon },
  order: { label: "Pedido", icon: ShoppingBagIcon },
  whatsapp: { label: "WhatsApp", icon: MessageCircleIcon },
  marketplace: { label: "Marketplace", icon: GlobeIcon },
  other: { label: "Otro", icon: MoreHorizontalIcon },
}

const paymentMethodLabelMap: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  cash: { label: "Efectivo", icon: BanknoteIcon },
  transfer: { label: "Transferencia", icon: CreditCardIcon },
  credit: { label: "Crédito", icon: CalendarIcon },
  mixed: { label: "Mixto", icon: ArrowLeftRightIcon },
}

function formatDate(value: Date) {
  return formatDateOnlyNI(value, "dd 'de' MMMM, yyyy")
}

export function SaleDetail({ sale }: { sale: SaleDetailData }) {
  const totalItems = sale.items.reduce((acc, item) => acc + item.quantity, 0)
  const paidProgress =
    sale.total > 0 ? Math.min((sale.amountPaid / sale.total) * 100, 100) : 0

  const ChannelIcon = channelLabelMap[sale.channel]?.icon ?? StoreIcon
  const PaymentIcon =
    paymentMethodLabelMap[sale.paymentMethod]?.icon ?? BanknoteIcon

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de la Venta"
          value={sale.total}
          currency={sale.totalCurrency}
          description={`${totalItems} unidades`}
          icon={<ReceiptIcon className="size-4" />}
        />
        <StatCard
          title="Monto Pagado"
          value={sale.amountPaid}
          currency={sale.totalCurrency}
          description={`${paidProgress.toFixed(0)}% pagado`}
          icon={<WalletIcon className="size-4" />}
          variant="success"
        />
        <StatCard
          title="Saldo Pendiente"
          value={sale.balanceDue}
          currency={sale.totalCurrency}
          description={
            sale.balanceDue > 0
              ? "Pago pendiente"
              : "Venta completamente pagada"
          }
          icon={<PercentIcon className="size-4" />}
          variant={sale.balanceDue > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Método de Pago"
          value={
            paymentMethodLabelMap[sale.paymentMethod]?.label ??
            sale.paymentMethod
          }
          description="Cómo pagó el cliente"
          icon={<PaymentIcon className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-md lg:col-span-2">
          <CardHeader className="border-b border-border/40 bg-muted/10 pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>
                    Detalles de la Venta{" "}
                    <span className="font-normal text-muted-foreground/60">
                      #{sale.id.slice(0, 8)}
                    </span>
                  </span>
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm text-pretty">
                  Registrada el {formatDate(sale.saleDate)}
                </CardDescription>
              </div>
              <StatusBadge status={sale.status} type="sale" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-background p-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <ChannelIcon className="size-5" />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Canal de Venta
                </p>
                <p className="text-base font-semibold">
                  {channelLabelMap[sale.channel]?.label ?? sale.channel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-background p-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <PaymentIcon className="size-5" />
              </div>
              <div>
                <p className="mb-0.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Método de Pago
                </p>
                <p className="text-base font-semibold">
                  {paymentMethodLabelMap[sale.paymentMethod]?.label ??
                    sale.paymentMethod}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b border-border/40 bg-muted/10">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircleIcon className="size-5 text-muted-foreground" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-base font-bold text-foreground">
                {sale.customerName}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground" />
                <span
                  className={cn(
                    sale.customerPhone
                      ? "text-foreground"
                      : "text-muted-foreground italic"
                  )}
                >
                  {sale.customerPhone || "Sin teléfono registrado"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MailIcon className="size-4 text-muted-foreground" />
                <span
                  className={cn(
                    sale.customerEmail
                      ? "text-foreground"
                      : "text-muted-foreground italic"
                  )}
                >
                  {sale.customerEmail || "Sin correo electrónico"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="shadow-md xl:col-span-2">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Artículos Vendidos</CardTitle>
                <CardDescription className="mt-1">
                  {sale.items.length} líneas • {totalItems} unidades totales
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-4 sm:p-6 md:hidden">
              {sale.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-card p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {item.description}
                      </p>
                      {item.size ? (
                        <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {item.size}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          Sin talla
                        </span>
                      )}
                    </div>
                    <CurrencyDisplay
                      amount={item.subtotal}
                      currency={item.unitPriceCurrency}
                      size="sm"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-2.5">
                      <p className="label-overline">Cantidad</p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {item.quantity}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-2.5">
                      <p className="label-overline">Unitario</p>
                      <div className="mt-1 text-sm font-medium text-foreground">
                        <CurrencyDisplay
                          amount={item.unitPrice}
                          currency={item.unitPriceCurrency}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%] pl-6">Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Talla
                    </TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Unitario</TableHead>
                    <TableHead className="pr-6 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow key={item.id} className="group transition-colors">
                      <TableCell className="py-4 pl-6">
                        <span className="font-semibold text-foreground">
                          {item.description}
                        </span>
                      </TableCell>
                      <TableCell className="hidden py-4 sm:table-cell">
                        {item.size ? (
                          <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {item.size}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="py-4 text-right text-muted-foreground">
                        <CurrencyDisplay
                          amount={item.unitPrice}
                          currency={item.unitPriceCurrency}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right font-bold text-foreground">
                        <CurrencyDisplay
                          amount={item.subtotal}
                          currency={item.unitPriceCurrency}
                          size="sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/5 shadow-md">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-base text-pretty">
              Resumen Financiero
            </CardTitle>
            <CardDescription className="text-pretty">
              Desglose de la transacción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">
                Subtotal
              </span>
              <span className="font-semibold tabular-nums">
                <CurrencyDisplay
                  amount={sale.total + sale.discount}
                  currency={sale.totalCurrency}
                />
              </span>
            </div>

            {sale.discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  Descuento
                </span>
                <span className="text-danger font-semibold tabular-nums">
                  -
                  <CurrencyDisplay
                    amount={sale.discount}
                    currency={sale.totalCurrency}
                  />
                </span>
              </div>
            )}

            <div className="-mx-6 flex items-center justify-between border-y border-border/40 bg-background/50 px-6 py-2 text-base shadow-sm">
              <span className="font-bold text-foreground">Total Final</span>
              <span className="font-black tracking-tight text-brand tabular-nums">
                <CurrencyDisplay
                  amount={sale.total}
                  currency={sale.totalCurrency}
                />
              </span>
            </div>

            <div className="space-y-3 pt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Monto Recibido
                </span>
                <span className="font-semibold tabular-nums">
                  <CurrencyDisplay
                    amount={sale.amountPaid + sale.changeGiven}
                    currency={sale.totalCurrency}
                  />
                </span>
              </div>

              {sale.changeGiven > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">
                    Cambio Devuelto
                  </span>
                  <span className="font-semibold tabular-nums">
                    <CurrencyDisplay
                      amount={sale.changeGiven}
                      currency={sale.totalCurrency}
                    />
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground">
                  Pagado
                </span>
                <span className="text-success font-bold tabular-nums">
                  <CurrencyDisplay
                    amount={sale.amountPaid}
                    currency={sale.totalCurrency}
                  />
                </span>
              </div>

              {sale.balanceDue > 0 && (
                <div className="bg-warning/10 border-warning/20 flex items-center justify-between">
                  <span className="text-warning-dark dark:text-warning font-bold">
                    Saldo Pendiente
                  </span>
                  <span className="text-warning-dark dark:text-warning font-bold tabular-nums">
                    <CurrencyDisplay
                      amount={sale.balanceDue}
                      currency={sale.totalCurrency}
                    />
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
