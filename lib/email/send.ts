import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"
import { FROM_EMAIL, resend } from "@/lib/email/resend"

import {
  LowStockAlertEmailTemplate,
  type LowStockItem,
} from "@/lib/email/templates/low-stock-alert"

import {
  MonthlyReportEmailTemplate,
  type MonthlyReportEmailTemplateProps,
} from "@/lib/email/templates/monthly-report"

import {
  OrderReadyEmailTemplate,
  type OrderReadyEmailTemplateProps,
} from "@/lib/email/templates/order-ready"

import {
  PayslipNotificationEmailTemplate,
  type PayslipNotificationEmailTemplateProps,
} from "@/lib/email/templates/payslip-notification"

import {
  UserWelcomeEmailTemplate,
  type WelcomeEmailTemplateProps,
} from "@/lib/email/templates/user-welcome"

import {
  AttendanceEmployeeDailyTemplate,
  type AttendanceEmployeeDailyProps,
  AttendanceAdminDigestTemplate,
  type AttendanceAdminDigestProps,
} from "@/lib/email/templates/attendance-daily"

export type WelcomeEmailData = WelcomeEmailTemplateProps
export type OrderReadyEmailData = OrderReadyEmailTemplateProps
export type LowStockAlertData = { items: LowStockItem[] }
export type PayslipEmailData = PayslipNotificationEmailTemplateProps
export type MonthlyReportData = MonthlyReportEmailTemplateProps

async function logEmailFailure(subject: string, message: string, to: string) {
  try {
    await prisma.auditLog.create({
      data: {
        tableName: "email_delivery",
        action: AuditAction.insert,
        newValues: {
          to,
          subject,
          message,
          sentAt: new Date().toISOString(),
        },
      },
    })
  } catch {}
}

async function sendEmail(options: {
  to: string
  subject: string
  react: React.ReactNode
  attachments?: { filename: string; content: string }[]
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      await logEmailFailure(
        options.subject,
        "RESEND_API_KEY no configurada",
        options.to
      )
      return false
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      react: options.react,
      attachments: options.attachments,
    })

    if (error) {
      await logEmailFailure(options.subject, error.message, options.to)
      return false
    }

    return true
  } catch {
    await logEmailFailure(
      options.subject,
      "Error inesperado al enviar correo",
      options.to
    )
    return false
  }
}

export async function sendWelcomeEmail(to: string, data: WelcomeEmailData) {
  return sendEmail({
    to,
    subject: "Bienvenido a DANIELLS CONFECCIONES",
    react: UserWelcomeEmailTemplate(data),
  })
}

export async function sendOrderReadyEmail(
  to: string,
  data: OrderReadyEmailData
) {
  return sendEmail({
    to,
    subject: "Tu pedido esta listo para entrega",
    react: OrderReadyEmailTemplate(data),
  })
}

export async function sendLowStockAlert(to: string, data: LowStockAlertData) {
  return sendEmail({
    to,
    subject: "Resumen de stock critico",
    react: LowStockAlertEmailTemplate(data),
  })
}

export async function sendPayslipNotification(
  to: string,
  data: PayslipEmailData,
  pdfBuffer?: Buffer
) {
  return sendEmail({
    to,
    subject: "Tu comprobante de pago esta disponible",
    react: PayslipNotificationEmailTemplate(data),
    attachments: pdfBuffer
      ? [
          {
            filename: "comprobante-planilla.pdf",
            content: pdfBuffer.toString("base64"),
          },
        ]
      : undefined,
  })
}

export async function sendMonthlyReport(
  to: string,
  data: MonthlyReportData,
  pdfBuffer?: Buffer
) {
  return sendEmail({
    to,
    subject: "Reporte mensual del taller",
    react: MonthlyReportEmailTemplate(data),
    attachments: pdfBuffer
      ? [
          {
            filename: "reporte-mensual.pdf",
            content: pdfBuffer.toString("base64"),
          },
        ]
      : undefined,
  })
}

export async function sendAttendanceEmployeeDaily(to: string, data: AttendanceEmployeeDailyProps) {
  return sendEmail({
    to,
    subject: `Resumen de Asistencia - ${data.date}`,
    react: AttendanceEmployeeDailyTemplate(data),
  })
}

export async function sendAttendanceAdminDigest(to: string, data: AttendanceAdminDigestProps) {
  return sendEmail({
    to,
    subject: `Resumen de Asistencia Equipo - ${data.date}`,
    react: AttendanceAdminDigestTemplate(data),
  })
}
