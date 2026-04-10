import Link from "next/link"
import Image from "next/image"
import { LayersIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

export interface CatalogCardItem {
  id: string
  name: string
  garmentType: string | null
  ourPriceUnit: number | null
  ourPriceDozen: number | null
  marketPriceUnit: number | null
  estimatedCost: number | null
  imageUrl: string | null
  notes: string | null
}

interface CatalogCardProps {
  item: CatalogCardItem
}

export function CatalogCard({ item }: CatalogCardProps) {
  return (
    <Card className="flex h-full flex-col border border-border/50 shadow-sm">
      <CardHeader className="space-y-3 pb-2">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={420}
              height={240}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center">
              <LayersIcon className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-base">{item.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {item.garmentType ?? "Tipo no definido"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Precio unitario</span>
          <CurrencyDisplay amount={item.ourPriceUnit ?? 0} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Docena</span>
          <CurrencyDisplay amount={item.ourPriceDozen ?? 0} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Mercado</span>
          <CurrencyDisplay amount={item.marketPriceUnit ?? 0} size="sm" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Margen estimado</span>
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            estimatedCost={item.estimatedCost}
          />
        </div>

        <p className="line-clamp-2 text-xs text-muted-foreground">
          {item.notes ?? "Sin notas registradas"}
        </p>
      </CardContent>

      <CardFooter className="mt-auto flex justify-end pt-1">
        <Button asChild variant="outline" size="sm">
          <Link href={`/catalog/${item.id}`}>Ver detalle</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
