import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getSearchParam } from "@/lib/api/utils"
import { customerSchema } from "@/lib/validations/sales"
import { requirePermission } from "@/lib/api/require-permission"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = getSearchParam(searchParams, "search")
    const forSale = getSearchParam(searchParams, "for_sale")

    // Employee can only access the narrow POS endpoint (?for_sale=true)
    // which returns minimal data (id + name) for the customer selector.
    // Full customer list requires customers.view permission.
    if (forSale === "true") {
      const where: Prisma.CustomerWhereInput = {}

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ]
      }

      const customers = await prisma.customer.findMany({
        where,
        select: {
          id: true,
          fullName: true,
        },
        orderBy: { fullName: "asc" },
        take: 50,
      })

      return apiSuccess(customers)
    }

    // Full customer list — requires customers.view permission
    await requirePermission(profile, "customers", "view")

    const where: Prisma.CustomerWhereInput = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
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
    await requirePermission(profile, "customers", "create")

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
