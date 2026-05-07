"use server"

import { revalidatePath } from "next/cache"

export async function revalidatePaths(paths: string[]) {
  if (!Array.isArray(paths) || paths.length === 0) return

  paths.forEach((p) => {
    try {
      revalidatePath(p)
    } catch (err) {
      console.error("revalidatePath error for", p, err)
    }
  })
}
