import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function PATCH() {
  try {
    const { profile } = await requireAuth()

    const updated = await prisma.notification.updateMany({
      where: {
        userId: profile.id,
        read: false,
      },
      data: {
        read: true,
      },
    })

    return apiSuccess({ updated: updated.count })
  } catch (error) {
    return handleApiError(error)
  }
}
