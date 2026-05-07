"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart for financials"

export interface FinancialChartData {
  date: string
  sales: number
  expenses: number
}

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "var(--success)",
  },
  expenses: {
    label: "Gastos",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: { data: FinancialChartData[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    const referenceDate = new Date()
    referenceDate.setHours(0, 0, 0, 0)
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)

    return data.filter((item) => {
      const date = new Date(item.date)
      date.setHours(0, 0, 0, 0)
      return date >= startDate
    })
  }, [data, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Flujo de caja</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Ventas vs Gastos (ultimos 3 meses)
          </span>
          <span className="@[540px]/card:hidden">Ventas vs Gastos</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Ultimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Ultimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Ultimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Seleccionar periodo"
            >
              <SelectValue placeholder="Ultimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Ultimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Ultimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Ultimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-NI", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-NI", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                  formatter={(value: any, name: any) => {
                    const numValue = typeof value === "number" ? value : 0
                    return (
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-muted-foreground capitalize">
                          {name}
                        </span>
                        <span className="font-medium tabular-nums">
                          ${numValue.toFixed(2)}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillExpenses)"
              stroke="var(--color-expenses)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
