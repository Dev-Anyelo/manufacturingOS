import { NotificationType } from "@prisma/client"

import { resend, FROM_EMAIL } from "@/lib/email/resend"

import { NotificationEmailTemplate } from "@/emails/notification-template"

type NotificationEmailInput = {
  to: string
  name: string
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
}

const APP_NAME = "manufacturingOS"

const subjectPrefixes: Record<NotificationType, string> = {
  low_stock: "Stock bajo —",
  out_of_stock: "Sin stock —",
  order_ready: "Pedido listo —",
  order_overdue: "Pedido atrasado —",
  sale_completed: "Venta registrada —",
  production_saved: "Producción guardada —",
  payment_due: "Pago de planilla —",
  monthly_report: "Reporte —",
  inventory_updated: "Inventario actualizado —",
  expense_recorded: "Gasto registrado —",
  order_cancelled: "Pedido cancelado —",
}

export async function sendNotificationEmail({
  to,
  name,
  type,
  title,
  body,
  metadata,
}: NotificationEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    return false
  }

  const subjectPrefix = subjectPrefixes[type] ?? "Notificación —"

  const { error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `${subjectPrefix} ${title}`,
    react: NotificationEmailTemplate({
      name,
      type,
      title,
      body,
      metadata,
    }),
  })

  return !error
}
