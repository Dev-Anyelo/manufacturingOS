import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { GarmentType } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ShirtIcon } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"
import { getStorageUrl } from "@/lib/storage/upload"

export interface CatalogCardItem {
  id: string
  name: string
  garmentType: string | null
  ourPriceUnit: number | null
  ourPriceUnitCurrency: string | null
  ourPriceDozen: number | null
  ourPriceDozenCurrency: string | null
  marketPriceUnit: number | null
  marketPriceUnitCurrency: string | null
  estimatedCost: number | null
  estimatedCostCurrency: string | null
  imageUrl: string | null
  notes: string | null
  totalStock: number
}

interface CatalogCardProps {
  item: CatalogCardItem
}

export function CatalogCard({ item }: CatalogCardProps) {
  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card pt-0 shadow-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
      )}
    >
      {/* Image zone */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-muted/30">
        {item.imageUrl ? (
          <Image
            src={getStorageUrl("catalog", item.imageUrl) || ""}
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
              className="border border-border/50 bg-background/80 px-2 py-0.5 text-xs font-medium shadow-sm backdrop-blur-md"
            >
              {item.garmentType === GarmentType.shirt
                ? "Camisa"
                : item.garmentType === GarmentType.skirt
                  ? "Falda"
                  : item.garmentType === GarmentType.shorts
                    ? "Pantalones cortos"
                    : item.garmentType === GarmentType.leggings
                      ? "Leggings"
                      : item.garmentType === GarmentType.pajamas
                        ? "Pijamas"
                        : item.garmentType === GarmentType.suit
                          ? "Traje"
                          : item.garmentType === GarmentType.sheets
                            ? "Sábanas"
                            : item.garmentType === GarmentType.blankets
                              ? "Mantas"
                              : "Otro"}
            </Badge>
          </div>
        ) : null}

        {/* Profit margin indicator and Stock */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            ourPriceCurrency={item.ourPriceUnitCurrency as any}
            estimatedCost={item.estimatedCost}
            estimatedCostCurrency={item.estimatedCostCurrency as any}
          />
          <Badge
            variant={item.totalStock > 0 ? "default" : "destructive"}
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold shadow-sm",
              item.totalStock > 0 ? "bg-emerald-500/90 text-white" : ""
            )}
          >
            {item.totalStock} en stock
          </Badge>
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
              <CurrencyDisplay
                amount={item.ourPriceUnit ?? 0}
                currency={item.ourPriceUnitCurrency as any}
                size="sm"
              />
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Docena
            </span>
            <span className="text-[13px] font-medium text-muted-foreground/80 tabular-nums">
              <CurrencyDisplay
                amount={item.ourPriceDozen ?? 0}
                currency={item.ourPriceDozenCurrency as any}
                size="sm"
              />
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
      <CardFooter className="pt-3">
        <Button size="icon" variant="outline" asChild className="w-full">
          <Link
            href={`/catalog/${item.id}`}
            aria-label={`Ver detalle de ${item.name}`}
          >
            Detalle
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
