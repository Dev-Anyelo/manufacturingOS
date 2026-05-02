import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/api/require-permission"

import {
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
  ApiRouteError,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "expenses", "delete")

    const { id } = await resolveRouteParams(context.params)

    const expense = await prisma.expense.findUnique({
      where: { id },
    })

    if (!expense) {
      throw new ApiRouteError("Gasto no encontrado", 404)
    }

    await prisma.$transaction(async (tx) => {
      // Log deletion
      await tx.auditLog.create({
        data: {
          tableName: "expenses",
          recordId: id,
          action: "delete",
          oldValues: JSON.parse(JSON.stringify(expense)),
          createdBy: profile.id,
        },
      })

      await tx.expense.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
