import { prisma } from "@/lib/prisma"
import { Prisma, UserRole } from "@prisma/client"
import { toPrismaDecimal } from "@/lib/api/utils"
import { productionSessionSchema } from "@/lib/validations/production"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
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
    await requireAuth()

    const { id } = await resolveRouteParams(context.params)

    const session = await prisma.productionSession.findUnique({
      where: { id },
      include: {
        employee: true,
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                quantity: true,
                minimumStock: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    return apiSuccess(session)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()

    const { id } = await resolveRouteParams(context.params)
    const payload = await parseBodyWithSchema(request, productionSessionSchema)

    const session = await prisma.productionSession.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!session) {
      throw new ApiRouteError("No se encontro la sesion solicitada.", 404)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessionDay = new Date(session.sessionDate)
    sessionDay.setHours(0, 0, 0, 0)

    if (sessionDay.getTime() !== today.getTime()) {
      throw new ApiRouteError(
        "Solo se pueden editar sesiones de la jornada actual.",
        422
      )
    }

    const canEdit =
      session.createdBy === profile.id || profile.role === UserRole.admin

    if (!canEdit) {
      throw new ApiRouteError(
        "No tienes permisos para editar esta sesion de produccion.",
        403
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const item of session.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.yardsUsed,
            },
          },
        })
      }

      await tx.productionSessionItem.deleteMany({
        where: {
          sessionId: session.id,
        },
      })

      const stockRows = await tx.$queryRaw<
        Array<{ id: string; quantity: Prisma.Decimal; name: string }>
      >(
        Prisma.sql`
          SELECT id, quantity, name
          FROM public.inventory_items
          WHERE id IN (
            ${Prisma.join(
              payload.items.map(
                (item) => Prisma.sql`CAST(${item.inventory_item_id} AS uuid)`
              )
            )}
          )
          FOR UPDATE
        `
      )

      for (const item of payload.items) {
        const available = Number(
          stockRows.find((row) => row.id === item.inventory_item_id)
            ?.quantity ?? 0
        )

        if (available < item.yards_used) {
          const name =
            stockRows.find((row) => row.id === item.inventory_item_id)?.name ??
            "material"

          throw new ApiRouteError(`No hay stock suficiente para ${name}.`, 422)
        }
      }

      return tx.productionSession.update({
        where: { id },
        data: {
          employeeId: payload.employee_id,
          sessionDate: payload.session_date,
          notes: payload.notes,
          items: {
            create: payload.items.map((item) => ({
              inventoryItemId: item.inventory_item_id,
              garmentType: item.garment_type,
              size: item.size,
              quantity: item.quantity,
              yardsUsed: toPrismaDecimal(item.yards_used),
              notes: item.notes,
            })),
          },
        },
        include: {
          items: true,
        },
      })
    })

    return apiSuccess(updated)
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
    requireRole(profile, [UserRole.admin])

    const { id } = await resolveRouteParams(context.params)

    const session = await prisma.productionSession.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })

    if (!session) {
      throw new ApiRouteError("No se encontro la sesion solicitada.", 404)
    }

    await prisma.$transaction(async (tx) => {
      for (const item of session.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.yardsUsed,
            },
          },
        })
      }

      await tx.productionSession.delete({
        where: { id },
      })
    })

    return apiSuccess({ id, cancelled: true })
  } catch (error) {
    return handleApiError(error)
  }
}
