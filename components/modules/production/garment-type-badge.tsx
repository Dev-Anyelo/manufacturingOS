import { GARMENT_TYPES } from "@/types"
import { ShirtIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type GarmentTypeKey = keyof typeof GARMENT_TYPES

interface GarmentTypeBadgeProps {
  garmentType?: string
  type?: string
}

export function GarmentTypeBadge({ garmentType, type }: GarmentTypeBadgeProps) {
  const value = garmentType ?? type ?? "other"
  const normalized = value as GarmentTypeKey
  const label = GARMENT_TYPES[normalized] ?? value

  return (
    <Badge variant="outline" className="status-subtle gap-1.5">
      <ShirtIcon className="size-3.5" />
      {label}
    </Badge>
  )
}
