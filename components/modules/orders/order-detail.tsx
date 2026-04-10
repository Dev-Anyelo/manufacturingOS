"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { WorkOrderStatus } from "@prisma/client"
import {
  CalendarClockIcon,
  CircleDollarSignIcon,
  ClipboardListIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/shared/status-badge"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { OrderStatusStepper } from "@/components/modules/orders/order-status-stepper"
import { ChangeStatusDialog } from "@/components/modules/orders/change-status-dialog"

import type { OrderDetailData } from "@/components/modules/orders/types"

const transitionMap: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.received]: [
    WorkOrderStatus.confirmed,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.confirmed]: [
    WorkOrderStatus.in_production,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.in_production]: [
    WorkOrderStatus.ready,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.ready]: [WorkOrderStatus.delivered],
  [WorkOrderStatus.delivered]: [],
  [WorkOrderStatus.cancelled]: [],
}

const actionLabelMap: Partial<Record<WorkOrderStatus, string>> = {
  [WorkOrderStatus.confirmed]: "Confirmar pedido",
  [WorkOrderStatus.in_production]: "Iniciar produccion",
  [WorkOrderStatus.ready]: "Marcar como listo",
  [WorkOrderStatus.delivered]: "Marcar como entregado",
  [WorkOrderStatus.cancelled]: "Cancelar pedido",
}

const channelLabelMap: Record<OrderDetailData["channel"], string> = {
  in_person: "En tienda",
  referral: "Referido",
  social_media: "Redes",
  returning_customer: "Recurrente",
  other: "Otro",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function renderMeasurementLabel(key: string) {
  const map: Record<string, string> = {
    bust: "Busto",
    waist: "Cintura",
    hips: "Cadera",
    length: "Largo",
    sleeve: "Manga",
  }

  return map[key] ?? key
}

interface OrderDetailProps {
  order: OrderDetailData
}

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = React.useState(order.status)
  const [targetStatus, setTargetStatus] =
    React.useState<WorkOrderStatus | null>(null)

  const availableTransitions = transitionMap[currentStatus]
  const statusForDialog = targetStatus ?? currentStatus

  return (
    <div className="space-y-6">
      <OrderStatusStepper status={currentStatus} />

      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={
              status === WorkOrderStatus.cancelled ? "destructive" : "default"
            }
            className={
              status === WorkOrderStatus.cancelled
                ? ""
                : "bg-brand text-brand-foreground"
            }
            onClick={() => setTargetStatus(status)}
          >
            {actionLabelMap[status] ?? "Cambiar estado"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border border-border/60 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detalle del pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <ClipboardListIcon className="size-4" />
                ID de pedido
              </p>
              <p className="font-medium">#{order.id}</p>
            </div>

            <div className="space-y-1 text-sm">
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <CalendarClockIcon className="size-4" />
                Entrega
              </p>
              <p className="font-medium">{formatDate(order.deliveryDate)}</p>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Canal</p>
              <p className="font-medium">{channelLabelMap[order.channel]}</p>
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Estado</p>
              <StatusBadge status={currentStatus} type="work-order" />
            </div>

            <div className="space-y-1 text-sm">
              <p className="inline-flex items-center gap-1 text-muted-foreground">
                <CircleDollarSignIcon className="size-4" />
                Total
              </p>
              <CurrencyDisplay amount={order.total} className="font-semibold" />
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Saldo pendiente</p>
              <CurrencyDisplay
                amount={order.balanceDue}
                colored={order.balanceDue > 0}
                className={order.balanceDue > 0 ? "font-semibold" : ""}
              />
            </div>

            {order.notes ? (
              <div className="space-y-1 text-sm md:col-span-2">
                <p className="text-muted-foreground">Notas</p>
                <p>{order.notes}</p>
              </div>
            ) : null}

            {currentStatus === WorkOrderStatus.cancelled &&
            order.cancelledReason ? (
              <div className="border-danger/30 bg-danger/10 text-danger space-y-1 rounded-lg border p-3 text-sm md:col-span-2">
                <p className="font-semibold">Motivo de cancelacion</p>
                <p>{order.cancelledReason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="inline-flex items-center gap-2 font-medium">
              <UserIcon className="size-4 text-muted-foreground" />
              {order.customerName}
            </p>
            <p className="text-muted-foreground">
              {order.customerPhone || "Sin telefono"}
            </p>
            <p className="text-muted-foreground">
              {order.customerEmail || "Sin correo"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Items del pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripcion</TableHead>
                <TableHead className="hidden md:table-cell">
                  Color / Talla
                </TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const measurementEntries = Object.entries(
                  item.measurements ?? {}
                )

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.description}</p>
                        {item.designNotes ? (
                          <p className="text-xs text-muted-foreground">
                            {item.designNotes}
                          </p>
                        ) : null}
                        {measurementEntries.length > 0 ? (
                          <details className="rounded-md border border-border/60 bg-muted/20 p-2 text-xs">
                            <summary className="cursor-pointer font-medium select-none">
                              Ver medidas
                            </summary>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {measurementEntries.map(([key, value]) => (
                                <p key={key}>
                                  <span className="text-muted-foreground">
                                    {renderMeasurementLabel(key)}:
                                  </span>{" "}
                                  {String(value)}
                                </p>
                              ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1 text-sm">
                        <p>{item.color || "-"}</p>
                        <p className="text-muted-foreground">
                          {item.size || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={item.subtotal} size="sm" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="border border-border/60 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Imagenes de referencia</CardTitle>
          </CardHeader>
          <CardContent>
            {order.referenceImages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                Este pedido no tiene imagenes de referencia cargadas.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {order.referenceImages.map((src, index) => (
                  <a
                    key={`${src}-${index}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-lg border border-border/60"
                  >
                    <div
                      className="aspect-square bg-cover bg-center transition-transform duration-200 group-hover:scale-[1.02]"
                      style={{ backgroundImage: `url(${src})` }}
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Historial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin eventos de auditoria.
              </p>
            ) : (
              order.statusHistory.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs"
                >
                  <p className="font-medium">{event.action}</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                  </p>
                  <p className="text-muted-foreground">
                    {event.actorName || "Sistema"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <ChangeStatusDialog
        orderId={order.id}
        currentStatus={currentStatus}
        targetStatus={statusForDialog}
        open={Boolean(targetStatus)}
        onOpenChange={(open) => {
          if (!open) {
            setTargetStatus(null)
          }
        }}
        onSuccess={() => {
          if (targetStatus) {
            setCurrentStatus(targetStatus)
          }

          setTargetStatus(null)
          router.refresh()
        }}
      />
    </div>
  )
}
