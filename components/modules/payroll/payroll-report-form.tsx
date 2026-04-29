"use client"

import * as z from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { es } from "date-fns/locale"
import { useForm } from "react-hook-form"
import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, startOfWeek, endOfWeek, addDays } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  Clock,
  DollarSign,
  FileSpreadsheet,
  Filter,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
} from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Types
interface Employee {
  id: string
  name: string
  role: string
  department: string
  hourlyRate: number
  status: "active" | "inactive" | "vacation"
}

interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  department: string
  role: string
  weekStart: string
  weekEnd: string
  regularHours: number
  overtimeHours: number
  hourlyRate: number
  regularPay: number
  overtimePay: number
  bonuses: number
  deductions: number
  totalPay: number
  status: "draft" | "pending" | "approved" | "paid"
  approvedBy?: string
  approvedAt?: string
}

// Mock data
const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "María García López",
    role: "Costurera Senior",
    department: "Producción",
    hourlyRate: 85,
    status: "active",
  },
  {
    id: "2",
    name: "Juan Hernández Martínez",
    role: "Cortador",
    department: "Corte",
    hourlyRate: 90,
    status: "active",
  },
  {
    id: "3",
    name: "Ana Rodríguez Sánchez",
    role: "Supervisora",
    department: "Calidad",
    hourlyRate: 120,
    status: "active",
  },
  {
    id: "4",
    name: "Pedro López Ramírez",
    role: "Operador",
    department: "Producción",
    hourlyRate: 75,
    status: "vacation",
  },
  {
    id: "5",
    name: "Carmen Martínez Díaz",
    role: "Empacadora",
    department: "Empaque",
    hourlyRate: 70,
    status: "active",
  },
  {
    id: "6",
    name: "Roberto Sánchez Cruz",
    role: "Diseñador",
    department: "Diseño",
    hourlyRate: 150,
    status: "active",
  },
  {
    id: "7",
    name: "Laura Díaz Moreno",
    role: "Bordadora",
    department: "Producción",
    hourlyRate: 95,
    status: "active",
  },
  {
    id: "8",
    name: "Miguel Ángel Torres",
    role: "Planchador",
    department: "Acabados",
    hourlyRate: 80,
    status: "inactive",
  },
]

const generateMockPayroll = (): PayrollRecord[] => {
  const records: PayrollRecord[] = []
  const statuses: PayrollRecord["status"][] = [
    "draft",
    "pending",
    "approved",
    "paid",
  ]

  mockEmployees.forEach((emp, idx) => {
    const regularHours = 40 + Math.floor(Math.random() * 8)
    const overtimeHours = Math.floor(Math.random() * 12)
    const bonuses = Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0
    const deductions = Math.floor(Math.random() * 200)
    const regularPay = regularHours * emp.hourlyRate
    const overtimePay = overtimeHours * emp.hourlyRate * 1.5

    records.push({
      id: `pr-${idx + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      role: emp.role,
      weekStart: "2026-04-20",
      weekEnd: "2026-04-26",
      regularHours,
      overtimeHours,
      hourlyRate: emp.hourlyRate,
      regularPay,
      overtimePay,
      bonuses,
      deductions,
      totalPay: regularPay + overtimePay + bonuses - deductions,
      status: statuses[idx % 4],
      approvedBy: idx % 4 >= 2 ? "Admin" : undefined,
      approvedAt: idx % 4 >= 2 ? "2026-04-27" : undefined,
    })
  })

  return records
}

const adjustmentSchema = z.object({
  bonuses: z.number().min(0, "Los bonos no pueden ser negativos"),
  deductions: z.number().min(0, "Las deducciones no pueden ser negativas"),
  notes: z.string().optional(),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

export function PayrollReportForm() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [payrollRecords, setPayrollRecords] =
    useState<PayrollRecord[]>(generateMockPayroll)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [selectedRecordForAdjustment, setSelectedRecordForAdjustment] =
    useState<PayrollRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("table")
  const isMobile = useIsMobile()

  useEffect(() => {
    setActiveTab(isMobile ? "cards" : "table")
  }, [isMobile])

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      bonuses: 0,
      deductions: 0,
      notes: "",
    },
  })

  // Filtered records
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.role.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment =
        departmentFilter === "all" || record.department === departmentFilter
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [payrollRecords, searchQuery, departmentFilter, statusFilter])

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalEmployees = filteredRecords.length
    const totalHours = filteredRecords.reduce(
      (sum, r) => sum + r.regularHours + r.overtimeHours,
      0
    )
    const totalPayroll = filteredRecords.reduce((sum, r) => sum + r.totalPay, 0)
    const pendingApproval = filteredRecords.filter(
      (r) => r.status === "pending"
    ).length

    return { totalEmployees, totalHours, totalPayroll, pendingApproval }
  }, [filteredRecords])

  const departments = useMemo(
    () => Array.from(new Set(payrollRecords.map((r) => r.department))),
    [payrollRecords]
  )

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "prev" ? addDays(prev, -7) : addDays(prev, 7)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map((r) => r.id))
    } else {
      setSelectedRecords([])
    }
  }

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords((prev) => [...prev, recordId])
    } else {
      setSelectedRecords((prev) => prev.filter((id) => id !== recordId))
    }
  }

  const handleBulkApprove = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPayrollRecords((prev) =>
      prev.map((r) =>
        selectedRecords.includes(r.id) && r.status === "pending"
          ? {
              ...r,
              status: "approved" as const,
              approvedBy: "Admin",
              approvedAt: new Date().toISOString(),
            }
          : r
      )
    )
    setSelectedRecords([])
    setIsLoading(false)
    toast.success(`${selectedRecords.length} registros aprobados correctamente`)
  }

  const handleOpenAdjustment = (record: PayrollRecord) => {
    setSelectedRecordForAdjustment(record)
    form.reset({
      bonuses: record.bonuses,
      deductions: record.deductions,
      notes: "",
    })
    setIsAdjustmentDialogOpen(true)
  }

  const handleSaveAdjustment = (data: AdjustmentFormData) => {
    if (!selectedRecordForAdjustment) return

    setPayrollRecords((prev) =>
      prev.map((r) => {
        if (r.id === selectedRecordForAdjustment.id) {
          const totalPay =
            r.regularPay + r.overtimePay + data.bonuses - data.deductions
          return {
            ...r,
            bonuses: data.bonuses,
            deductions: data.deductions,
            totalPay,
          }
        }
        return r
      })
    )
    setIsAdjustmentDialogOpen(false)
    setSelectedRecordForAdjustment(null)
    toast.success("Ajustes guardados correctamente")
  }

  const getStatusBadge = (status: PayrollRecord["status"]) => {
    const config = {
      draft: { label: "Borrador", variant: "secondary" as const, icon: Edit3 },
      pending: {
        label: "Pendiente",
        variant: "outline" as const,
        icon: AlertCircle,
      },
      approved: {
        label: "Aprobado",
        variant: "default" as const,
        icon: CheckCircle2,
      },
      paid: { label: "Pagado", variant: "default" as const, icon: DollarSign },
    }
    const { label, variant, icon: Icon } = config[status]

    return (
      <Badge
        variant={variant}
        className={cn(
          "gap-1.5 font-medium",
          status === "approved" &&
            "bg-success/10 text-success border-success/20 hover:bg-success/20",
          status === "paid" &&
            "bg-info/10 text-info border-info/20 hover:bg-info/20",
          status === "pending" &&
            "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
          status === "draft" && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-3" />
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Reporte de Nómina
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gestión y aprobación de pagos semanales
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="size-4" />
                  <span className="hidden sm:inline">Actualizar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Week Navigation */}
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek("prev")}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Calendar className="size-5" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Semana del{" "}
                  {format(currentWeekStart, "d 'de' MMMM", { locale: es })} al{" "}
                  {format(weekEnd, "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Período de nómina semanal
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek("next")}
              className="gap-1"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-card-label">Empleados</p>
                  <p className="stat-card-value">
                    {summaryStats.totalEmployees}
                  </p>
                </div>
                <div className="bg-info/10 text-info flex size-10 items-center justify-center rounded-xl">
                  <Users className="size-5" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-card-label">Horas Totales</p>
                  <p className="stat-card-value">
                    {summaryStats.totalHours.toLocaleString()}
                  </p>
                </div>
                <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-xl">
                  <Clock className="size-5" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-card-label">Total Nómina</p>
                  <p className="stat-card-value text-xl sm:text-2xl">
                    {formatCurrency(summaryStats.totalPayroll)}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <DollarSign className="size-5" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-card-label">Por Aprobar</p>
                  <p className="stat-card-value">
                    {summaryStats.pendingApproval}
                  </p>
                </div>
                <div className="bg-warning/10 text-warning flex size-10 items-center justify-center rounded-xl">
                  <AlertCircle className="size-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Actions */}
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="h-10 w-full sm:w-40">
                  <Building2 className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full sm:w-36">
                  <Filter className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRecords.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRecords.length} seleccionados
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isLoading}
                  className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  Aprobar
                </Button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2 sm:max-w-xs">
              <TabsTrigger value="table" className="gap-2">
                <FileSpreadsheet className="size-4" />
                Tabla
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <Users className="size-4" />
                Tarjetas
              </TabsTrigger>
            </TabsList>

            {/* Table View */}
            <TabsContent value="table" className="space-y-4">
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedRecords.length ===
                                filteredRecords.length &&
                              filteredRecords.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Empleado</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Departamento
                        </TableHead>
                        <TableHead className="text-center">Horas</TableHead>
                        <TableHead className="text-right">
                          Pago Regular
                        </TableHead>
                        <TableHead className="hidden text-right lg:table-cell">
                          Extras
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id} className="group">
                          <TableCell>
                            <Checkbox
                              checked={selectedRecords.includes(record.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRecord(
                                  record.id,
                                  checked as boolean
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {record.employeeName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {record.role}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="font-normal">
                              {record.department}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">
                                {record.regularHours}h
                              </p>
                              {record.overtimeHours > 0 && (
                                <p className="text-success text-xs">
                                  +{record.overtimeHours}h extra
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(record.regularPay)}
                          </TableCell>
                          <TableCell className="hidden text-right lg:table-cell">
                            <div className="space-y-0.5 text-sm">
                              {record.overtimePay > 0 && (
                                <p className="text-success">
                                  +{formatCurrency(record.overtimePay)}
                                </p>
                              )}
                              {record.bonuses > 0 && (
                                <p className="text-info">
                                  +{formatCurrency(record.bonuses)}
                                </p>
                              )}
                              {record.deductions > 0 && (
                                <p className="text-destructive">
                                  -{formatCurrency(record.deductions)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(record.totalPay)}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 opacity-0 group-hover:opacity-100"
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Eye className="size-4" />
                                  Ver Detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2"
                                  onClick={() => handleOpenAdjustment(record)}
                                >
                                  <Edit3 className="size-4" />
                                  Ajustar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                                  <Trash2 className="size-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Cards View */}
            <TabsContent value="cards" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRecord(record.id, checked as boolean)
                          }
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {record.employeeName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.role}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(record.status)}
                    </div>

                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Horas</p>
                        <p className="text-lg font-semibold">
                          {record.regularHours + record.overtimeHours}h
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          Departamento
                        </p>
                        <p className="truncate text-sm font-medium">
                          {record.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total a Pagar
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {formatCurrency(record.totalPay)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAdjustment(record)}
                        className="gap-1.5"
                      >
                        <Edit3 className="size-3.5" />
                        Ajustar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Adjustment Dialog */}
        <Dialog
          open={isAdjustmentDialogOpen}
          onOpenChange={setIsAdjustmentDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ajustar Nómina</DialogTitle>
              <DialogDescription>
                {selectedRecordForAdjustment?.employeeName} -{" "}
                {selectedRecordForAdjustment?.role}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(handleSaveAdjustment)}
              className="space-y-4"
            >
              <div className="form-field">
                <Label className="form-label">Bonos</Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    {...form.register("bonuses", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.bonuses && (
                  <p className="form-error">
                    {form.formState.errors.bonuses.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label className="form-label">Deducciones</Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    {...form.register("deductions", { valueAsNumber: true })}
                  />
                </div>
                {form.formState.errors.deductions && (
                  <p className="form-error">
                    {form.formState.errors.deductions.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label className="form-label">Notas (opcional)</Label>
                <Input
                  placeholder="Razón del ajuste..."
                  {...form.register("notes")}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustmentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
