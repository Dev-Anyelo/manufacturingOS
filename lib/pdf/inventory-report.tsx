import * as React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 4,
  },
  header: { fontWeight: 700 },
})

export type InventoryReportPDFProps = {
  items: Array<{
    name: string
    category: string
    stock: number
    minimum: number
    status: string
    price: number
  }>
  generatedAt: string
  company: {
    name: string
  }
}

export function InventoryReportPDF({
  items,
  generatedAt,
  company,
}: InventoryReportPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{company.name}</Text>
        <Text>Reporte de inventario</Text>
        <Text>Generado: {generatedAt}</Text>

        <View style={[styles.row, styles.header]}>
          <Text>Material</Text>
          <Text>Categoria</Text>
          <Text>Stock</Text>
          <Text>Minimo</Text>
          <Text>Estado</Text>
          <Text>Precio</Text>
        </View>

        {items.map((item, index) => (
          <View key={`${item.name}-${index}`} style={styles.row}>
            <Text>{item.name}</Text>
            <Text>{item.category}</Text>
            <Text>{item.stock.toFixed(2)}</Text>
            <Text>{item.minimum.toFixed(2)}</Text>
            <Text>{item.status}</Text>
            <Text>${item.price.toFixed(2)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  )
}
