import Link from "next/link"
import Image from "next/image"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getStorageUrl } from "@/lib/storage/upload"
import { GARMENT_TYPES } from "@/types"
import { cn, getGarmetTypeLabel } from "@/lib/utils"
import { Currency, GarmentType } from "@prisma/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUpRight, ShirtIcon, PencilIcon } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { CurrencyDisplay } from "@/components/shared/currency-display"
import { CatalogForm } from "@/components/modules/catalog/catalog-form"
import { ProfitMarginIndicator } from "@/components/modules/catalog/profit-margin-indicator"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

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
  marketPriceDozen: number | null
  marketPriceDozenCurrency: string | null
  estimatedCost: number | null
  estimatedCostCurrency: string | null
  imageUrl: string | null
  notes: string | null
  totalStock: number
  finishedGoods?: Array<{
    id: string
    size: string
    color: string | null
    stock: number
    minimumStock: number
  }>
}

interface CatalogCardProps {
  item: CatalogCardItem
}

export function CatalogCard({ item }: CatalogCardProps) {
  const [open, setOpen] = React.useState(false)
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
              className="px-2 py-0.5 text-[10px] font-bold tracking-wide"
            >
              {getGarmetTypeLabel(item.garmentType as GarmentType)}
            </Badge>
          </div>
        ) : null}

        {/* Profit margin indicator and Stock */}
        <div className="absolute top-2 right-2 z-10 flex flex-wrap items-center justify-end gap-1.5">
          <ProfitMarginIndicator
            ourPriceUnit={item.ourPriceUnit}
            ourPriceCurrency={item.ourPriceUnitCurrency as Currency}
            estimatedCost={item.estimatedCost}
            estimatedCostCurrency={item.estimatedCostCurrency as Currency}
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
                currency={item.ourPriceUnitCurrency as Currency}
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
                currency={item.ourPriceDozenCurrency as Currency}
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
        <div className="flex w-full gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(true)}>
            Editar
          </Button>

          <Button size="icon" variant="outline" asChild>
            <Link
              href={`/catalog/${item.id}`}
              aria-label={`Ver detalle de ${item.name}`}
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>

      <Sheet open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <SheetContent
          side="right"
          className={cn(
            "flex flex-col gap-0 border-border p-0 sm:max-w-2xl",
            ""
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/70 px-4 py-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <PencilIcon className="size-4 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base">Editar producto</SheetTitle>
                <SheetDescription className="text-sm text-pretty">
                  Actualiza la información del producto seleccionado.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-4">
              <CatalogForm
                mode="edit"
                itemId={item.id}
                defaultValues={{
                  name: item.name,
                  description: null,
                  garment_type:
                    item.garmentType &&
                    Object.prototype.hasOwnProperty.call(
                      GARMENT_TYPES,
                      item.garmentType as GarmentType
                    )
                      ? (item.garmentType as GarmentType)
                      : ("other" as GarmentType),
                  market_price_unit: item.marketPriceUnit ?? 0,
                  market_price_unit_currency:
                    (item.marketPriceUnitCurrency ?? "USD") as Currency,
                  market_price_dozen: item.marketPriceDozen ?? null,
                  market_price_dozen_currency:
                    (item.marketPriceDozenCurrency ?? "USD") as Currency,
                  our_price_unit: item.ourPriceUnit ?? 0,
                  our_price_unit_currency:
                    (item.ourPriceUnitCurrency ?? "USD") as Currency,
                  our_price_dozen: item.ourPriceDozen ?? null,
                  our_price_dozen_currency:
                    (item.ourPriceDozenCurrency ?? "USD") as Currency,
                  estimated_cost: item.estimatedCost ?? null,
                  estimated_cost_currency:
                    (item.estimatedCostCurrency ?? "USD") as Currency,
                  notes: item.notes,
                  image_url: item.imageUrl,
                  stock_entries:
                    item.finishedGoods?.map((fg) => ({
                      size: fg.size,
                      color: fg.color ?? "",
                      quantity: fg.stock,
                      minimumStock: fg.minimumStock,
                    })) ?? [],
                }}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </Card>
  )
}
