import { getFileExtension } from "@/lib/api/utils"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

/**
 * Retorna la configuración de privacidad y límites por bucket.
 */
export function getBucketConfig(bucket: string) {
  const configs: Record<
    string,
    { public: boolean; maxSize: number; allowedTypes: string[] }
  > = {
    catalog: {
      public: true,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    inventory: {
      public: true,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    expenses: {
      public: false,
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    },
    payroll: {
      public: false,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
    },
    orders: {
      public: false,
      maxSize: 20 * 1024 * 1024,
      allowedTypes: ["image/jpeg", "image/png"],
    },
  }

  return (
    configs[bucket] || {
      public: false,
      maxSize: 5 * 1024 * 1024,
      allowedTypes: [],
    }
  )
}

/**
 * Valida un archivo contra la configuración del bucket.
 */
export function validateFile(file: File, bucket: string) {
  const config = getBucketConfig(bucket)

  if (file.size > config.maxSize) {
    throw new Error(
      `El archivo excede el tamaño máximo permitido (${config.maxSize / 1024 / 1024}MB).`
    )
  }

  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido. Permitidos: ${config.allowedTypes.join(", ")}`
    )
  }
}

/**
 * Genera una ruta de almacenamiento sanitizada.
 */
export function generateStoragePath(
  bucket: string,
  recordId: string,
  filename: string
) {
  const extension = getFileExtension(filename)
  const sanitizedId = recordId.replace(/[^a-z0-9]/gi, "_")
  return `${sanitizedId}/${Date.now()}.${extension}`
}

/**
 * Sube un archivo al almacenamiento (vía Admin Client para bypass RLS interno).
 */
export async function uploadFile(bucket: string, path: string, file: File) {
  validateFile(file, bucket)

  const supabase = createSupabaseAdminClient()
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  })

  if (error) {
    console.error(`[Storage Error] Upload failed for ${bucket}/${path}:`, error)
    throw new Error(`No se pudo subir el archivo a ${bucket}.`)
  }

  return path
}

/**
 * Elimina un archivo físico del almacenamiento.
 */
/**
 * Retorna la URL de visualización para un path almacenado.
 * NOTA: Solo funciona para buckets públicos. Para privados, usar la API de signed-url.
 */
export function getStorageUrl(bucket: string, path: string | null) {
  if (!path) return null
  if (path.startsWith("http")) return path
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return path
  
  // Limpiar path de slashes extra al inicio
  const cleanPath = path.startsWith("/") ? path.substring(1) : path
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`
}

/**
 * Extrae el path relativo de una URL completa de Supabase.
 * Ejemplo: https://.../storage/v1/object/public/bucket/folder/file.jpg -> folder/file.jpg
 */
export function getRelativePath(bucket: string, url: string | null) {
  if (!url) return null
  if (!url.startsWith("http")) return url

  const parts = url.split(`/${bucket}/`)
  if (parts.length > 1) {
    return parts[1]
  }

  return url
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = createSupabaseAdminClient()
  const cleanPath = getRelativePath(bucket, path) || path
  
  const { error } = await supabase.storage.from(bucket).remove([cleanPath])

  if (error) {
    console.error(`[Storage Error] Delete failed for ${bucket}/${cleanPath}:`, error)
    throw new Error("No se pudo eliminar el archivo del almacenamiento.")
  }
}

// ─── Funciones específicas por módulo (Wrapper) ───────────────────────────

export async function uploadCatalogImage(file: File, itemId: string) {
  const path = generateStoragePath("catalog", itemId, file.name)
  return await uploadFile("catalog", path, file)
}

export async function uploadInventoryImage(file: File, itemId: string) {
  const path = generateStoragePath("inventory", itemId, file.name)
  return await uploadFile("inventory", path, file)
}

export async function uploadReceipt(
  file: File,
  type: "expenses" | "payroll",
  refId: string
) {
  const path = generateStoragePath(type, refId, file.name)
  return await uploadFile(type, path, file)
}

export async function uploadOrderReference(file: File, orderId: string) {
  const path = generateStoragePath("orders", orderId, file.name)
  return await uploadFile("orders", path, file)
}

/**
 * Especial para PDFs generados en servidor (Buffer).
 */
export async function uploadPayrollReceiptBuffer(
  pdfBuffer: Buffer,
  refId: string
) {
  const supabase = createSupabaseAdminClient()
  const path = `${refId.replace(/[^a-z0-9]/gi, "_")}/${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from("payroll")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) {
    console.error("[Storage Error] PDF Buffer upload failed:", error)
    throw new Error("No se pudo subir el comprobante PDF.")
  }

  return path
}
