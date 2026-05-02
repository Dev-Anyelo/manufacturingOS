import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { requirePermission } from "@/lib/api/require-permission"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    const { id } = await resolveRouteParams(context.params)

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!sale) {
      return apiSuccess(null)
    }

    if (profile.role === UserRole.employee && sale.createdBy !== profile.id) {
      return apiSuccess(null)
    }

    return apiSuccess(sale)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "sales", "delete")

    if (profile.role !== UserRole.admin && profile.role !== UserRole.manager) {
      throw new ApiRouteError("No tienes permisos para eliminar ventas.", 403)
    }

    const { id } = await resolveRouteParams(context.params)
    
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!sale) {
      throw new ApiRouteError("Venta no encontrada", 404)
    }

    await prisma.$transaction(async (tx) => {
      // Create audit log before deletion
      await tx.auditLog.create({
        data: {
          tableName: "sales",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(sale)),
          createdBy: profile.id,
        },
      })

      // Perform deletion (items will be deleted via Cascade as per schema)
      await tx.sale.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
