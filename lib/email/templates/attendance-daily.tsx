import * as React from "react"
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
} from "@react-email/components"

export type AttendanceEmployeeDailyProps = {
  employeeName: string
  date: string
  checkIn: string
  lunchOut?: string
  lunchIn?: string
  checkOut: string
  totalHours: string
  status: string
}

export const AttendanceEmployeeDailyTemplate = ({
  employeeName,
  date,
  checkIn,
  lunchOut,
  lunchIn,
  checkOut,
  totalHours,
  status,
}: AttendanceEmployeeDailyProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Resumen de Jornada</Heading>
          <Text style={text}>Hola {employeeName},</Text>
          <Text style={text}>
            Aquí tienes el resumen de tu marcación de hoy, {date}:
          </Text>

          <Section style={card}>
            <Text style={item}>
              <strong>Entrada:</strong> {checkIn}
            </Text>
            {lunchOut && lunchIn && (
              <Text style={item}>
                <strong>Almuerzo:</strong> {lunchOut} - {lunchIn}
              </Text>
            )}
            <Text style={item}>
              <strong>Salida:</strong> {checkOut}
            </Text>
            <Text style={item}>
              <strong>Total Horas:</strong> {totalHours}
            </Text>
            <Text style={item}>
              <strong>Estado:</strong> {status}
            </Text>
          </Section>

          <Text style={text}>Gracias por tu trabajo de hoy.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export type AttendanceAdminDigestProps = {
  date: string
  stats: {
    on_time: number
    late: number
    absent: number
    permission: number
  }
}

export const AttendanceAdminDigestTemplate = ({
  date,
  stats,
}: AttendanceAdminDigestProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Resumen de Equipo ({date})</Heading>
          
          <Section style={card}>
            <Text style={item}><strong>A tiempo:</strong> {stats.on_time}</Text>
            <Text style={item}><strong>Tarde:</strong> {stats.late}</Text>
            <Text style={item}><strong>Ausentes:</strong> {stats.absent}</Text>
            <Text style={item}><strong>Permisos:</strong> {stats.permission}</Text>
          </Section>

          <Text style={text}>Revisa el panel de administración para más detalles.</Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const card = {
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  margin: "24px 0",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
}

const item = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "8px 0",
}
