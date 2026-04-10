import Link from "next/link"
import Image from "next/image"
import { EditIcon, EyeIcon, ShirtIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

import { Card, CardContent, CardTitle } from "@/components/ui/card"

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
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border border-border/50 shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:border-border hover:shadow-lg"
      )}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShirtIcon className="size-12 text-muted-foreground/40" />
          </div>
        )}

        <div className="absolute top-2 right-2">
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            estimatedCost={item.estimatedCost}
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover:bg-background/60 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/catalog/${item.id}`}>
                <EyeIcon className="size-4" />
              </Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/catalog/${item.id}`}>
                <EditIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-base">{item.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {item.garmentType ?? "Tipo no definido"}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Precio unitario</span>
          <CurrencyDisplay
            amount={item.ourPriceUnit ?? 0}
            size="sm"
            className="font-bold text-brand"
          />
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
    </Card>
  )
}
