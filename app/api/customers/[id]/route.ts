import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { customerSchema } from "@/lib/validations/sales"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return handleApiError(new Error("Cliente no encontrado"))
    }

    return apiSuccess(customer)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager, UserRole.employee])
    const { id } = await params

    const payload = await parseBodyWithSchema(request, customerSchema)

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        fullName: payload.full_name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        notes: payload.notes,
      },
    })

    return apiSuccess(customer)
  } catch (error) {
    return handleApiError(error)
  }
}
