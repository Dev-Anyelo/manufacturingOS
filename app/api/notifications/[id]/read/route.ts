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

export async function PATCH(
  _request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    const { id } = await resolveRouteParams(context.params)

    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: profile.id,
      },
      data: {
        read: true,
      },
    })

    return apiSuccess({ updated: notification.count })
  } catch (error) {
    return handleApiError(error)
  }
}
