import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { notFound, redirect } from "next/navigation"
import { UserDetailClient } from "./user-detail-client"
import { requireCurrentUser } from "@/lib/auth/current-user"

export default async function UserDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params
  const userId = params.id

  const currentUser = await requireCurrentUser()
  const permissions = await hasPermission(currentUser.id, "settings", "view")

  if (!permissions && currentUser.id !== userId) {
    redirect("/unauthorized")
  }

  const isAdmin = permissions

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          schedule: true,
        },
      },
    },
  })

  if (!profile) {
    notFound()
  }

  // Fetch email from Supabase Auth since it's not in the Profile model
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin")
  const supabaseAdmin = createSupabaseAdminClient()
  const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)

  // Serialize dates for client component
  const serializedProfile = JSON.parse(JSON.stringify({
    ...profile,
    email: authUser?.email || profile.employee?.email || null
  }))

  return <UserDetailClient profile={serializedProfile} isAdmin={isAdmin} />
}
