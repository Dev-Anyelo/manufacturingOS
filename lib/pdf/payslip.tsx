import * as React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 12 },
  section: { marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  strong: { fontSize: 12, fontWeight: 700 },
})

export type PayslipPDFProps = {
  employee: {
    fullName: string
  }
  payment: {
    periodStart: string
    periodEnd: string
    baseAmount: number
    bonuses: number
    deductions: number
    total: number
  }
  company: {
    name: string
  }
}

export function PayslipPDF({ employee, payment, company }: PayslipPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{company.name}</Text>
        <Text style={styles.section}>Comprobante de pago</Text>

        <View style={styles.section}>
          <Text>Empleado: {employee.fullName}</Text>
          <Text>
            Periodo: {payment.periodStart} - {payment.periodEnd}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Monto base</Text>
            <Text>${payment.baseAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Bonos</Text>
            <Text>${payment.bonuses.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Deducciones</Text>
            <Text>${payment.deductions.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.strong}>Total</Text>
            <Text style={styles.strong}>${payment.total.toFixed(2)}</Text>
          </View>
        </View>

        <Text>Firma: ______________________________</Text>
      </Page>
    </Document>
  )
}
