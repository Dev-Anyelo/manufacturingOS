import { prisma } from "@/lib/prisma"
import { toPrismaDecimal } from "@/lib/api/utils"
import { requirePermission } from "@/lib/api/require-permission"
import { exchangeRateSchema } from "@/lib/validations/exchange-rate"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "view")

    const rates = await prisma.exchangeRate.findMany({
      orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
    })

    return apiSuccess(rates)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "edit")

    const payload = await parseBodyWithSchema(request, exchangeRateSchema)

    // Optional: Close the previous rate if it overlaps
    if (!payload.valid_to) {
      await prisma.exchangeRate.updateMany({
        where: {
          fromCurrency: payload.from_currency,
          toCurrency: payload.to_currency,
          validTo: null,
          validFrom: { lt: payload.valid_from },
        },
        data: {
          validTo: payload.valid_from,
        },
      })
    }

    const rate = await prisma.exchangeRate.create({
      data: {
        fromCurrency: payload.from_currency,
        toCurrency: payload.to_currency,
        rate: toPrismaDecimal(payload.rate),
        validFrom: payload.valid_from,
        validTo: payload.valid_to,
        notes: payload.notes,
      },
    })

    return apiSuccess(rate, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
