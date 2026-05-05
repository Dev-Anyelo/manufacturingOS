import Link from "next/link"
import { DownloadIcon, ReceiptIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateOnlyNI } from "@/lib/currency/exchange"

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
  receiptUrl: string | null
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

  return formatDateOnlyNI(value, "dd 'de' MMM, yyyy")
}

export function PayslipPreview({ payment }: PayslipPreviewProps) {
  const grossAmount = payment.baseAmount + payment.bonuses

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border px-4">
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
        <CardDescription className="text-sm text-pretty">
          {payment.employeeName} • {formatDate(payment.periodStart)} al{" "}
          {formatDate(payment.periodEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Devengado</p>
            <CurrencyDisplay amount={grossAmount} className="font-semibold" />
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Deducciones</p>
            <CurrencyDisplay
              amount={-payment.deductions}
              className="font-semibold"
              colored
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Neto a pagar</p>
            <CurrencyDisplay amount={payment.total} className="font-semibold" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Empleado</p>
            <p className="font-medium">{payment.employeeName}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Periodo</p>
            <p className="font-medium">
              {formatDate(payment.periodStart)} -{" "}
              {formatDate(payment.periodEnd)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Fecha de pago</p>
            <p className="font-medium">{formatDate(payment.paymentDate)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Metodo</p>
            <p className="font-medium">
              {payment.paymentMethod
                ? methodLabelMap[payment.paymentMethod]
                : "-"}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border p-4">
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
          <div className="border-t border-border pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total neto</span>
              <CurrencyDisplay amount={payment.total} size="lg" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Estado de pago:{" "}
              {payment.status === "paid"
                ? "liquidado"
                : "pendiente por registrar"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p className={payment.notes ? "" : "text-muted-foreground"}>
            {payment.notes ?? "Sin notas registradas."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {payment.receiptUrl && (
            <Button asChild variant="secondary">
              <Link
                href={`/api/storage/signed-url?bucket=payroll&path=${payment.receiptUrl}&redirect=true`}
                target="_blank"
                rel="noreferrer"
              >
                <ReceiptIcon className="size-4" />
                Ver Recibo
              </Link>
            </Button>
          )}
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
