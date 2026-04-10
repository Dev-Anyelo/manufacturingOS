import { cn } from "@/lib/utils"
import { WorkOrderStatus } from "@prisma/client"
import { BoxIcon, CheckIcon, InboxIcon, XCircleIcon } from "lucide-react"

const flow: Array<{
  status: WorkOrderStatus
  label: string
  icon: React.ReactNode
}> = [
  {
    status: WorkOrderStatus.received,
    label: "Recibido",
    icon: <InboxIcon className="size-4" />,
  },
  {
    status: WorkOrderStatus.confirmed,
    label: "Confirmado",
    icon: <CheckIcon className="size-4" />,
  },
  {
    status: WorkOrderStatus.in_production,
    label: "En produccion",
    icon: <BoxIcon className="size-4" />,
  },
  {
    status: WorkOrderStatus.ready,
    label: "Listo",
    icon: <BoxIcon className="size-4" />,
  },
  {
    status: WorkOrderStatus.delivered,
    label: "Entregado",
    icon: <CheckIcon className="size-4" />,
  },
]

interface OrderStatusStepperProps {
  status: WorkOrderStatus
  className?: string
}

function getStepState(step: WorkOrderStatus, current: WorkOrderStatus) {
  if (current === WorkOrderStatus.cancelled) {
    return "future"
  }

  const currentIndex = flow.findIndex((item) => item.status === current)
  const stepIndex = flow.findIndex((item) => item.status === step)

  if (stepIndex < currentIndex) {
    return "completed"
  }

  if (stepIndex === currentIndex) {
    return "current"
  }

  return "future"
}

export function OrderStatusStepper({
  status,
  className,
}: OrderStatusStepperProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        className
      )}
    >
      <ol
        className="flex min-w-max items-start gap-3"
        aria-label="Progreso del pedido"
      >
        {flow.map((step, index) => {
          const stepState = getStepState(step.status, status)

          return (
            <li
              key={step.status}
              className="flex items-center gap-3"
              aria-current={stepState === "current" ? "step" : undefined}
            >
              <div className="flex min-w-28 items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                    stepState === "completed" &&
                      "border-brand bg-brand text-brand-foreground",
                    stepState === "current" &&
                      "bg-brand-muted border-brand text-brand ring-2 ring-brand/20",
                    stepState === "future" &&
                      "border-border bg-background text-muted-foreground"
                  )}
                  aria-label={`Etapa ${step.label}`}
                >
                  {stepState === "completed" ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    step.icon
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] whitespace-nowrap text-muted-foreground",
                    stepState === "current" && "font-semibold text-brand",
                    stepState === "completed" && "text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < flow.length - 1 ? (
                <span
                  className={cn(
                    "h-0.5 w-10 bg-border",
                    stepState === "completed" && "bg-brand"
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}

        {status === WorkOrderStatus.cancelled ? (
          <li className="flex items-center gap-2">
            <span className="h-px w-10 bg-border" aria-hidden="true" />
            <span className="border-danger bg-danger text-danger-foreground flex size-7 items-center justify-center rounded-full border">
              <XCircleIcon className="size-4" />
            </span>
            <span className="text-danger text-sm font-semibold">Cancelado</span>
          </li>
        ) : null}
      </ol>
    </div>
  )
}
