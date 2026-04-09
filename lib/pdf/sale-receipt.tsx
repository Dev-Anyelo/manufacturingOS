import * as React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

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
    changeGiven: number
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
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
              <Text>${item.subtotal.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Subtotal</Text>
            <Text>${sale.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Descuento</Text>
            <Text>${sale.discount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Total</Text>
            <Text>${sale.total.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Metodo de pago</Text>
            <Text>{sale.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text>Cambio</Text>
            <Text>${sale.changeGiven.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
