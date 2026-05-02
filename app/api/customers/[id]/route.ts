import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { customerSchema } from "@/lib/validations/sales"
import { requirePermission } from "@/lib/api/require-permission"

import {
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
} from "@/lib/api/response"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "customers", "view")
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
    await requirePermission(profile, "customers", "edit")
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
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "customers", "delete")
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error("Cliente no encontrado")
    }

    await prisma.$transaction(async (tx) => {
      // Log deletion
      await tx.auditLog.create({
        data: {
          tableName: "customers",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(customer)),
          createdBy: profile.id,
        },
      })

      await tx.customer.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return handleApiError(
        new Error(
          "No se puede eliminar el cliente porque tiene registros asociados (ventas o pedidos)."
        )
      )
    }
    return handleApiError(error)
  }
}
