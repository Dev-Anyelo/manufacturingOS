import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { systemSettingsSchema } from "@/lib/validations/settings"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

export async function GET() {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    let settings = await prisma.systemSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    })

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {},
      })
    }

    return apiSuccess(settings)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin])

    const payload = await parseBodyWithSchema(request, systemSettingsSchema)

    let settings = await prisma.systemSetting.findFirst({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
      },
    })

    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {},
        select: {
          id: true,
        },
      })
    }

    const updated = await prisma.systemSetting.update({
      where: {
        id: settings.id,
      },
      data: {
        companyName: payload.company_name,
        companyPhone: payload.company_phone,
        companyEmail: payload.company_email,
        companyAddress: payload.company_address,
        lowStockThreshold: payload.low_stock_threshold,
        currency: payload.currency,
        timezone: payload.timezone,
      },
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
