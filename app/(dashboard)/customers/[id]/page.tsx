import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { decimalToNumber } from "@/lib/api/utils"
import { getCustomer } from "@/lib/data/customers"
import { formatCurrency, formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerForm } from "@/components/modules/customers/customer-form"

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
  ArrowLeftIcon,
  ChevronRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  StickyNoteIcon,
  UserIcon,
  ClipboardListIcon,
} from "lucide-react"

type CustomerDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

function getChannelLabel(channel: string) {
  const labels: Record<string, string> = {
    in_person: "Presencial",
    order: "Pedido",
    whatsapp: "WhatsApp",
    marketplace: "Marketplace",
    other: "Otro",
  }
  return labels[channel] ?? channel
}

function getPaymentLabel(method: string) {
  const labels: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    credit: "Crédito",
    mixed: "Mixto",
  }
  return labels[method] ?? method
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params
  const customer = await getCustomer(id)

  if (!customer) {
    notFound()
  }

  const totalSpent = customer.sales.reduce(
    (acc, s) => acc + decimalToNumber(s.total) - decimalToNumber(s.discount),
    0
  )
  const pendingBalance = customer.sales.reduce(
    (acc, s) => acc + decimalToNumber(s.balanceDue),
    0
  )
  const totalOrdersValue = customer.workOrders.reduce(
    (acc, wo) => acc + decimalToNumber(wo.total),
    0
  )

  return (
    <div className="page-shell">
      <PageHeader
        title={customer.fullName}
        description="Detalle del cliente, historial de compras y pedidos."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Clientes", href: "/customers" },
          { label: customer.fullName },
        ]}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="max-w-fit"
          >
            <Link href="/customers">
              <ArrowLeftIcon className="size-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="page-content space-y-6">
        {/* Info + KPI Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Contact Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">
                  Información
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{customer.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    Cliente desde {formatDate(customer.createdAt.toISOString())}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <PhoneIcon className="size-4 text-muted-foreground" />
                  <span>{customer.phone ?? "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <MailIcon className="size-4 text-muted-foreground" />
                  <span>{customer.email ?? "Sin email"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPinIcon className="size-4 text-muted-foreground" />
                  <span>{customer.address ?? "Sin dirección"}</span>
                </div>
              </div>

              {customer.notes ? (
                <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <StickyNoteIcon className="size-3.5" />
                    Notas
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    {customer.notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="mb-4 flex items-center justify-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
              <div className="flex shrink-0 flex-col items-center px-4 py-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Total ventas
                </span>
                <span className="mt-0.5 text-sm font-bold tabular-nums">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
              <div className="flex shrink-0 flex-col items-center px-4 py-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Total pedidos
                </span>
                <span className="mt-0.5 text-sm font-bold tabular-nums">
                  {formatCurrency(totalOrdersValue)}
                </span>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-center gap-0 overflow-x-auto border-t border-b bg-muted/20 py-1">
              <div className="flex shrink-0 flex-col items-center px-4 py-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Saldo pendiente
                </span>
                <span className="mt-0.5 text-sm font-bold tabular-nums">
                  {formatCurrency(pendingBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Ventas / Pedidos */}
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="sales" className="gap-1.5">
              <ShoppingBagIcon className="size-3.5" />
              Ventas ({customer._count.sales})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <ClipboardListIcon className="size-3.5" />
              Pedidos ({customer._count.workOrders})
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <Card className="overflow-hidden rounded-xl border border-border">
              <CardContent className="p-0">
                {customer.sales.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={<ReceiptTextIcon />}
                      title="Sin ventas"
                      description="Este cliente aún no tiene ventas registradas."
                      compact
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Fecha</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.sales.map((sale) => {
                          const net =
                            decimalToNumber(sale.total) -
                            decimalToNumber(sale.discount)
                          return (
                            <TableRow
                              key={sale.id}
                              className="border-border/55 hover:bg-muted/50"
                            >
                              <TableCell className="text-sm whitespace-nowrap">
                                {formatDate(sale.saleDate.toISOString())}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {getChannelLabel(sale.channel)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {getPaymentLabel(sale.paymentMethod)}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {formatCurrency(net)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                <span
                                  className={
                                    decimalToNumber(sale.balanceDue) > 0
                                      ? "font-medium text-amber-600 dark:text-amber-400"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {formatCurrency(
                                    decimalToNumber(sale.balanceDue)
                                  )}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={sale.status} type="sale" />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/sales/${sale.id}`}>
                                    <ChevronRightIcon className="size-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Orders Tab */}
          <TabsContent value="orders">
            <Card className="overflow-hidden rounded-xl border border-border">
              <CardContent className="p-0">
                {customer.workOrders.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      icon={<ClipboardListIcon />}
                      title="Sin pedidos"
                      description="Este cliente aún no tiene pedidos registrados."
                      compact
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Recibido</TableHead>
                          <TableHead>Entrega</TableHead>
                          <TableHead className="text-right">Prendas</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.workOrders.map((wo) => {
                          const garmentCount = wo.items.reduce(
                            (a, item) => a + item.quantity,
                            0
                          )
                          return (
                            <TableRow
                              key={wo.id}
                              className="border-border/55 hover:bg-muted/50"
                            >
                              <TableCell className="text-sm whitespace-nowrap">
                                {formatDate(wo.receivedDate.toISOString())}
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {formatDate(wo.deliveryDate.toISOString())}
                              </TableCell>
                              <TableCell className="text-right font-bold tabular-nums">
                                {garmentCount}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {formatCurrency(decimalToNumber(wo.total))}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                <span
                                  className={
                                    decimalToNumber(wo.balanceDue) > 0
                                      ? "font-medium text-amber-600 dark:text-amber-400"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {formatCurrency(
                                    decimalToNumber(wo.balanceDue)
                                  )}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={wo.status}
                                  type="work-order"
                                />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/orders/${wo.id}`}>
                                    <ChevronRightIcon className="size-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Inline Edit Form */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <CardTitle>Editar información del cliente</CardTitle>
            </div>
            <CardDescription className="text-pretty">
              Actualiza los datos básicos de contacto y notas del cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerForm
              mode="edit"
              customerId={customer.id}
              defaultValues={{
                full_name: customer.fullName,
                phone: customer.phone,
                email: customer.email,
                address: customer.address,
                notes: customer.notes,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
