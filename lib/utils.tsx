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
    dot: "bg-slate-500",
    badge: "bg-[var(--surface-3)] text-[var(--text-primary)] border-[var(--table-border)]",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
  [WorkOrderStatus.confirmed]: {
    label: "Confirmado",
    progress: 30,
    icon: <CheckCircle2Icon className="size-3.5" />,
    dot: "bg-info",
    badge: "bg-info-soft text-info border-info/20",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
  [WorkOrderStatus.in_production]: {
    label: "En producción",
    progress: 60,
    icon: <ScissorsIcon className="size-3.5" />,
    dot: "bg-[color:var(--stage)]",
    badge:
      "bg-[rgb(var(--stage-rgb)/0.14)] text-[color:var(--stage)] border-[rgb(var(--stage-rgb)/0.28)]",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
  [WorkOrderStatus.ready]: {
    label: "Listo",
    progress: 85,
    icon: <PackageCheckIcon className="size-3.5" />,
    dot: "bg-success",
    badge:
      "bg-[rgb(var(--success-rgb)/0.14)] text-success border-[rgb(var(--success-rgb)/0.28)]",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
  [WorkOrderStatus.delivered]: {
    label: "Entregado",
    progress: 100,
    icon: <TruckIcon className="size-3.5" />,
    dot: "bg-success",
    badge: "bg-success-soft text-success border-success/20",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
  [WorkOrderStatus.cancelled]: {
    label: "Cancelado",
    progress: 0,
    icon: <XCircleIcon className="size-3.5" />,
    dot: "bg-danger",
    badge: "bg-danger-soft text-danger border-danger/20",
    headerBg: "bg-[var(--surface-2)]",
    bodyBg: "bg-[var(--surface-1)]",
    border: "border-border",
  },
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-PA", { dateStyle: "short" }).format(
    new Date(value)
  )
}

export function formatCurrency(amount: number) {
  // forzar a nicaragua
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getSpanishGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Buenos días"
  if (hour < 19) return "Buenas tardes"
  return "Buenas noches"
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

export function formatDateRelative(value: string | Date) {
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
    color: "bg-brand/10 text-brand outline outline-1 outline-brand/20",
    dot: "bg-brand",
  },
  referral: {
    label: "Referido",
    color: "bg-[var(--surface-3)] text-[var(--text-primary)] outline outline-1 outline-border",
    dot: "bg-[var(--text-primary)]",
  },
  social_media: {
    label: "Redes",
    color: "bg-info-soft text-info outline outline-1 outline-info/20",
    dot: "bg-info",
  },
  returning_customer: {
    label: "Recurrente",
    color: "bg-success-soft text-success outline outline-1 outline-success/20",
    dot: "bg-success",
  },
  other: {
    label: "Otro",
    color: "bg-[var(--surface-2)] text-[var(--text-muted)] outline outline-1 outline-border",
    dot: "bg-[var(--text-muted)]",
  },
}
