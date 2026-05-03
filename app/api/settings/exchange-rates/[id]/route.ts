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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "view")

    const rate = await prisma.exchangeRate.findUnique({
      where: { id },
    })

    if (!rate) {
      return handleApiError(new Error("Tasa de cambio no encontrada"))
    }

    return apiSuccess(rate)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "edit")

    const payload = await parseBodyWithSchema(
      request,
      exchangeRateSchema.partial()
    )
    const id = (await params).id

    const updated = await prisma.exchangeRate.update({
      where: { id },
      data: {
        fromCurrency: payload.from_currency,
        toCurrency: payload.to_currency,
        rate: payload.rate ? toPrismaDecimal(payload.rate) : undefined,
        validFrom: payload.valid_from,
        validTo: payload.valid_to,
        notes: payload.notes,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "edit")

    await prisma.exchangeRate.delete({
      where: { id: (await params).id },
    })

    return apiSuccess({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
