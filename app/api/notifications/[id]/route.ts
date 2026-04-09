import { prisma } from "@/lib/prisma"
import {
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
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
    const { id } = await resolveRouteParams(context.params)

    const deleted = await prisma.notification.deleteMany({
      where: {
        id,
        userId: profile.id,
      },
    })

    return apiSuccess({ deleted: deleted.count })
  } catch (error) {
    return handleApiError(error)
  }
}
