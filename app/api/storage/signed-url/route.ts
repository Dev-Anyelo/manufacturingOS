import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { requirePermission } from "@/lib/api/require-permission"
import {
  ApiRouteError,
  apiSuccess,
  handleApiError,
  requireAuth,
} from "@/lib/api/response"

/**
 * GET /api/storage/signed-url?bucket=xxx&path=yyy
 * Genera una URL firmada de 1 hora para visualizar archivos privados.
 */
export async function GET(request: Request) {
  try {
    const { profile } = await requireAuth()
    
    // Validar permisos generales (admin o manager)
    if (profile.role !== "admin" && profile.role !== "manager") {
      throw new ApiRouteError("No tienes permiso para ver archivos privados.", 403)
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket")
    const path = searchParams.get("path")

    if (!bucket || !path) {
      throw new ApiRouteError("Bucket y Path son requeridos.", 400)
    }

    // Seguridad adicional: solo permitir ciertos buckets vía este endpoint
    const allowedBuckets = ["expenses", "payroll", "orders", "receipts"]
    if (!allowedBuckets.includes(bucket)) {
      throw new ApiRouteError("Acceso no permitido a este bucket.", 403)
    }

    const redirect = searchParams.get("redirect") === "true"
    const supabase = createSupabaseAdminClient()
    
    // Normalizar path en caso de que venga una URL completa
    const { getRelativePath } = await import("@/lib/storage/upload")
    const cleanPath = getRelativePath(bucket, path) || path

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600) // 1 hora de validez

    if (error || !data) {
      console.error("[Storage Error] Signed URL generation failed:", error)
      throw new ApiRouteError("No se pudo generar la URL de acceso.", 500)
    }

    if (redirect) {
      return Response.redirect(data.signedUrl)
    }

    return apiSuccess({ url: data.signedUrl })
  } catch (error) {
    return handleApiError(error)
  }
}
