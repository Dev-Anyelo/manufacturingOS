import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getExpenseById } from "@/lib/data/expenses"
import { ExpenseCategory, Currency } from "@prisma/client"
import { PageHeader } from "@/components/shared/page-header"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { formatDateOnlyNI, formatDateTimeNI } from "@/lib/currency/exchange"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

import {
  Building2Icon,
  ChevronDown,
  MessageCircleIcon,
  ImageOff,
  ReceiptIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  ExternalLinkIcon,
  PackageIcon,
} from "lucide-react"

type ExpenseDetailPageProps = {
  params: Promise<{ id: string }> | { id: string }
}

function getExpenseCategoryLabel(category: ExpenseCategory) {
  const map: Record<ExpenseCategory, string> = {
    fabrics: "Telas",
    supplies: "Suministros",
    tools: "Herramientas",
    machinery: "Maquinaria",
    outsourced_labor: "Mano de obra externa",
    services: "Servicios",
    packaging: "Empaques",
    office: "Oficina",
    payroll: "Nómina",
    other: "Otro",
  }
  return map[category] || category
}

function getCategoryBadgeClass(category: ExpenseCategory) {
  const map: Record<ExpenseCategory, string> = {
    fabrics: "status-info",
    supplies: "status-success",
    tools: "status-warning",
    machinery: "status-subtle",
    payroll: "status-brand",
    services: "status-info",
    office: "status-subtle",
    packaging: "status-subtle",
    outsourced_labor: "status-info",
    other: "status-subtle",
  }
  return map[category] ?? "status-subtle"
}

export default async function ExpenseDetailPage({
  params,
}: ExpenseDetailPageProps) {
  const { id } = await params
  const expense = await getExpenseById(id)

  if (!expense) {
    notFound()
  }

  // Si hay un comprobante, generar URL firmada ya que el bucket de 'expenses' es privado
  let receiptDisplayUrl = expense.receiptUrl
  if (receiptDisplayUrl) {
    try {
      const { createSupabaseAdminClient } = await import("@/lib/supabase/admin")
      const { getRelativePath } = await import("@/lib/storage/upload")
      const supabase = createSupabaseAdminClient()
      const relativePath =
        getRelativePath("expenses", receiptDisplayUrl) || receiptDisplayUrl

      const { data } = await supabase.storage
        .from("expenses")
        .createSignedUrl(relativePath, 3600) // 1 hora

      if (data?.signedUrl) {
        receiptDisplayUrl = data.signedUrl
      }
    } catch (error) {
      console.error("Error generating signed URL for expense receipt:", error)
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        title={expense.concept}
        description="Detalle completo del gasto registrado."
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Gastos", href: "/expenses" },
          { label: expense.concept },
        ]}
      />

      <div className="page-content space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={getCategoryBadgeClass(expense.category)}
          >
            {getExpenseCategoryLabel(expense.category)}
          </Badge>
          <Badge variant="outline" className="bg-muted/50">
            {formatDateOnlyNI(expense.expenseDate)}
          </Badge>
        </div>

        <Collapsible
          defaultOpen
          className="overflow-hidden rounded-xl border bg-card"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/20 [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-2">
              <TagIcon className="size-4 text-primary" />
              <span className="text-sm font-semibold">Resumen del gasto</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-2 divide-x divide-y border-t md:grid-cols-4 md:divide-y-0">
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Monto Total
                </span>
                <div className="text-lg leading-none font-bold text-brand tabular-nums">
                  <CurrencyDisplay
                    amount={expense.total}
                    currency={expense.totalCurrency as Currency}
                    showDual
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Categoría
                </span>
                <span className="text-lg leading-none font-bold">
                  {getExpenseCategoryLabel(expense.category)}
                </span>
              </div>
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Fecha de Gasto
                </span>
                <span className="text-lg leading-none font-bold tabular-nums">
                  {formatDateOnlyNI(expense.expenseDate)}
                </span>
              </div>
              <div className="flex flex-col justify-center p-4">
                <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                  Registrado por
                </span>
                <span className="truncate text-lg leading-none font-bold">
                  {expense.createdByProfile?.fullName || "Sistema"}
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border border-border">
              <CardHeader className="border-b border-border">
                <CardTitle>Información Detallada</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <TagIcon className="size-4" /> Concepto
                      </h4>
                      <p className="mt-1 text-base font-medium">
                        {expense.concept}
                      </p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2Icon className="size-4" /> Proveedor
                      </h4>
                      <p className="mt-1 text-base font-medium">
                        {expense.supplier || "—"}
                      </p>
                    </div>
                    {expense.unitPrice && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <TagIcon className="size-4" /> Precio Unitario
                        </h4>
                        <div className="mt-1 text-base font-medium">
                          <CurrencyDisplay
                            amount={expense.unitPrice}
                            currency={expense.unitPriceCurrency as Currency}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <CalendarIcon className="size-4" /> Fecha de registro
                      </h4>
                      <p className="mt-1 text-base font-medium">
                        {formatDateTimeNI(expense.createdAt)}
                      </p>
                    </div>
                    {expense.updatesInventory && (
                      <div>
                        <h4 className="text-success flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <PackageIcon className="size-4" /> Afecta Inventario
                        </h4>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium">
                            Se agregaron {expense.inventoryQuantityAdded}{" "}
                            unidades a:
                          </p>
                          {expense.inventoryItem && (
                            <Link
                              href={`/inventory/${expense.inventoryItem.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                            >
                              {expense.inventoryItem.name}
                              <ExternalLinkIcon className="size-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                    {expense.payrollPayment && (
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <UserIcon className="size-4" /> Relacionado a Nómina
                        </h4>
                        <div className="mt-2">
                          <Link
                            href={`/payroll/${expense.payrollPayment.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                          >
                            Ver comprobante de{" "}
                            {expense.payrollPayment.employee?.fullName}
                            <ExternalLinkIcon className="size-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {expense.notes && (
              <Card className="border">
                <CardHeader className="border-b bg-muted/20 px-4 py-3">
                  <CardTitle className="flex items-center gap-1 text-sm font-semibold">
                    <MessageCircleIcon className="size-4" />
                    Notas Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 text-sm leading-relaxed whitespace-pre-wrap">
                  {expense.notes}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border">
              <CardHeader className="border-b bg-muted/20 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <ReceiptIcon className="size-4" /> Comprobante
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {receiptDisplayUrl ? (
                  <div className="group relative">
                    <div className="relative aspect-3/4 w-full overflow-hidden bg-muted/30">
                      <Image
                        src={receiptDisplayUrl}
                        alt="Recibo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="border-t bg-card p-4">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        <Link href={expense.receiptUrl!} target="_blank">
                          <ExternalLinkIcon className="mr-2 size-4" />
                          Ver archivo original
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center bg-muted/10 px-4 py-12 text-center">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                      <ImageOff className="size-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No se adjuntó comprobante para este gasto
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border pt-0 shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-4 py-3 text-sm font-semibold">
                Resumen Financiero
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y text-sm">
                  <div className="flex justify-between px-4 py-3">
                    <dt className="text-muted-foreground">Monto</dt>
                    <dd className="font-semibold tabular-nums">
                      <CurrencyDisplay
                        amount={expense.total}
                        currency={expense.totalCurrency as Currency}
                        showDual={false}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between bg-muted/5 px-4 py-3">
                    <dt className="text-muted-foreground">Moneda Principal</dt>
                    <dd className="font-medium">{expense.totalCurrency}</dd>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <dt className="text-muted-foreground">
                      Método de registro
                    </dt>
                    <dd className="font-medium">
                      {expense.payrollPaymentId
                        ? "Automático (Nómina)"
                        : expense.updatesInventory
                          ? "Automático (Compra)"
                          : "Manual"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
