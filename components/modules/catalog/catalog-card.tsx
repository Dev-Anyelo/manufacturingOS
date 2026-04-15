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
        "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
      )}
    >
      {/* Image zone */}
      <div className="relative aspect-4/5 shrink-0 overflow-hidden bg-muted/30">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary/20">
            <ShirtIcon className="size-10 text-muted-foreground/30 transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}

        {/* Garment type badge */}
        {item.garmentType ? (
          <div className="absolute top-2 left-2 z-10">
            <Badge
              variant="secondary"
              className="border border-border/50 bg-background/80 px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur-md"
            >
              {item.garmentType}
            </Badge>
          </div>
        ) : null}

        {/* Profit margin indicator */}
        <div className="absolute top-2 right-2 z-10">
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            estimatedCost={item.estimatedCost}
          />
        </div>

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100 group-hover:backdrop-blur-[2px]">
          <Button
            size="icon"
            variant="outline"
            asChild
            className="h-9 w-9 rounded-full border-border/30 bg-background/95 text-foreground shadow-lg transition-transform hover:scale-105 hover:bg-background"
          >
            <Link
              href={`/catalog/${item.id}`}
              aria-label={`Ver detalle de ${item.name}`}
            >
              <EyeIcon className="size-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="outline"
            asChild
            className="h-9 w-9 rounded-full border-border/30 bg-background/95 text-foreground shadow-lg transition-transform hover:scale-105 hover:bg-background"
          >
            <Link
              href={`/catalog/${item.id}/edit`}
              aria-label={`Editar ${item.name}`}
            >
              <EditIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Card content */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1 space-y-1">
          <p className="line-clamp-2 text-[14px] leading-tight font-semibold tracking-tight text-foreground">
            {item.name}
          </p>
          {!item.garmentType ? (
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground/80 italic">
              <span className="inline-block size-1.5 rounded-full bg-muted-foreground/30" />
              Tipo no definido
            </p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Unitario
            </span>
            <span className="text-sm font-bold text-brand tabular-nums">
              <CurrencyDisplay amount={item.ourPriceUnit ?? 0} size="sm" />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Docena
            </span>
            <span className="text-[13px] font-medium text-muted-foreground/80 tabular-nums">
              <CurrencyDisplay amount={item.ourPriceDozen ?? 0} size="sm" />
            </span>
          </div>
        </div>

        {item.notes ? (
          <div className="mt-1 flex gap-1.5 rounded-lg border border-border/30 bg-secondary/40 p-2.5">
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/90">
              {item.notes}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
