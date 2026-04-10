import { Badge } from "@/components/ui/badge"
import { ShirtIcon } from "lucide-react"

import { GARMENT_TYPES } from "@/types"

type GarmentTypeKey = keyof typeof GARMENT_TYPES

interface GarmentTypeBadgeProps {
  type: string
}

export function GarmentTypeBadge({ type }: GarmentTypeBadgeProps) {
  const normalized = type as GarmentTypeKey
  const label = GARMENT_TYPES[normalized] ?? type

  return (
    <Badge variant="outline" className="status-subtle gap-1.5">
      <ShirtIcon className="size-3.5" />
      {label}
    </Badge>
  )
}
