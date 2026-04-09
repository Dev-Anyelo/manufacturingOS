import { getFileExtension } from "@/lib/api/utils"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = createSupabaseAdminClient()
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  })

  if (error) {
    throw new Error("No se pudo subir el archivo a Storage.")
  }

  return path
}

function buildPath(root: string, refId: string, filename: string) {
  const extension = getFileExtension(filename)
  return `${root}/${refId}/${Date.now()}.${extension}`
}

export async function uploadInventoryImage(file: File, itemId: string) {
  const path = buildPath("inventory", itemId, file.name)
  await uploadFile("inventory", path, file)

  const supabase = createSupabaseAdminClient()
  const { data } = supabase.storage.from("inventory").getPublicUrl(path)
  return data.publicUrl
}

export async function uploadOrderReference(file: File, orderId: string) {
  const path = buildPath("orders", orderId, file.name)
  await uploadFile("orders", path, file)
  return path
}

export async function uploadReceipt(
  file: File,
  type: "expense" | "payroll",
  refId: string
) {
  const path = buildPath(type, refId, file.name)
  await uploadFile("receipts", path, file)
  return path
}

export async function uploadPayrollReceiptBuffer(
  pdfBuffer: Buffer,
  refId: string
) {
  const supabase = createSupabaseAdminClient()
  const path = `payroll/${refId}/${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    })

  if (error) {
    throw new Error("No se pudo subir el comprobante PDF.")
  }

  return path
}

export async function uploadCatalogImage(file: File, itemId: string) {
  const path = buildPath("catalog", itemId, file.name)
  await uploadFile("catalog", path, file)

  const supabase = createSupabaseAdminClient()
  const { data } = supabase.storage.from("catalog").getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFile(bucket: string, path: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error("No se pudo eliminar el archivo del almacenamiento.")
  }
}
