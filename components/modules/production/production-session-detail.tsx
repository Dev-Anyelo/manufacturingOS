import {
  ClipboardListIcon,
  RulerIcon,
  ScissorsIcon,
  UserRoundIcon,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { GarmentTypeBadge } from "@/components/modules/production/garment-type-badge"

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ProductionSessionDetail({
  session,
}: ProductionSessionDetailProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Empleado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="flex items-center gap-2 text-lg font-semibold">
              <UserRoundIcon className="size-4 text-brand" />
              {session.employeeName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Registrado por {session.createdByName}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Produccion total
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="flex items-center gap-2 text-lg font-semibold">
              <ScissorsIcon className="size-4 text-brand" />
              {session.totalGarments} prendas
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <RulerIcon className="size-4" />
              {session.totalYardsUsed.toFixed(2)} yardas
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Jornada:{" "}
              <span className="font-medium">
                {formatDateTime(session.sessionDate)}
              </span>
            </p>
            <p className="text-muted-foreground">
              Creado: {formatDateTime(session.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle>Items de produccion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="rounded-xl border border-border/50">
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

          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardListIcon className="size-4" />
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
