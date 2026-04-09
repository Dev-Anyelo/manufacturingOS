import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { PageHeader } from "@/components/shared/page-header"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description="Vista general de inventario, ventas y operaciones del taller."
      />

      {/* <SectionCards /> */}

      {/* <div>
        <ChartAreaInteractive />
      </div> */}

      {/* <DataTable data={data} /> */}
    </div>
  )
}
