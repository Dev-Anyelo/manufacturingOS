import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatCurrencyNI } from "@/lib/currency/exchange"
import { Currency } from "@prisma/client"

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  section: { marginBottom: 10 },
})

export type SaleReceiptPDFProps = {
  sale: {
    id: string
    saleDate: string
    paymentMethod: string
    subtotal: number
    discount: number
    total: number
    totalCurrency: string
    changeGiven: number
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    unitPriceCurrency: string
    subtotal: number
  }>
  customer?: {
    fullName: string
  } | null
  company: {
    name: string
  }
}

export function SaleReceiptPDF({
  sale,
  items,
  customer,
  company,
}: SaleReceiptPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{company.name}</Text>
        <Text style={styles.section}>Recibo de venta N. {sale.id}</Text>
        <Text style={styles.section}>Fecha: {sale.saleDate}</Text>
        <Text style={styles.section}>
          Cliente: {customer?.fullName ?? "Consumidor final"}
        </Text>

        <View style={styles.section}>
          {items.map((item, index) => (
            <View key={`${item.description}-${index}`} style={styles.row}>
              <Text>
                {item.description} x{item.quantity}
              </Text>
              <Text>
                {formatCurrencyNI(item.subtotal, item.unitPriceCurrency as Currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>
              {formatCurrencyNI(sale.subtotal, sale.totalCurrency as Currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Descuento</Text>
            <Text>
              {formatCurrencyNI(sale.discount, sale.totalCurrency as Currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Total</Text>
            <Text>
              {formatCurrencyNI(sale.total, sale.totalCurrency as Currency)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text>Metodo de pago</Text>
            <Text>{sale.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cambio</Text>
            <Text>
              {formatCurrencyNI(sale.changeGiven, sale.totalCurrency as Currency)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
