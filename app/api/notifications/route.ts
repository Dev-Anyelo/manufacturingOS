import { prisma } from "@/lib/prisma"
import { apiSuccess, handleApiError, requireAuth } from "@/lib/api/response"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unread_only") === "true"

    const notifications = await prisma.notification.findMany({
      where: {
        userId: profile.id,
        read: unreadOnly ? false : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    return apiSuccess(notifications)
  } catch (error) {
    return handleApiError(error)
  }
}
