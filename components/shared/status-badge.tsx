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
    className: "status-warning",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2Icon,
    className: "status-info",
  },
  in_production: {
    label: "En produccion",
    icon: Clock3Icon,
    className: "status-warning",
  },
  ready: {
    label: "Listo",
    icon: CheckCircle2Icon,
    className: "status-success",
  },
  delivered: {
    label: "Entregado",
    icon: BadgeDollarSignIcon,
    className: "status-paid",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircleIcon,
    className: "status-danger",
  },
}

const saleMap: Record<string, BadgeConfig> = {
  paid: {
    label: "Pagado",
    icon: CheckCircle2Icon,
    className: "status-paid",
  },
  partial: {
    label: "Parcial",
    icon: Clock3Icon,
    className: "status-warning",
  },
  pending: {
    label: "Pendiente",
    icon: PackageSearchIcon,
    className: "status-warning",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircleIcon,
    className: "status-danger",
  },
}

const payrollMap: Record<string, BadgeConfig> = {
  pending: {
    label: "Pendiente",
    icon: Clock3Icon,
    className: "status-warning",
  },
  paid: {
    label: "Pagada",
    icon: CheckCircle2Icon,
    className: "status-paid",
  },
}

const stockMap: Record<string, BadgeConfig> = {
  normal: {
    label: "Normal",
    icon: CheckCircle2Icon,
    className: "status-brand",
  },
  low: {
    label: "Bajo",
    icon: Clock3Icon,
    className: "status-warning",
  },
  critical: {
    label: "Critico",
    icon: AlertTriangleIcon,
    className: "status-critical",
  },
  out: {
    label: "Agotado",
    icon: XCircleIcon,
    className: "status-subtle",
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
      className: "status-subtle",
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
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}
