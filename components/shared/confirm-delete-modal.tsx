"use client"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"

type ConfirmDeleteModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  resourceName: string
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
  consequences?: string[]
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  resourceName,
  onConfirm,
  isLoading = false,
  consequences = [
    "Se eliminaran los registros asociados.",
    "Esta accion no se puede deshacer.",
    "Los reportes historicos pueden cambiar.",
  ],
}: ConfirmDeleteModalProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar eliminacion"
      description="Estas a punto de eliminar un recurso del sistema."
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      variant="danger"
      highlightedText={resourceName}
      confirmationText={resourceName}
      consequences={consequences}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  )
}
