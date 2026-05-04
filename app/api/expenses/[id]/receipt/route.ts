import { prisma } from "@/lib/prisma"
import { uploadReceipt } from "@/lib/storage/upload"
import { requirePermission } from "@/lib/api/require-permission"

import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
  resolveRouteParams,
} from "@/lib/api/response"



type RouteParams = {
  id: string
}

export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "expenses", "create")

    const { id } = await resolveRouteParams(context.params)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ApiRouteError("Debes adjuntar un archivo valido.", 422)
    }

    const receiptUrl = await uploadReceipt(file, "expenses", id)

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        receiptUrl,
      },
    })

    return apiSuccess(expense)
  } catch (error) {
    return handleApiError(error)
  }
}
