import { Clock3Icon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDateTime, getMovementMeta } from "@/lib/utils"

export interface InventoryMovementEntry {
  id: string
  movementType: "in" | "out" | "adjustment"
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string | null
  createdAt: Date
  createdByName?: string | null
}

interface MovementHistoryProps {
  movements: InventoryMovementEntry[]
  unit: string
}

export function MovementHistory({ movements, unit }: MovementHistoryProps) {
  if (movements.length === 0) {
    return (
      <EmptyState
        icon={Clock3Icon}
        title="Sin movimientos registrados"
        description="El historial aparecera aqui cuando registres entradas, salidas o ajustes."
      />
    )
  }

  return (
    <div className="space-y-4">
      {movements.map((movement, index) => {
        const meta = getMovementMeta(movement.movementType)
        const Icon = meta.icon
        const isLast = index === movements.length - 1

        return (
          <article key={movement.id} className="relative pl-8">
            {!isLast ? (
              <span className="absolute top-7 left-3 h-[calc(100%+0.75rem)] w-px bg-border" />
            ) : null}

            <span className="absolute top-0 left-0 flex size-6 items-center justify-center rounded-full border border-border bg-background">
              <Icon className={`size-4 ${meta.iconClassName}`} />
            </span>

            <div className="rounded-lg border border-border/50 bg-card p-3 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(movement.createdAt)}
                </p>
              </div>

              <div className="mt-2 space-y-1 text-sm">
                <p>
                  {movement.previousQuantity.toFixed(2)} {unit} -&gt;{" "}
                  <span className="font-medium">
                    {movement.newQuantity.toFixed(2)} {unit}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Cantidad registrada: {movement.quantity.toFixed(2)} {unit}
                </p>
                {movement.reason ? <p>Motivo: {movement.reason}</p> : null}
                <p className="text-xs text-muted-foreground">
                  Usuario: {movement.createdByName ?? "Sistema"}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
