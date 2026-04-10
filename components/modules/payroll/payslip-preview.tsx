import Link from "next/link"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/shared/currency-display"

export interface PayslipPreviewData {
  id: string
  employeeName: string
  periodStart: string
  periodEnd: string
  status: "pending" | "paid"
  paymentDate: string | null
  paymentMethod: "cash" | "transfer" | "other" | null
  baseAmount: number
  bonuses: number
  deductions: number
  total: number
  notes: string | null
}

interface PayslipPreviewProps {
  payment: PayslipPreviewData
}

const methodLabelMap: Record<"cash" | "transfer" | "other", string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  other: "Otro",
}

function formatDate(value: string | null) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function PayslipPreview({ payment }: PayslipPreviewProps) {
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Resumen de comprobante</span>
          <Badge
            className={
              payment.status === "paid" ? "tone-success" : "tone-warning"
            }
          >
            {payment.status === "paid" ? "Pagado" : "Pendiente"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Empleado</p>
            <p className="font-medium">{payment.employeeName}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Periodo</p>
            <p className="font-medium">
              {formatDate(payment.periodStart)} -{" "}
              {formatDate(payment.periodEnd)}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Fecha de pago</p>
            <p className="font-medium">{formatDate(payment.paymentDate)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Metodo</p>
            <p className="font-medium">
              {payment.paymentMethod
                ? methodLabelMap[payment.paymentMethod]
                : "-"}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border/60 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monto base</span>
            <CurrencyDisplay amount={payment.baseAmount} size="sm" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bonos</span>
            <CurrencyDisplay amount={payment.bonuses} size="sm" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Deducciones</span>
            <CurrencyDisplay amount={-payment.deductions} size="sm" colored />
          </div>
          <div className="border-t border-border/50 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total neto</span>
              <CurrencyDisplay amount={payment.total} size="lg" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p>{payment.notes ?? "Sin notas registradas."}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link
              href={`/api/payroll/${payment.id}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <DownloadIcon className="size-4" />
              Ver PDF
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
