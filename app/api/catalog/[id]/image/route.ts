import { prisma } from "@/lib/prisma"
import { uploadCatalogImage } from "@/lib/storage/upload"
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

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "catalog", "create")

    const { id } = await resolveRouteParams(context.params)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ApiRouteError("Debes adjuntar una imagen valida.", 422)
    }

    const imageUrl = await uploadCatalogImage(file, id)

    const item = await prisma.catalogItem.update({
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
