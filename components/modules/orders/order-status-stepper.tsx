import { cn } from "@/lib/utils"
import { WorkOrderStatus as WOS } from "@prisma/client"

import {
  BoxIcon,
  CheckIcon,
  InboxIcon,
  PackageIcon,
  ShieldCheckIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react"

const flow: Array<{
  status: WOS
  label: string
  icon: React.ReactNode
}> = [
  {
    status: WOS.received,
    label: "Recibido",
    icon: <InboxIcon className="size-3.5" />,
  },
  {
    status: WOS.confirmed,
    label: "Confirmado",
    icon: <CheckIcon className="size-3.5" />,
  },
  {
    status: WOS.in_production,
    label: "En producción",
    icon: <BoxIcon className="size-3.5" />,
  },
  {
    status: WOS.ready,
    label: "Listo",
    icon: <PackageIcon className="size-3.5" />,
  },
  {
    status: WOS.delivered,
    label: "Entregado",
    icon: <TruckIcon className="size-3.5" />,
  },
]

function getStepState(step: WOS, current: WOS) {
  if (current === WOS.cancelled) return "future"
  const currentIndex = flow.findIndex((i) => i.status === current)
  const stepIndex = flow.findIndex((i) => i.status === step)
  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "current"
  return "future"
}

export function OrderStatusStepper({
  status,
  className,
}: {
  status: WOS
  className?: string
}) {
  const isCancelled = status === WOS.cancelled
  const currentIndex = flow.findIndex((i) => i.status === status)
  const progressPercent = isCancelled
    ? 100
    : Math.max(0, Math.round((currentIndex / (flow.length - 1)) * 100))

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-4 text-muted-foreground" />
          <p className="text-[13px] font-semibold text-foreground">
            Flujo del pedido
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
              <XCircleIcon className="size-3" />
              Cancelado
            </span>
          ) : (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {progressPercent}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="overflow-x-auto px-5 py-4">
        <ol
          className="flex min-w-max items-center gap-0"
          aria-label="Progreso del pedido"
        >
          {flow.map((step, index) => {
            const stepState = getStepState(step.status, status)
            const isLast = index === flow.length - 1

            return (
              <li key={step.status} className="flex items-center">
                {/* Step */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                      stepState === "completed" &&
                        "border-brand bg-brand text-white shadow-sm shadow-brand/30",
                      stepState === "current" &&
                        "border-brand bg-brand/10 text-brand ring-4 ring-brand/15",
                      stepState === "future" &&
                        "border-border/60 bg-background text-muted-foreground/50"
                    )}
                    aria-label={step.label}
                  >
                    {stepState === "completed" ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium whitespace-nowrap",
                      stepState === "current" && "font-bold text-brand",
                      stepState === "completed" && "text-foreground/70",
                      stepState === "future" && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className="mx-2 mb-5 flex items-center gap-0.5">
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        className={cn(
                          "h-0.5 w-3 rounded-full transition-colors duration-300",
                          stepState === "completed"
                            ? "bg-brand"
                            : "bg-border/50"
                        )}
                      />
                    ))}
                  </div>
                )}
              </li>
            )
          })}

          {/* Cancelled badge */}
          {isCancelled && (
            <li className="flex items-center">
              <div className="mx-2 mb-5 flex gap-0.5">
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    className="h-0.5 w-3 rounded-full bg-border/50"
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-destructive/50 bg-destructive/10 text-destructive">
                  <XCircleIcon className="size-3.5" />
                </div>
                <span className="text-[11px] font-bold text-destructive">
                  Cancelado
                </span>
              </div>
            </li>
          )}
        </ol>
      </div>
    </div>
  )
}
