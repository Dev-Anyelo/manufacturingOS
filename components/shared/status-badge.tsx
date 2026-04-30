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
    className:
      "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  in_production: {
    label: "En producción",
    icon: Clock3Icon,
    className:
      "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  ready: {
    label: "Listo",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  delivered: {
    label: "Entregado",
    icon: BadgeDollarSignIcon,
    className:
      "border-transparent bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircleIcon,
    className:
      "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
}

const saleMap: Record<string, BadgeConfig> = {
  paid: {
    label: "Pagado",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  partial: {
    label: "Parcial",
    icon: Clock3Icon,
    className:
      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  pending: {
    label: "Pendiente",
    icon: PackageSearchIcon,
    className:
      "border-transparent bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircleIcon,
    className:
      "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
}

const payrollMap: Record<string, BadgeConfig> = {
  pending: {
    label: "Pendiente",
    icon: Clock3Icon,
    className:
      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  paid: {
    label: "Pagada",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
}

const stockMap: Record<string, BadgeConfig> = {
  normal: {
    label: "Stock óptimo",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  optimal: {
    label: "Stock óptimo",
    icon: CheckCircle2Icon,
    className:
      "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  low: {
    label: "Stock bajo",
    icon: Clock3Icon,
    className:
      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  critical: {
    label: "Stock crítico",
    icon: AlertTriangleIcon,
    className:
      "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  out: {
    label: "Agotado",
    icon: XCircleIcon,
    className:
      "border-transparent bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-400",
  },
  out_of_stock: {
    label: "Agotado",
    icon: XCircleIcon,
    className:
      "border-transparent bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-400",
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
      className:
        "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    }
  )
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config = getConfig(type, status)
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="size-3 shrink-0" />
      {config.label}
    </Badge>
  )
}
