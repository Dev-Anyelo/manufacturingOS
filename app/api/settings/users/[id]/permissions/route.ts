import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { MODULE_KEYS } from "@/lib/permissions/types"
import { invalidatePermissions } from "@/lib/permissions/cache"
import { requirePermission } from "@/lib/api/require-permission"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

const overrideSchema = z.array(
  z.object({
    module: z.enum(MODULE_KEYS),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
    canExport: z.boolean(),
  })
)

type RouteParams = { id: string }

export async function GET(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "view")

    const { id } = await (context.params instanceof Promise
      ? context.params
      : Promise.resolve(context.params))

    const overrides = await prisma.userModulePermission.findMany({
      where: { userId: id },
    })

    return apiSuccess(overrides)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "settings", "edit")

    const { id } = await (context.params instanceof Promise
      ? context.params
      : Promise.resolve(context.params))
    const body = await request.json()
    const payload = overrideSchema.parse(body)

    // Using transaction to replace all overrides for this user
    await prisma.$transaction(async (tx) => {
      // 1. Delete all existing overrides for this user
      await tx.userModulePermission.deleteMany({
        where: { userId: id },
      })

      // 2. Insert new overrides
      if (payload.length > 0) {
        await tx.userModulePermission.createMany({
          data: payload.map((override) => ({
            userId: id,
            module: override.module,
            canView: override.canView,
            canCreate: override.canCreate,
            canEdit: override.canEdit,
            canDelete: override.canDelete,
            canExport: override.canExport,
            grantedBy: profile.id, // Audit trail
          })),
        })
      }
    })

    // 3. Invalidate the cache for this user so their next request re-evaluates
    invalidatePermissions(id)

    return apiSuccess({ message: "Permisos actualizados correctamente." })
  } catch (error) {
    return handleApiError(error)
  }
}
