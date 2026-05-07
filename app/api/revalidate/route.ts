import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Basic protection: require a valid key header.
    const providedKey = request.headers.get("x-revalidate-key")
    const expectedKey = process.env.NEXT_REVALIDATE_KEY || process.env.NEXT_PUBLIC_REVALIDATE_KEY

    if (!expectedKey || providedKey !== expectedKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const paths: string[] = body?.paths ?? []

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { success: false, error: "No paths provided" },
        { status: 400 }
      )
    }

    for (const p of paths) {
      try {
        revalidatePath(p)
      } catch (err) {
        // continue attempting other paths
        console.error("revalidatePath error for", p, err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
