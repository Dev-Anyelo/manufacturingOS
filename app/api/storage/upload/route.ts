import { uploadFile, generateStoragePath, getStorageUrl } from "@/lib/storage/upload"
import { requirePermission } from "@/lib/api/require-permission"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
} from "@/lib/api/response"

/**
 * POST /api/storage/upload?bucket=xxx&recordId=yyy
 * Sube un archivo a un bucket específico.
 */
export async function POST(request: Request) {
  try {
    const { profile } = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket")
    const recordId = searchParams.get("recordId") || "temp"

    if (!bucket) {
      throw new ApiRouteError("Bucket es requerido.", 400)
    }

    // Validar permisos según el bucket
    const allowedBuckets = ["catalog", "inventory", "expenses", "payroll", "orders"]
    if (!allowedBuckets.includes(bucket)) {
      throw new ApiRouteError("Bucket no permitido.", 403)
    }

    // Check permissions per module
    const moduleMap: Record<string, string> = {
      catalog: "catalog",
      inventory: "inventory",
      expenses: "expenses",
      payroll: "payroll",
      orders: "orders",
    }
    
    await requirePermission(profile, moduleMap[bucket] as any, "edit")

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new ApiRouteError("Archivo no encontrado en la petición.", 400)
    }

    const path = generateStoragePath(bucket, recordId, file.name)
    const savedPath = await uploadFile(bucket, path, file)
    
    // Obtener URL completa
    const fullUrl = getStorageUrl(bucket, savedPath)

    return apiSuccess({ 
      path: savedPath,
      url: fullUrl 
    })
  } catch (error) {
    return handleApiError(error)
  }
}
