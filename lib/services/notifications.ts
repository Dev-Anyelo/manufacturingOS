import { prisma } from "@/lib/prisma"
import { NotificationType, Prisma } from "@prisma/client"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { sendNotificationEmail } from "@/lib/email/notifications"

type CreateNotificationInput = {
  type: NotificationType
  title: string
  body: string
  metadata?: Record<string, unknown>
  userIds: string[]
  sendEmail?: boolean
  expiresAt?: Date
}

function uniqueUserIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)))
}

async function resolveEmail(profileId: string, email?: string | null) {
  if (email) {
    return email
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { data } = await supabaseAdmin.auth.admin.getUserById(profileId)
    return data.user?.email ?? null
  } catch {
    return null
  }
}

export async function createNotifications(input: CreateNotificationInput) {
  const userIds = uniqueUserIds(input.userIds)
  const metadata: Prisma.InputJsonValue | Prisma.NullTypes.JsonNull =
    input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull

  if (userIds.length === 0) {
    return { created: 0, emailed: 0 }
  }

  try {
    const data: Prisma.NotificationCreateManyInput[] = userIds.map(
      (userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata,
        expiresAt: input.expiresAt ?? null,
      })
    )

    await prisma.notification.createMany({
      data,
      skipDuplicates: false,
    })
  } catch (error) {
    console.error("Failed to create notifications", error)
    return { created: 0, emailed: 0 }
  }

  if (!input.sendEmail) {
    return { created: userIds.length, emailed: 0 }
  }

  let emailed = 0

  try {
    const profiles = await prisma.profile.findMany({
      where: {
        id: { in: userIds },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        employee: {
          select: {
            email: true,
          },
        },
      },
    })

    for (const profile of profiles) {
      const email = await resolveEmail(profile.id, profile.employee?.email)

      if (!email) {
        continue
      }

      try {
        const sent = await sendNotificationEmail({
          to: email,
          name: profile.fullName ?? "Usuario",
          type: input.type,
          title: input.title,
          body: input.body,
          metadata: input.metadata,
        })

        if (sent) {
          emailed += 1
        }
      } catch (error) {
        console.error("Failed to send notification email", error)
      }
    }
  } catch (error) {
    console.error("Failed to resolve notification recipients", error)
  }

  return { created: userIds.length, emailed }
}

export async function getUserIdsByRoles(
  roles: Array<"admin" | "manager" | "employee" | "readonly">
) {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        role: { in: roles },
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    return profiles.map((profile) => profile.id)
  } catch (error) {
    console.error("Failed to resolve notification recipients by role", error)
    return []
  }
}
