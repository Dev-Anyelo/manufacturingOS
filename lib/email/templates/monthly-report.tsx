export type MonthlyReportEmailTemplateProps = {
  totalSales: number
  totalExpenses: number
  grossProfit: number
  topCustomers: { name: string; amount: number }[]
  topMaterials: { name: string; quantity: number }[]
}

export function MonthlyReportEmailTemplate({
  totalSales,
  totalExpenses,
  grossProfit,
  topCustomers,
  topMaterials,
}: MonthlyReportEmailTemplateProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h2>Reporte mensual DANIELLS CONFECCIONES</h2>
      <p>Total ventas: ${totalSales.toFixed(2)}</p>
      <p>Total gastos: ${totalExpenses.toFixed(2)}</p>
      <p>Utilidad bruta: ${grossProfit.toFixed(2)}</p>

      <h3>Top 5 clientes</h3>
      <ul>
        {topCustomers.map((customer) => (
          <li key={customer.name}>
            {customer.name}: ${customer.amount.toFixed(2)}
          </li>
        ))}
      </ul>

      <h3>Top materiales consumidos</h3>
      <ul>
        {topMaterials.map((material) => (
          <li key={material.name}>
            {material.name}: {material.quantity.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  )
}
