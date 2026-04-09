import * as React from "react"

export type PayslipNotificationEmailTemplateProps = {
  fullName: string
  periodLabel: string
  breakdown: {
    baseAmount: number
    bonuses: number
    deductions: number
  }
  total: number
}

export function PayslipNotificationEmailTemplate({
  fullName,
  periodLabel,
  breakdown,
  total,
}: PayslipNotificationEmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h2>Comprobante de pago disponible</h2>
      <p>
        Hola {fullName}, tu comprobante del periodo {periodLabel} esta listo.
      </p>
      <ul>
        <li>Monto base: ${breakdown.baseAmount.toFixed(2)}</li>
        <li>Bonos: ${breakdown.bonuses.toFixed(2)}</li>
        <li>Deducciones: ${breakdown.deductions.toFixed(2)}</li>
      </ul>
      <p>Total pagado: ${total.toFixed(2)}</p>
    </div>
  )
}
