"use client"

import * as React from "react"
import { FinanceRow } from "./finance-row"
import { ContactRow } from "./contact-row"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoRow } from "@/components/shared/info-row"
import { Currency, WorkOrderStatus as WOS } from "@prisma/client"
import { SectionCard } from "@/components/section-cards"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import type { OrderDetailData } from "@/components/modules/orders/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ChangeStatusDialog } from "@/components/modules/orders/change-status-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { OrderStatusStepper } from "@/components/modules/orders/order-status-stepper"

import {
  AlertTriangleIcon,
  BanknoteIcon,
  CalendarIcon,
  CheckIcon,
  CircleDotIcon,
  ChevronDown,
  ClockIcon,
  ExternalLinkIcon,
  HashIcon,
  ImageIcon,
  MailIcon,
  PackageIcon,
  PaletteIcon,
  PhoneIcon,
  ReceiptIcon,
  RulerIcon,
  StickyNoteIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  actionConfig,
  channelConfig,
  cn,
  formatDate,
  formatDateRelative,
  formatDateTime,
  measurementLabels,
  transitionMap,
} from "@/lib/utils"

interface OrderDetailProps {
  order: OrderDetailData
}

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = React.useState(order.status)
  const [targetStatus, setTargetStatus] = React.useState<WOS | null>(null)

  const availableTransitions = transitionMap[currentStatus]
  const statusForDialog = targetStatus ?? currentStatus
  const paidAmount = Math.max(order.total - order.balanceDue, 0)
  const totalUnits = order.items.reduce((acc, item) => acc + item.quantity, 0)
  const paymentProgress =
    order.total > 0 ? Math.min((paidAmount / order.total) * 100, 100) : 100
  const channel = channelConfig[order.channel] ?? channelConfig.other
  const isCancelled = currentStatus === WOS.cancelled

  return (
    <div className="space-y-5">
      {/* ── Stepper ── */}
      <OrderStatusStepper status={currentStatus} />

      {/* ── Hero strip — métricas principales ── */}
      <Collapsible
        defaultOpen
        className="overflow-hidden rounded-xl border bg-card"
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/20 [&[data-state=open]>svg]:rotate-180">
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-4 text-primary" />
            <span className="text-sm font-semibold">Resumen del pedido</span>
          </div>
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 divide-x divide-y border-t md:grid-cols-4 md:divide-y-0">
            <div className="flex flex-col justify-center p-4">
              <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                Total pedido
              </span>
              <span className="text-lg leading-none font-bold tabular-nums">
                <CurrencyDisplay amount={order.total} currency={order.totalCurrency} />
              </span>
            </div>
            <div className="flex flex-col justify-center p-4">
              <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                Anticipo
              </span>
              <span className="text-lg leading-none font-bold text-brand tabular-nums">
                <CurrencyDisplay amount={order.advancePaid} currency={order.advancePaidCurrency} />
              </span>
            </div>
            <div className="flex flex-col justify-center p-4">
              <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                Saldo pendiente
              </span>
              <span
                className={cn(
                  "text-lg leading-none font-bold tabular-nums",
                  order.balanceDue > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                <CurrencyDisplay amount={order.balanceDue} currency={order.balanceDueCurrency} />
              </span>
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Cobrado {paymentProgress.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex flex-col justify-center bg-muted/10 p-4">
              <span className="mb-1 text-[10px] font-medium text-muted-foreground uppercase">
                Entrega
              </span>
              <span className="text-lg leading-none font-bold tabular-nums">
                {formatDate(order.deliveryDate)}
              </span>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {formatDateRelative(order.deliveryDate)} · {totalUnits} prendas
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── Acciones de flujo ── */}
      {availableTransitions.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="bg-info-soft flex size-5 shrink-0 items-center justify-center rounded-lg">
            <ZapIcon className="text-info size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Siguiente acción
            </p>
            <p className="truncate text-xs text-foreground/70">
              Ejecuta la transición de estado para continuar el flujo.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {availableTransitions.map((status) => {
              const cfg = actionConfig[status]
              return (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={
                    cfg?.variant === "destructive" ? "destructive" : "default"
                  }
                  className={cn("h-8 gap-1.5 text-xs transition-colors")}
                  onClick={() => setTargetStatus(status)}
                >
                  {cfg?.icon}
                  {cfg?.label ?? "Cambiar estado"}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Cancelación ── */}
      {isCancelled && order.cancelledReason && (
        <Alert
          variant="destructive"
          className="flex items-center justify-start gap-x-1.5"
        >
          <AlertTriangleIcon className="size-4" />
          <AlertTitle className="m-0 p-0 text-sm text-pretty">
            Pedido cancelado
          </AlertTitle>
          <AlertDescription className="text-xs text-pretty">
            {order.cancelledReason}
          </AlertDescription>
        </Alert>
      )}

      {/* ── Layout principal: columna izquierda (2/3) + derecha (1/3) ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Columna izquierda */}
        <div className="space-y-5 xl:col-span-2">
          {/* Detalle del pedido + cliente en fila */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
            {/* Info del pedido */}
            <SectionCard
              title="Detalle del pedido"
              icon={<HashIcon className="size-4" />}
              className="md:col-span-3"
            >
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <InfoRow
                  label="ID"
                  value={
                    <span className="font-mono text-xs font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  }
                />
                <InfoRow
                  label="Estado"
                  value={
                    <StatusBadge status={currentStatus} type="work-order" />
                  }
                />
                <InfoRow
                  label="Recepción"
                  value={formatDate(order.receivedDate)}
                />
                <InfoRow
                  label="Entrega"
                  value={
                    <span className="font-medium">
                      {formatDate(order.deliveryDate)}
                    </span>
                  }
                />
                <InfoRow
                  label="Canal"
                  value={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                        channel.color
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", channel.dot)}
                      />
                      {channel.label}
                    </span>
                  }
                />
                <InfoRow
                  label="Prendas"
                  value={`${totalUnits} unidades · ${order.items.length} líneas`}
                />
              </div>

              {order.notes && (
                <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <StickyNoteIcon className="size-3" />
                    Notas
                  </p>
                  <p className="text-sm text-foreground/80">{order.notes}</p>
                </div>
              )}
            </SectionCard>

            {/* Cliente */}
            <SectionCard
              title="Cliente"
              icon={<UserIcon className="size-4" />}
              className="md:col-span-2"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-base leading-tight font-semibold text-foreground">
                    {order.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ID: {order.customerId.slice(0, 8)}
                  </p>
                </div>
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <ContactRow
                    icon={<PhoneIcon className="size-3.5" />}
                    value={order.customerPhone || "Sin teléfono"}
                    empty={!order.customerPhone}
                  />
                  <ContactRow
                    icon={<MailIcon className="size-3.5" />}
                    value={order.customerEmail || "Sin correo"}
                    empty={!order.customerEmail}
                  />
                </div>

                {/* Resumen financiero del cliente */}
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Pagado
                    </span>
                    <CurrencyDisplay
                      amount={paidAmount}
                      currency={order.totalCurrency}
                      size="sm"
                      className="font-semibold"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Pendiente
                    </span>
                    <CurrencyDisplay
                      amount={order.balanceDue}
                      currency={order.balanceDueCurrency}
                      size="sm"
                      colored={order.balanceDue > 0}
                      className="font-semibold"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Items del pedido */}
          <SectionCard
            title="Items del pedido"
            icon={<PackageIcon className="size-4" />}
            headerRight={
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {order.items.length} líneas · {totalUnits} uds.
              </span>
            }
            noPadding
          >
            <div className="space-y-4 p-3">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 text-xs font-semibold tracking-wide uppercase">
                        Descripción
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold tracking-wide uppercase md:table-cell">
                        <span className="flex items-center gap-1">
                          <PaletteIcon className="size-3" />
                          Color / Talla
                        </span>
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold tracking-wide uppercase">
                        Cant.
                      </TableHead>
                      <TableHead className="pr-5 text-right text-xs font-semibold tracking-wide uppercase">
                        Subtotal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, idx) => {
                      const measurementEntries = Object.entries(
                        item.measurements ?? {}
                      )

                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "group transition-colors",
                            idx % 2 === 0 ? "" : "bg-muted/20"
                          )}
                        >
                          <TableCell className="py-3 pl-5">
                            <div className="space-y-1.5">
                              <div className="flex items-start gap-2">
                                <div className="bg-info-soft text-info mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="text-xs leading-tight font-semibold text-foreground">
                                    {item.description}
                                  </p>
                                  {item.catalogItemName && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.catalogItemName}
                                    </p>
                                  )}
                                  {item.designNotes && (
                                    <p className="mt-1 text-xs text-muted-foreground italic">
                                      "{item.designNotes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              {/* Medidas colapsables */}
                              {measurementEntries.length > 0 && (
                                <details className="ml-8">
                                  <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand select-none hover:text-brand/80">
                                    <RulerIcon className="size-3" />
                                    Ver {measurementEntries.length} medidas
                                  </summary>
                                  <div className="mt-1.5 ml-0.5 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-muted/20 p-2.5">
                                    {measurementEntries.map(([key, value]) => (
                                      <div key={key} className="text-center">
                                        <p className="text-xs text-muted-foreground">
                                          {measurementLabels[key] ?? key}
                                        </p>
                                        <p className="font-mono text-xs font-semibold">
                                          {String(value)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden py-3 md:table-cell">
                            <div className="flex items-center gap-1.5 space-y-1">
                              {item.color && item.size && (
                                <span className="inline-flex text-xs font-medium uppercase">
                                  {item.color} - {item.size}
                                </span>
                              )}

                              {!item.color && !item.size && (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <span className="text-xs font-semibold">
                              ×{item.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 pr-5 text-right">
                            <CurrencyDisplay
                              amount={item.subtotal}
                              currency={item.subtotalCurrency}
                              size="sm"
                              className="font-bold"
                            />
                            <p className="text-xs text-muted-foreground">
                              <CurrencyDisplay
                                amount={item.unitPrice}
                                currency={item.unitPriceCurrency}
                                size="sm"
                              />
                              /u
                            </p>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Total footer */}
              <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Total del pedido
                </span>
                <CurrencyDisplay
                  amount={order.total}
                  currency={order.totalCurrency}
                  size="sm"
                  className="font-bold"
                />
              </div>
            </div>
          </SectionCard>

          {/* Imágenes de referencia */}
          <SectionCard
            title="Imágenes de referencia"
            icon={<ImageIcon className="size-4" />}
            headerRight={
              order.referenceImages.length > 0 ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {order.referenceImages.length} imágenes
                </span>
              ) : undefined
            }
          >
            {order.referenceImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
                <ImageIcon className="mb-2 size-5 text-muted-foreground/40" />
                <p className="text-xs text-pretty text-muted-foreground">
                  Sin imágenes de referencia
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {order.referenceImages.map((path, index) => {
                  const src = `/api/storage/signed-url?bucket=orders&path=${path}&redirect=true`
                  return (
                    <a
                      key={`${path}-${index}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative overflow-hidden rounded-xl border border-border bg-muted/20"
                    >
                      <div
                        className="aspect-square bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${src})` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                        <ExternalLinkIcon className="size-5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      </div>
                      <div className="absolute bottom-1.5 left-1.5">
                        <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white backdrop-blur-sm">
                          {index + 1}
                        </span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Columna derecha ── */}
        <div className="space-y-5">
          {/* Historial de estados */}
          <SectionCard
            title="Historial de auditoría"
            icon={<ClockIcon className="size-4" />}
            headerRight={
              order.statusHistory.length > 0 ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {order.statusHistory.length} eventos
                </span>
              ) : undefined
            }
          >
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin eventos de auditoría.
              </p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute top-2 bottom-2 left-3.75 w-px bg-border" />
                {order.statusHistory.map((event, idx) => (
                  <div
                    key={event.id}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {/* Dot */}
                    <div
                      className={cn(
                        "relative z-10 flex size-7.5 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                        idx === 0
                          ? "border-brand text-brand"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {idx === 0 ? (
                        <CircleDotIcon className="size-3.5" />
                      ) : (
                        <CheckIcon className="size-3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p
                        className={cn(
                          "text-xs leading-tight font-semibold",
                          idx === 0 ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {event.action}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </p>
                      {event.actorName && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <UserIcon className="size-3" />
                          {event.actorName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Resumen financiero detallado */}
          <SectionCard
            title="Resumen financiero"
            icon={<ReceiptIcon className="size-4" />}
          >
            <div className="space-y-2.5">
              <FinanceRow label="Total del pedido" value={order.total} currency={order.totalCurrency} bold />
              <FinanceRow
                label="Anticipo aplicado"
                value={order.advancePaid}
                currency={order.advancePaidCurrency}
                accent="brand"
              />
              <FinanceRow
                label="Pagado acumulado"
                value={paidAmount}
                currency={order.totalCurrency}
                accent="brand"
              />
              <div className="border-t border-border pt-2.5">
                <FinanceRow
                  label="Saldo pendiente"
                  value={order.balanceDue}
                  currency={order.balanceDueCurrency}
                  accent={order.balanceDue > 0 ? "warning" : "success"}
                  bold
                />
              </div>
            </div>
            {/* Barra de progreso de pago */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progreso de cobro</span>
                <span className="font-semibold tabular-nums">
                  {paymentProgress.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                    paymentProgress >= 100 ? "bg-primary" : "bg-warning"
                  )}
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {paymentProgress >= 100
                  ? "Pago completado ✓"
                  : `Faltan ${(100 - paymentProgress).toFixed(0)}% por cobrar`}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Dialog de cambio de estado */}
      <ChangeStatusDialog
        orderId={order.id}
        currentStatus={currentStatus}
        targetStatus={statusForDialog}
        open={Boolean(targetStatus)}
        onOpenChange={(open) => {
          if (!open) setTargetStatus(null)
        }}
        onSuccess={() => {
          if (targetStatus) setCurrentStatus(targetStatus)
          setTargetStatus(null)
          router.refresh()
        }}
      />
    </div>
  )
}
