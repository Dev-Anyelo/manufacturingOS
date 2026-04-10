import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import {
  AlertTriangleIcon,
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  Clock3Icon,
  PackageSearchIcon,
  XCircleIcon,
} from "lucide-react"


interface StatusBadgeProps {
  status: string
  type: "work-order" | "sale" | "payroll" | "stock"
}

type BadgeConfig = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  className: string
}

const workOrderMap: Record<string, BadgeConfig> = {
  received: {
    label: "Recibido",
    icon: PackageSearchIcon,
    className: "border-border text-muted-foreground",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2Icon,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  in_production: {
    label: "En produccion",
    icon: Clock3Icon,
    className:
      "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  ready: {
    label: "Listo",
    icon: CheckCircle2Icon,
    className: "border-brand/30 bg-brand-muted text-brand",
  },
  delivered: {
    label: "Entregado",
    icon: BadgeDollarSignIcon,
    className:
      "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircleIcon,
    className: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  },
}

const saleMap: Record<string, BadgeConfig> = {
  paid: {
    label: "Pagada",
    icon: CheckCircle2Icon,
    className: "border-brand/30 bg-brand-muted text-brand",
  },
  partial: {
    label: "Parcial",
    icon: Clock3Icon,
    className:
      "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  pending: {
    label: "Pendiente",
    icon: PackageSearchIcon,
    className: "border-border text-muted-foreground",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircleIcon,
    className: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  },
}

const payrollMap: Record<string, BadgeConfig> = {
  pending: {
    label: "Pendiente",
    icon: Clock3Icon,
    className:
      "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  paid: {
    label: "Pagada",
    icon: CheckCircle2Icon,
    className: "border-brand/30 bg-brand-muted text-brand",
  },
}

const stockMap: Record<string, BadgeConfig> = {
  normal: {
    label: "Normal",
    icon: CheckCircle2Icon,
    className: "border-brand/30 bg-brand-muted text-brand",
  },
  low: {
    label: "Bajo",
    icon: Clock3Icon,
    className:
      "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  critical: {
    label: "Critico",
    icon: AlertTriangleIcon,
    className: "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  },
  out: {
    label: "Agotado",
    icon: XCircleIcon,
    className:
      "border-black/20 bg-black text-white dark:border-white/20 dark:bg-white dark:text-black",
  },
}

function getConfig(
  type: StatusBadgeProps["type"],
  status: string
): BadgeConfig {
  const normalized = status.toLowerCase()
  const mapByType = {
    "work-order": workOrderMap,
    sale: saleMap,
    payroll: payrollMap,
    stock: stockMap,
  }[type]

  return (
    mapByType[normalized] ?? {
      label: status,
      icon: PackageSearchIcon,
      className: "border-border text-muted-foreground",
    }
  )
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = getConfig(type, status)
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("gap-1.5", config.className)}>
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  )
}
