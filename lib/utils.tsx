import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { WorkOrderStatus } from "@prisma/client"
import { InventoryMovementEntry } from "@/components/modules/inventory/movement-history"

import {
  ArrowDownCircleIcon,
  ArrowLeftRightIcon,
  ArrowUpCircleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  PackageCheckIcon,
  PackageIcon,
  ScissorsIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TruckIcon,
  UserIcon,
  XCircleIcon,
  ZapIcon,
} from "lucide-react"

import {
  OrderStatusColumns,
  OrderSummaryItem,
} from "@/components/modules/orders/types"

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

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export const statusConfig: Record<
  WorkOrderStatus,
  {
    label: string
    icon: React.ReactNode
    dot: string
    badge: string
    headerBg: string
    bodyBg: string
    border: string
    progress: number
  }
> = {
  [WorkOrderStatus.received]: {
    label: "Recibido",
    progress: 10,
    icon: <ClipboardListIcon className="size-3.5" />,
    dot: "bg-slate-400",
    badge:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    headerBg: "bg-slate-50/80 dark:bg-slate-900/40",
    bodyBg: "bg-slate-50/40 dark:bg-slate-900/20",
    border: "border-slate-200/70 dark:border-slate-700/50",
  },
  [WorkOrderStatus.confirmed]: {
    label: "Confirmado",
    progress: 30,
    icon: <CheckCircle2Icon className="size-3.5" />,
    dot: "bg-blue-500",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
    headerBg: "bg-blue-50/80 dark:bg-blue-950/30",
    bodyBg: "bg-blue-50/30 dark:bg-blue-950/15",
    border: "border-blue-200/70 dark:border-blue-800/50",
  },
  [WorkOrderStatus.in_production]: {
    label: "En producción",
    progress: 60,
    icon: <ScissorsIcon className="size-3.5" />,
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
    headerBg: "bg-amber-50/80 dark:bg-amber-950/30",
    bodyBg: "bg-amber-50/30 dark:bg-amber-950/15",
    border: "border-amber-200/70 dark:border-amber-800/50",
  },
  [WorkOrderStatus.ready]: {
    label: "Listo",
    progress: 85,
    icon: <PackageCheckIcon className="size-3.5" />,
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60",
    headerBg: "bg-emerald-50/80 dark:bg-emerald-950/30",
    bodyBg: "bg-emerald-50/30 dark:bg-emerald-950/15",
    border: "border-emerald-200/70 dark:border-emerald-800/50",
  },
  [WorkOrderStatus.delivered]: {
    label: "Entregado",
    progress: 100,
    icon: <TruckIcon className="size-3.5" />,
    dot: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60",
    headerBg: "bg-violet-50/80 dark:bg-violet-950/30",
    bodyBg: "bg-violet-50/30 dark:bg-violet-950/15",
    border: "border-violet-200/70 dark:border-violet-800/50",
  },
  [WorkOrderStatus.cancelled]: {
    label: "Cancelado",
    progress: 0,
    icon: <XCircleIcon className="size-3.5" />,
    dot: "bg-red-400",
    badge:
      "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/60",
    headerBg: "bg-red-50/80 dark:bg-red-950/30",
    bodyBg: "bg-red-50/30 dark:bg-red-950/15",
    border: "border-red-200/70 dark:border-red-800/50",
  },
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "short" }).format(
    new Date(value)
  )
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export const statuses: WorkOrderStatus[] = [
  WorkOrderStatus.received,
  WorkOrderStatus.confirmed,
  WorkOrderStatus.in_production,
  WorkOrderStatus.ready,
  WorkOrderStatus.delivered,
  WorkOrderStatus.cancelled,
]

export function groupByStatus(orders: OrderSummaryItem[]): OrderStatusColumns {
  const grouped = {
    [WorkOrderStatus.received]: [] as OrderSummaryItem[],
    [WorkOrderStatus.confirmed]: [] as OrderSummaryItem[],
    [WorkOrderStatus.in_production]: [] as OrderSummaryItem[],
    [WorkOrderStatus.ready]: [] as OrderSummaryItem[],
    [WorkOrderStatus.delivered]: [] as OrderSummaryItem[],
    [WorkOrderStatus.cancelled]: [] as OrderSummaryItem[],
  }

  for (const status of statuses) {
    grouped[status] = orders.filter((order) => order.status === status)
  }

  return grouped
}

export function isOverdue(order: OrderSummaryItem) {
  return (
    new Date(order.deliveryDate).getTime() < Date.now() &&
    order.status !== WorkOrderStatus.delivered &&
    order.status !== WorkOrderStatus.cancelled
  )
}

export const channelLabelMap: Record<OrderSummaryItem["channel"], string> = {
  in_person: "Tienda",
  referral: "Referido",
  social_media: "Redes",
  returning_customer: "Recurrente",
  other: "Otro",
}

export const channelIconMap: Record<
  OrderSummaryItem["channel"],
  React.ReactNode
> = {
  in_person: <ShoppingBagIcon className="size-3" />,
  referral: <UserIcon className="size-3" />,
  social_media: <SparklesIcon className="size-3" />,
  returning_customer: <CheckCircle2Icon className="size-3" />,
  other: <TagIcon className="size-3" />,
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function getUrgency(deliveryDate: string) {
  const now = new Date()
  const delivery = new Date(deliveryDate)
  const diff = delivery.getTime() - now.getTime()
  return {
    isOverdue: diff < 0,
    isUrgent: diff >= 0 && diff <= 24 * 60 * 60 * 1000,
    diff,
  }
}

export const actionConfig: Partial<
  Record<
    WorkOrderStatus,
    { label: string; variant: "default" | "destructive"; icon: React.ReactNode }
  >
> = {
  [WorkOrderStatus.confirmed]: {
    label: "Confirmar pedido",
    variant: "default",
    icon: <CheckCircle2Icon className="size-3.5" />,
  },
  [WorkOrderStatus.in_production]: {
    label: "Iniciar producción",
    variant: "default",
    icon: <ZapIcon className="size-3.5" />,
  },
  [WorkOrderStatus.ready]: {
    label: "Marcar como listo",
    variant: "default",
    icon: <PackageIcon className="size-3.5" />,
  },
  [WorkOrderStatus.delivered]: {
    label: "Marcar como entregado",
    variant: "default",
    icon: <TruckIcon className="size-3.5" />,
  },
  [WorkOrderStatus.cancelled]: {
    label: "Cancelar pedido",
    variant: "destructive",
    icon: <XCircleIcon className="size-3.5" />,
  },
}

export function formatDateRelative(value: string) {
  const date = new Date(value)
  const now = new Date()
  const diff = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return `Hace ${Math.abs(diff)} días`
  if (diff === 0) return "Hoy"
  if (diff === 1) return "Mañana"
  return `En ${diff} días`
}

export const measurementLabels: Record<string, string> = {
  bust: "Busto",
  waist: "Cintura",
  hips: "Cadera",
  length: "Largo",
  sleeve: "Manga",
}

export const transitionMap: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.received]: [
    WorkOrderStatus.confirmed,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.confirmed]: [
    WorkOrderStatus.in_production,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.in_production]: [
    WorkOrderStatus.ready,
    WorkOrderStatus.cancelled,
  ],
  [WorkOrderStatus.ready]: [WorkOrderStatus.delivered],
  [WorkOrderStatus.delivered]: [],
  [WorkOrderStatus.cancelled]: [],
}

export const channelConfig: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  in_person: {
    label: "En tienda",
    color:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  referral: {
    label: "Referido",
    color:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  social_media: {
    label: "Redes",
    color:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    dot: "bg-sky-500",
  },
  returning_customer: {
    label: "Recurrente",
    color:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  other: {
    label: "Otro",
    color:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
  },
}
