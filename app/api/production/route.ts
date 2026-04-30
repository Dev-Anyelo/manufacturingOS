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

      let totalGarments = 0
      let totalYardsUsed = 0

      for (const item of payload.items) {
        totalGarments += item.quantity
        totalYardsUsed += item.yards_used
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
          totalGarments,
          totalYardsUsed: toPrismaDecimal(totalYardsUsed),
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

      // Process inventory deduction and finished goods increment
      for (const item of createdSession.items) {
        // 1. Deduct raw material & log movement
        const oldStock = stockMap.get(item.inventoryItemId) ?? 0
        const newStock = oldStock - Number(item.yardsUsed)
        
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: toPrismaDecimal(newStock) }
        })

        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            movementType: "out",
            quantity: item.yardsUsed,
            previousQuantity: toPrismaDecimal(oldStock),
            newQuantity: toPrismaDecimal(newStock),
            reason: `Consumo Producción: ${createdSession.id}`,
            createdBy: profile.id
          }
        })

        // 2. Increase finished goods & log movement
        let catalogItem = await tx.catalogItem.findFirst({
          where: { garmentType: item.garmentType }
        })

        if (!catalogItem) {
          catalogItem = await tx.catalogItem.create({
            data: {
              name: `Producto Terminado: ${item.garmentType}`,
              garmentType: item.garmentType,
              isActive: true,
              salePrice: toPrismaDecimal(0)
            }
          })
        }

        // Link the item to the catalog item
        await tx.productionSessionItem.update({
          where: { id: item.id },
          data: { catalogItemId: catalogItem.id }
        })

        // Upsert FinishedGoodStock
        const existingFgs = await tx.finishedGoodStock.findFirst({
          where: {
            catalogItemId: catalogItem.id,
            garmentType: item.garmentType,
            size: item.size,
            color: null
          }
        })

        let fgsId = ""
        let prevFgsStock = 0
        let newFgsStock = item.quantity

        if (existingFgs) {
          fgsId = existingFgs.id
          prevFgsStock = existingFgs.stock
          newFgsStock = prevFgsStock + item.quantity

          await tx.finishedGoodStock.update({
            where: { id: fgsId },
            data: { stock: newFgsStock }
          })
        } else {
          const newFgs = await tx.finishedGoodStock.create({
            data: {
              catalogItemId: catalogItem.id,
              garmentType: item.garmentType,
              size: item.size,
              color: null,
              stock: item.quantity
            }
          })
          fgsId = newFgs.id
        }

        // Log CatalogMovement
        await tx.catalogMovement.create({
          data: {
            finishedGoodStockId: fgsId,
            movementType: "in",
            quantity: item.quantity,
            previousQuantity: prevFgsStock,
            newQuantity: newFgsStock,
            reason: `Producción sesión: ${createdSession.id}`,
            createdBy: profile.id
          }
        })
      }

      await tx.notification.create({
        data: {
          userId: profile.id,
          type: NotificationType.production_saved,
          title: "Sesión de producción registrada",
          body: "La sesión se guardó correctamente y el stock fue actualizado.",
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
