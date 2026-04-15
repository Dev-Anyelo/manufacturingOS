import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { EditIcon, EyeIcon, ShirtIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"
import { Card, CardContent } from "@/components/ui/card"

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
        "group flex flex-col overflow-hidden border border-border/50 shadow-sm transition-all duration-200 rounded-xl",
        "hover:-translate-y-0.5 hover:shadow-md hover:border-border"
      )}
    >
      {/* Image zone */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShirtIcon className="size-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Garment type badge */}
        {item.garmentType ? (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 h-4 font-medium bg-background/80 backdrop-blur-sm"
            >
              {item.garmentType}
            </Badge>
          </div>
        ) : null}

        {/* Profit margin indicator */}
        <div className="absolute top-2 right-2">
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            estimatedCost={item.estimatedCost}
          />
        </div>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/0 opacity-0 transition-all duration-200 group-hover:bg-background/60 group-hover:opacity-100">
          <Button size="sm" variant="secondary" asChild className="h-8 w-8 p-0">
            <Link
              href={`/catalog/${item.id}`}
              aria-label={`Ver detalle de ${item.name}`}
            >
              <EyeIcon className="size-3.5" />
            </Link>
          </Button>
          <Button size="sm" variant="secondary" asChild className="h-8 w-8 p-0">
            <Link
              href={`/catalog/${item.id}`}
              aria-label={`Editar ${item.name}`}
            >
              <EditIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Card content */}
      <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="flex-1 space-y-0.5">
          <p className="text-sm font-semibold line-clamp-2 leading-tight">
            {item.name}
          </p>
          {!item.garmentType ? (
            <p className="text-xs text-muted-foreground italic">
              Tipo no definido
            </p>
          ) : null}
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Unitario</span>
            <span className="text-sm font-bold text-brand tabular-nums">
              <CurrencyDisplay amount={item.ourPriceUnit ?? 0} size="sm" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Docena</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              <CurrencyDisplay amount={item.ourPriceDozen ?? 0} size="sm" />
            </span>
          </div>
        </div>

        {item.notes ? (
          <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
            {item.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
