import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/response"
import { requirePermission } from "@/lib/api/require-permission"

export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "attendance", "view")

    // Fetch all leaves, latest first
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: leaves })
  } catch (error: unknown) {
    console.error("Error fetching admin leaves:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
