import * as React from "react"

export type LowStockItem = {
  name: string
  currentQuantity: number
  minimumStock: number
  supplier?: string | null
}

export type LowStockAlertEmailTemplateProps = {
  items: LowStockItem[]
}

export function LowStockAlertEmailTemplate({
  items,
}: LowStockAlertEmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h2>Resumen diario de materiales criticos</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Material</th>
            <th align="left">Stock actual</th>
            <th align="left">Stock minimo</th>
            <th align="left">Proveedor</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.name}-${item.currentQuantity}`}>
              <td>{item.name}</td>
              <td>{item.currentQuantity}</td>
              <td>{item.minimumStock}</td>
              <td>{item.supplier ?? "Sin proveedor"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
