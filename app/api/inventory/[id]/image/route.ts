import { UserRole } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { uploadInventoryImage } from "@/lib/storage/upload"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  requireRole,
  resolveRouteParams,
} from "@/lib/api/response"

type RouteParams = {
  id: string
}

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    requireRole(profile, [UserRole.admin, UserRole.manager])

    const { id } = await resolveRouteParams(context.params)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ApiRouteError("Debes adjuntar una imagen valida.", 422)
    }

    const imageUrl = await uploadInventoryImage(file, id)

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        imageUrl,
      },
    })

    return apiSuccess(item)
  } catch (error) {
    return handleApiError(error)
  }
}
