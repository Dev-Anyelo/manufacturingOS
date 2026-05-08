import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { ContractType, Currency } from "@prisma/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const createEmployeeSchema = z.object({
  documentId: z.string().min(2, "Documento requerido"),
  hireDate: z.string().min(1, "Fecha de contratación requerida"),
  contractType: z.nativeEnum(ContractType),
  baseSalary: z.number().min(0, "Debe ser mayor o igual a 0").optional(),
  baseSalaryCurrency: z.nativeEnum(Currency).optional(),
})

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const userId = params.id
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  // Verifica si el admin tiene permisos
  const adminProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (
    !adminProfile ||
    (adminProfile.role !== "admin" && adminProfile.role !== "manager")
  ) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createEmployeeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: { employee: true },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (profile.employee) {
      return NextResponse.json(
        { error: "El usuario ya tiene un perfil de empleado" },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        profileId: profile.id,
        fullName: profile.fullName || "Sin nombre",
        documentId: parsed.data.documentId,
        phone: profile.phone,
        hireDate: new Date(parsed.data.hireDate),
        contractType: parsed.data.contractType,
        baseSalary: parsed.data.baseSalary,
        baseSalaryCurrency: parsed.data.baseSalaryCurrency || "NIO",
        isActive: true,
      },
    })

    return NextResponse.json({ data: employee })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
