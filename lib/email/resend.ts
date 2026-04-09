import { Resend } from "resend"

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "noreply@manufacturingos.app"

const resendApiKey = process.env.RESEND_API_KEY ?? ""

export const resend = new Resend(resendApiKey)
