"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { DateRangePicker } from "@/components/shared/date-range-picker"
import { parseDateParam } from "@/lib/api/utils"

export function UrlDateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const from = fromParam ? parseDateParam(fromParam) : undefined
  const to = toParam ? parseDateParam(toParam) : undefined

  const handleChange = (range: { from?: Date; to?: Date }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (range.from) {
      params.set("from", range.from.toISOString())
    } else {
      params.delete("from")
    }

    if (range.to) {
      params.set("to", range.to.toISOString())
    } else {
      params.delete("to")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <DateRangePicker 
      from={from} 
      to={to} 
      onChange={handleChange} 
      placeholder="Filtrar por fecha..."
    />
  )
}
