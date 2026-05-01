"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon, SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AdjustStockDialog } from "@/components/modules/inventory/adjust-stock-dialog"

type InventoryDetailActionsProps = {
  item: {
    id: string
    name: string
    quantity: number
    unit: string
  }
}

export function InventoryDetailActions({ item }: InventoryDetailActionsProps) {
  const router = useRouter()
  const [adjustOpen, setAdjustOpen] = React.useState(false)

  return (
    <>
      <div className="flex w-full gap-2 sm:w-auto flex-row flex-wrap sm:justify-end">
        <Button asChild variant="outline" size="sm" className="max-w-fit">
          <Link href="/inventory">
            <ChevronLeftIcon className="size-4" />
            Volver
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="max-w-fit"
          onClick={() => setAdjustOpen(true)}
        >
          <SlidersHorizontalIcon className="size-4" />
          Ajustar stock
        </Button>
      </div>

      <AdjustStockDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={{
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
        }}
        onAdjusted={() => {
          setAdjustOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
