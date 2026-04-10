import { Prisma, UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { customerSchema } from "@/lib/validations/sales"
import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"
import { getSearchParam } from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = getSearchParam(searchParams, "search")

    const where: Prisma.CustomerWhereInput = {}

    if (search) {
      where.OR = [
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    return apiSuccess(customers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager, UserRole.employee])

    const payload = await parseBodyWithSchema(request, customerSchema)

    const customer = await prisma.customer.create({
      data: {
        fullName: payload.full_name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        notes: payload.notes,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
      },
    })

    return apiSuccess(customer, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
