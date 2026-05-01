import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

interface Props {
  name: string
  type: string
  title: string
  body: string
  metadata?: Record<string, unknown>
}

function getTypeEmoji(type: string) {
  const emojiMap: Record<string, string> = {
    low_stock: "⚠️",
    out_of_stock: "🚨",
    order_ready: "✅",
    order_overdue: "🔴",
    sale_completed: "💰",
    production_saved: "✂️",
    payment_due: "💳",
    monthly_report: "📊",
    inventory_updated: "📦",
    expense_recorded: "🧾",
    order_cancelled: "⛔",
  }

  return emojiMap[type] ?? "🔔"
}

export function NotificationEmailTemplate({
  name,
  type,
  title,
  body,
  metadata,
}: Props) {
  const actionUrl =
    typeof metadata?.actionUrl === "string" ? metadata.actionUrl : undefined
  const actionLabel =
    typeof metadata?.actionLabel === "string" ? metadata.actionLabel : undefined

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body
        style={{
          margin: 0,
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            padding: "40px 20px",
          }}
        >
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Heading style={{ margin: 0, fontSize: "22px", color: "#18181b" }}>
              manufacturingOS
            </Heading>
          </Section>

          <Section
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "14px",
              padding: "32px",
            }}
          >
            <Text
              style={{
                fontSize: "34px",
                textAlign: "center",
                margin: "0 0 12px",
              }}
            >
              {getTypeEmoji(type)}
            </Text>

            <Heading
              style={{
                margin: "0 0 10px",
                fontSize: "20px",
                lineHeight: "1.2",
                color: "#18181b",
                textAlign: "center",
              }}
            >
              {title}
            </Heading>

            <Text
              style={{
                margin: "0 0 18px",
                fontSize: "14px",
                lineHeight: "1.7",
                color: "#52525b",
                textAlign: "center",
              }}
            >
              Hola {name}, {body}
            </Text>

            {actionUrl && actionLabel ? (
              <Section style={{ textAlign: "center", marginTop: "24px" }}>
                <Button
                  href={actionUrl}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    padding: "11px 22px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  {actionLabel}
                </Button>
              </Section>
            ) : null}
          </Section>

          <Hr style={{ margin: "24px 0", borderColor: "#e4e4e7" }} />

          <Text
            style={{
              margin: 0,
              color: "#a1a1aa",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            Este es un mensaje automático de manufacturingOS. Por favor no
            respondas a este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
