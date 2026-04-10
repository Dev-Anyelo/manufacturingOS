import { prisma } from "@/lib/prisma"
import { NotificationType, Prisma, UserRole } from "@prisma/client"
import { productionSessionSchema } from "@/lib/validations/production"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  parseBodyWithSchema,
  requireAuth,
  requireRole,
} from "@/lib/api/response"

import {
  decimalToNumber,
  getSearchParam,
  parseDateParam,
  toPrismaDecimal,
} from "@/lib/api/utils"

export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const employeeId = getSearchParam(searchParams, "employee_id")
    const dateFrom = parseDateParam(getSearchParam(searchParams, "date_from"))
    const dateTo = parseDateParam(getSearchParam(searchParams, "date_to"))
    const garmentType = getSearchParam(searchParams, "garment_type")

    const where: Prisma.ProductionSessionWhereInput = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (dateFrom || dateTo) {
      where.sessionDate = {
        gte: dateFrom,
        lte: dateTo,
      }
    }

    if (garmentType) {
      where.items = {
        some: {
          garmentType: garmentType as never,
        },
      }
    }

    const sessions = await prisma.productionSession.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
    })

    return apiSuccess(sessions)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.employee, UserRole.manager, UserRole.admin])

    const payload = await parseBodyWithSchema(request, productionSessionSchema)

    const result = await prisma.$transaction(async (tx) => {
      const availableItems = await tx.$queryRaw<
        Array<{ id: string; name: string; quantity: Prisma.Decimal }>
      >(
        Prisma.sql`
          SELECT id, name, quantity
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

      const stockMap = new Map(
        availableItems.map((item) => [item.id, decimalToNumber(item.quantity)])
      )

      for (const item of payload.items) {
        const available = stockMap.get(item.inventory_item_id) ?? 0

        if (available < item.yards_used) {
          const materialName =
            availableItems.find((row) => row.id === item.inventory_item_id)
              ?.name ?? "material"
          throw new ApiRouteError(
            `No hay stock suficiente para ${materialName}.`,
            422
          )
        }
      }

      const createdSession = await tx.productionSession.create({
        data: {
          employeeId: payload.employee_id,
          sessionDate: payload.session_date,
          notes: payload.notes,
          createdBy: profile.id,
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

      await tx.notification.create({
        data: {
          userId: profile.id,
          type: NotificationType.production_saved,
          title: "Sesion de produccion registrada",
          body: "La sesion se guardo correctamente.",
          metadata: {
            production_session_id: createdSession.id,
          },
        },
      })

      const refreshedItems = await tx.inventoryItem.findMany({
        where: {
          id: {
            in: payload.items.map((item) => item.inventory_item_id),
          },
        },
      })

      const admins = await tx.profile.findMany({
        where: {
          role: UserRole.admin,
          isActive: true,
        },
        select: {
          id: true,
        },
      })

      if (admins.length > 0) {
        const lowStockNotifications = refreshedItems
          .filter((item) => Number(item.quantity) <= Number(item.minimumStock))
          .flatMap((item) =>
            admins.map((admin) => ({
              userId: admin.id,
              type:
                Number(item.quantity) === 0
                  ? NotificationType.out_of_stock
                  : NotificationType.low_stock,
              title:
                Number(item.quantity) === 0
                  ? "Material agotado"
                  : "Stock critico",
              body:
                Number(item.quantity) === 0
                  ? `El material ${item.name} se ha agotado.`
                  : `El material ${item.name} quedo en nivel critico.`,
              metadata: {
                inventory_item_id: item.id,
                quantity: Number(item.quantity),
                minimum_stock: Number(item.minimumStock),
              },
            }))
          )

        if (lowStockNotifications.length > 0) {
          await tx.notification.createMany({
            data: lowStockNotifications,
          })
        }
      }

      return createdSession
    })

    return apiSuccess(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
