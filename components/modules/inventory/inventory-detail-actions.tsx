"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilLine, SlidersHorizontalIcon } from "lucide-react"

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
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
        <Button asChild variant="outline" size="sm" className="min-h-10 sm:min-h-9">
          <Link href="/inventory">
            <ArrowLeftIcon className="size-4" />
            Volver
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="min-h-10 sm:min-h-9">
          <Link href={`/inventory/${item.id}/edit`}>
            <PencilLine className="size-3.5" />
            Editar material
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="min-h-10 sm:min-h-9"
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
