import { redirect } from "next/navigation"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { UserRole } from "@/types"

export type CurrentUser = {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  role: UserRole
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id || !user.email) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email,
    fullName:
      profile?.full_name?.trim() || user.email.split("@")[0] || "Usuario",
    avatarUrl: profile?.avatar_url ?? null,
    role: (profile?.role as UserRole | undefined) ?? UserRole.Employee,
  }
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export function isAdmin(user: CurrentUser) {
  return user.role === UserRole.Admin
}
