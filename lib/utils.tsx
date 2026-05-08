import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { formatDateOnlyNI, normalizeDateOnly } from "@/lib/currency/exchange"
import { InventoryMovementEntry } from "@/components/modules/inventory/movement-history"

import {
  Currency,
  GarmentType,
  UserRole,
  WorkOrderStatus,
} from "@prisma/client"

import {
  ArrowDownCircleIcon,
  ArrowLeftRightIcon,
  ArrowUpCircleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  LucideIcon,
  PackageCheckIcon,
  PackageIcon,
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
  return new Intl.DateTimeFormat("es-NI", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

/**
 * Configuración visual y semántica de cada estado.
 * Usa tokens semánticos cuando es posible y colores Tailwind
 * sólo para diferenciar estados (info/success/danger/etc.).
 */
export const statusConfig: Record<WorkOrderStatus, StatusMeta> = {
  received: {
    label: "Recibido",
    description: "El pedido aún no ha comenzado.",
    icon: CircleDashedIcon,
    dot: "bg-zinc-400 dark:bg-zinc-500",
    badge:
      "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-200",
    card: "border-zinc-200 bg-zinc-50/60 dark:border-zinc-800/60 dark:bg-zinc-900/40",
  },
  in_production: {
    label: "En producción",
    description: "El pedido está en producción.",
    icon: CircleDotIcon,
    dot: "bg-amber-500",
    badge:
      "border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300",
    card: "border-amber-200/60 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20",
  },
  ready: {
    label: "Listo",
    description: "Listo para retirar.",
    icon: CheckCircle2Icon,
    dot: "bg-sky-500",
    badge:
      "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300",
    card: "border-sky-200/60 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20",
  },
  delivered: {
    label: "Entregado",
    description: "El pedido fue entregado al cliente.",
    icon: PackageCheckIcon,
    dot: "bg-emerald-500",
    badge:
      "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    card: "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  },
  cancelled: {
    label: "Cancelado",
    description: "El pedido fue cancelado.",
    icon: XCircleIcon,
    dot: "bg-rose-500",
    badge:
      "border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
    card: "border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20",
  },
  confirmed: {
    label: "Confirmado",
    description: "El pedido está confirmado.",
    icon: CheckCircle2Icon,
    dot: "bg-indigo-500",
    badge:
      "border-indigo-300/60 bg-indigo-50 text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300",
    card: "border-indigo-200/60 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20",
  },
}

export function formatDate(value: string | Date) {
  return formatDateOnlyNI(value, "dd/MM/yyyy")
}

export function formatCurrency(amount: number, currency?: Currency) {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: currency || Currency.USD,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea la hora en locale es-NI (12h con AM/PM)
 */
export function formatTimeNI(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed)
}

/**
 * Formatea fecha y hora completa en locale es-NI
 */
export function formatDateTimeNI(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("es-NI", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(parsed)
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
  const deliveryDate = normalizeDateOnly(order.deliveryDate)
  const today = normalizeDateOnly(new Date())

  if (!deliveryDate || !today) {
    return false
  }

  return (
    deliveryDate.getTime() < today.getTime() &&
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
  const today = normalizeDateOnly(new Date())
  const delivery = normalizeDateOnly(deliveryDate)
  const diff =
    today && delivery ? delivery.getTime() - today.getTime() : Number.NaN
  return {
    isOverdue: Number.isFinite(diff) ? diff < 0 : false,
    isUrgent: Number.isFinite(diff)
      ? diff >= 0 && diff <= 24 * 60 * 60 * 1000
      : false,
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
  const date = normalizeDateOnly(value)
  const today = normalizeDateOnly(new Date())
  if (!date || !today) {
    return "Fecha inválida"
  }

  const diff = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
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
    color:
      "bg-[var(--surface-3)] text-[var(--text-primary)] outline outline-1 outline-border",
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
    color:
      "bg-[var(--surface-2)] text-[var(--text-muted)] outline outline-1 outline-border",
    dot: "bg-[var(--text-muted)]",
  },
}

export interface StatusMeta {
  label: string
  description: string
  icon: LucideIcon
  /** Clases utilitarias para el dot/indicador */
  dot: string
  /** Clases utilitarias para el badge completo */
  badge: string
  /** Clases utilitarias para el contenedor "card" del estado */
  card: string
}

export function getGarmetTypeLabel(type: GarmentType) {
  switch (type) {
    case GarmentType.shirt:
      return "Camisa"
    case GarmentType.skirt:
      return "Falda"
    case GarmentType.shorts:
      return "Shorts"
    case GarmentType.leggings:
      return "Leggings"
    case GarmentType.pajamas:
      return "Pijamas"
    case GarmentType.suit:
      return "Traje"
    case GarmentType.sheets:
      return "Sábanas"
    case GarmentType.blankets:
      return "Edredones"
    default:
      return "Otro"
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case UserRole.manager:
      return "Gerente"
    case UserRole.admin:
      return "Administrador"
    case UserRole.employee:
      return "Empleado"
    case UserRole.readonly:
      return "Solo lectura"
    default:
      return "Otro"
  }
}
