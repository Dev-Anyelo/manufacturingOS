import * as React from "react"

export type OrderReadyEmailTemplateProps = {
  customerName: string
  orderDescription: string
  pendingBalance: number
  workshopContact: string
}

export function OrderReadyEmailTemplate({
  customerName,
  orderDescription,
  pendingBalance,
  workshopContact,
}: OrderReadyEmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h2>Tu pedido esta listo para entrega</h2>
      <p>Hola {customerName}, tu pedido ya esta listo:</p>
      <p>{orderDescription}</p>
      <p>Saldo pendiente: ${pendingBalance.toFixed(2)}</p>
      <p>Contacto del taller: {workshopContact}</p>
    </div>
  )
}
