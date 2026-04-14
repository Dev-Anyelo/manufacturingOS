import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { InventoryMovementEntry } from "@/components/modules/inventory/movement-history"

import {
  ArrowDownCircleIcon,
  ArrowLeftRightIcon,
  ArrowUpCircleIcon,
} from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMovementMeta(type: InventoryMovementEntry["movementType"]) {
  if (type === "in") {
    return {
      label: "Entrada",
      icon: ArrowUpCircleIcon,
      iconClassName: "text-success",
    }
  }

  if (type === "out") {
    return {
      label: "Salida",
      icon: ArrowDownCircleIcon,
      iconClassName: "text-danger",
    }
  }

  return {
    label: "Ajuste",
    icon: ArrowLeftRightIcon,
    iconClassName: "text-brand",
  }
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}
