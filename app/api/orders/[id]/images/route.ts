import { prisma } from "@/lib/prisma"
import { uploadOrderReference } from "@/lib/storage/upload"
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

/**
 * POST /api/orders/[id]/images
 * Sube múltiples imágenes de referencia para un pedido a medida.
 */
export async function POST(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "orders", "edit")

    const { id } = await resolveRouteParams(context.params)

    const formData = await request.formData()
    const files = formData.getAll("files")

    if (files.length === 0) {
      throw new ApiRouteError("No se enviaron imágenes.", 400)
    }

    const uploadedPaths: string[] = []
    const errors: string[] = []

    // Obtener la orden actual para saber qué imágenes ya tiene
    const currentOrder = await prisma.workOrder.findUnique({
      where: { id },
      select: { referenceImages: true }
    })

    if (!currentOrder) {
      throw new ApiRouteError("Pedido no encontrado.", 404)
    }

    // Subir cada archivo
    for (const file of files) {
      if (file instanceof File) {
        try {
          const path = await uploadOrderReference(file, id)
          uploadedPaths.push(path)
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err)
          errors.push(`Error con ${file.name}`)
        }
      }
    }

    if (uploadedPaths.length === 0) {
      throw new ApiRouteError("No se pudo subir ninguna imagen.", 500)
    }

    // Actualizar la base de datos (Append al array existente)
    const existingImages = currentOrder.referenceImages || []
    const updatedOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        referenceImages: [...existingImages, ...uploadedPaths],
      },
    })

    return apiSuccess({ 
      success: true, 
      urls: uploadedPaths,
      totalImages: updatedOrder.referenceImages.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/orders/[id]/images?path=...
 * Elimina una imagen de referencia específica.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<RouteParams> | RouteParams }
) {
  try {
    const { profile } = await requireAuth()
    await requirePermission(profile, "orders", "edit")

    const { id } = await resolveRouteParams(context.params)
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      throw new ApiRouteError("Path de la imagen es requerido.", 400)
    }

    const currentOrder = await prisma.workOrder.findUnique({
      where: { id },
      select: { referenceImages: true }
    })

    if (!currentOrder) {
      throw new ApiRouteError("Pedido no encontrado.", 404)
    }

    // Filtrar la imagen del array
    const updatedImages = (currentOrder.referenceImages || []).filter(p => p !== path)

    await prisma.workOrder.update({
      where: { id },
      data: {
        referenceImages: updatedImages
      }
    })

    // Nota: El archivo físico se podría eliminar aquí o mediante un cleanup job posterior.
    // Siguiendo el plan de borrado físico inmediato:
    // await deleteFile("orders", path); 
    // (Importar deleteFile si es necesario)

    return apiSuccess({ success: true, remaining: updatedImages.length })
  } catch (error) {
    return handleApiError(error)
  }
}
