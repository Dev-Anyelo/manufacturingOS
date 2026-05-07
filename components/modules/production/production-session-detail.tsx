import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/shared/stat-card"
import { formatDateOnlyNI } from "@/lib/currency/exchange"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GarmentTypeBadge } from "@/components/modules/production/garment-type-badge"

import {
  MessageCircleIcon,
  RulerIcon,
  ScissorsIcon,
  UserRoundIcon,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface ProductionDetailItem {
  id: string
  inventoryItemName: string
  garmentType: string
  size: string
  quantity: number
  yardsUsed: number
  notes: string | null
}

export interface ProductionDetailSession {
  id: string
  sessionDate: string
  employeeName: string
  notes: string | null
  totalGarments: number
  totalYardsUsed: number
  createdAt: string
  createdByName: string
  items: ProductionDetailItem[]
}

interface ProductionSessionDetailProps {
  session: ProductionDetailSession
}

export function ProductionSessionDetail({
  session,
}: ProductionSessionDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Fecha de sesión"
          value={formatDateOnlyNI(session.sessionDate)}
          description="Fecha de la jornada de produccion."
          icon={<RulerIcon className="size-4" />}
        />
        <StatCard
          title="Empleado"
          value={session.employeeName}
          description="Responsable de la sesion."
          icon={<UserRoundIcon className="size-4" />}
        />
        <StatCard
          title="Total prendas"
          value={session.totalGarments.toString()}
          description="Total de prendas confeccionadas."
          icon={<ScissorsIcon className="size-4" />}
        />
        <StatCard
          title="Total yardas"
          value={session.totalYardsUsed.toFixed(2)}
          description="Total de yardas de tela utilizadas."
          icon={<RulerIcon className="size-4" />}
        />
      </div>

      <Card className="m-0 rounded-none border-none bg-transparent p-0 shadow-none">
        <CardHeader className="m-0 border-none bg-none p-0 shadow-none">
          <CardTitle>Items de produccion</CardTitle>
          <p className="text-sm text-pretty text-muted-foreground">
            Detalle de insumos y prendas procesadas en la sesion.
          </p>
        </CardHeader>
        <CardContent className="m-0 space-y-4 border-none bg-none p-0 pt-2 shadow-none">
          <div className="space-y-3 md:hidden">
            {session.items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {item.inventoryItemName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <GarmentTypeBadge garmentType={item.garmentType} />
                      <Badge variant="outline">
                        {item.size === "custom" ? "Personalizada" : item.size}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Cantidad</p>
                    <p className="text-sm font-semibold">{item.quantity}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-2.5">
                    <p className="label-overline">Yardas</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {item.yardsUsed.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-2.5">
                    <p className="label-overline">Material</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {item.inventoryItemName}
                    </p>
                  </div>
                </div>

                {item.notes ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="hidden rounded border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Prenda</TableHead>
                  <TableHead className="hidden sm:table-cell">Talla</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Yardas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {item.inventoryItemName}
                        </p>
                        {item.notes ? (
                          <p className="text-xs text-muted-foreground">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <GarmentTypeBadge garmentType={item.garmentType} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {item.size === "custom" ? "Personalizada" : item.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.yardsUsed.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <MessageCircleIcon className="size-3.5" />
              Notas de jornada
            </p>
            <p className="text-sm">
              {session.notes ?? "Sin notas registradas."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
