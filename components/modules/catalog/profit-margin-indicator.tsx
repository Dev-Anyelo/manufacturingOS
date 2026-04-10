import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface ProfitMarginIndicatorProps {
  ourPriceUnit: number | null
  estimatedCost: number | null
}

export function ProfitMarginIndicator({
  ourPriceUnit,
  estimatedCost,
}: ProfitMarginIndicatorProps) {
  if (!ourPriceUnit || estimatedCost === null || estimatedCost === undefined) {
    return <Badge variant="outline">Sin costo base</Badge>
  }

  if (ourPriceUnit <= 0) {
    return <Badge variant="outline">Sin precio</Badge>
  }

  const margin = ((ourPriceUnit - estimatedCost) / ourPriceUnit) * 100
  const rounded = Number.isFinite(margin) ? margin : 0

  if (rounded < 0) {
    return (
      <Badge className="tone-danger gap-1">
        <TrendingDownIcon className="size-3.5" />
        {rounded.toFixed(1)}%
      </Badge>
    )
  }

  return (
    <Badge className="tone-success gap-1">
      <TrendingUpIcon className="size-3.5" />
      {rounded.toFixed(1)}%
    </Badge>
  )
}
