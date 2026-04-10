## MISIÓN

Refinar TODOS los componentes existentes. No reescribir la lógica — mejorar la presentación visual,
la experiencia de usuario, y garantizar uso exclusivo de componentes ShadCN UI en lugar de
implementaciones manuales. Cada pantalla debe sentirse como un producto SaaS de categoría mundial.

---

## PRINCIPIOS DE REFINAMIENTO

### Lo que debes BUSCAR y CORREGIR en cada componente:

1. **Reemplazar componentes manuales** — Si hay un calendario, selector de fecha, combobox, o
   modal construido a mano: reemplazarlo con el componente ShadCN correspondiente.

2. **Aplicar tokens de diseño consistentes** — Usar siempre `bg-background`, `bg-card`,
   `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`. NUNCA colores hex.

3. **Espaciado y densidad** — Usar escala Tailwind: `p-4`, `p-6`, `gap-4`, `gap-6`.
   Headers de sección con `mb-6`. Items de lista con `py-3` o `py-4`.

4. **Estados interactivos** — Todo elemento clickeable necesita:
   `hover:bg-muted/50 active:scale-[0.98] transition-all duration-150 cursor-pointer`

5. **Tipografía jerárquica** — Títulos: `text-lg font-semibold` o `text-xl font-semibold`.
   Subtítulos: `text-sm font-medium`. Metadata: `text-xs text-muted-foreground`.

6. **Mobile-First estricto** — Cada componente se diseña para 375px y se expande con
   `sm:`, `md:`, `lg:`. En mobile: padding reducido (`p-3`), texto más pequeño, columnas apiladas.

---

## SISTEMA DE DISEÑO — REGLAS ABSOLUTAS

```tsx
// ✅ CORRECTO — usar tokens del sistema
<div className="bg-card border border-border rounded-lg p-4 shadow-sm">
<p className="text-muted-foreground text-sm">

// ❌ INCORRECTO — hardcodear colores
<div className="bg-[#161d22] border-[#2a3749]">
<p className="text-gray-500">

// ✅ Brand color
<Button className="bg-brand hover:bg-brand/90 text-brand-foreground">
<span className="text-brand">

// ✅ Variantes de Button correctas
<Button variant="default">    // bg-primary (brand verde)
<Button variant="outline">    // borde visible, bg transparent
<Button variant="ghost">      // sin borde, hover sutil
<Button variant="destructive"> // rojo para eliminar

// ✅ Componentes ShadCN obligatorios
import { Calendar } from "@/components/ui/calendar"           // NO react-day-picker directo
import { Popover, PopoverContent, PopoverTrigger } from ...   // para date pickers
import { Command, CommandInput, CommandItem } from ...        // para combobox/search
import { Select, SelectTrigger, SelectContent, SelectItem }  // para dropdowns
import { RadioGroup, RadioGroupItem } from ...                // para opciones
import { Checkbox } from "@/components/ui/checkbox"          // NO input type="checkbox"
import { Switch } from "@/components/ui/switch"              // para toggles
import { Tabs, TabsList, TabsTrigger, TabsContent } from ...  // para tabs
import { Sheet, SheetContent, SheetHeader } from ...         // para drawers mobile
import { Dialog, DialogContent, DialogHeader } from ...      // para modales
import { AlertDialog, AlertDialogAction } from ...           // para confirmaciones
import { Tooltip, TooltipContent, TooltipTrigger } from ...  // para hints
import { Badge } from "@/components/ui/badge"                // para etiquetas
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // para usuarios
import { Skeleton } from "@/components/ui/skeleton"          // para loading
import { Progress } from "@/components/ui/progress"          // para barras
import { ScrollArea } from "@/components/ui/scroll-area"     // para scroll contenido
import { Separator } from "@/components/ui/separator"        // para divisores
import { Collapsible, CollapsibleContent } from ...          // para acordeones
import { Card, CardHeader, CardContent, CardFooter } from .. // para cards
```

---

## COMPONENTES SHARED — REFINAMIENTO

### `components/shared/data-table.tsx`

**Problemas típicos a corregir:**
- Toolbar sin altura mínima consistente
- Paginación con texto inconsistente
- Acciones de fila con DropdownMenu que se corta en mobile

**Refinamiento requerido:**
```tsx
// Toolbar: altura h-10 fija, gap-2 entre elementos, flex-wrap en mobile
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">

// Header de columna — ordenable con indicador visual
<Button variant="ghost" className="h-8 px-2 -ml-2 font-medium text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground">
  {column.name}
  <ArrowUpDown className="ml-1 h-3 w-3" />
</Button>

// Fila de tabla con hover state correcto
<TableRow className="hover:bg-muted/40 transition-colors border-border/50">

// Celda de acciones — siempre visible, sin truncar
<TableCell className="w-12.5 pr-4">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuItem>...</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>

// Paginación
<div className="flex items-center justify-between px-2 py-3 border-t border-border/50">
  <p className="text-sm text-muted-foreground">
    Mostrando {start}–{end} de {total}
  </p>
  <div className="flex gap-1">
    <Button variant="outline" size="sm" disabled={!canPrev} onClick={prev}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="sm" disabled={!canNext} onClick={next}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>

// Empty state dentro de la tabla — centrado con padding generoso
<TableRow>
  <TableCell colSpan={columns.length} className="h-48 text-center">
    <div className="flex flex-col items-center gap-2 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-40" />
      <p className="text-sm font-medium">{emptyMessage}</p>
      <p className="text-xs">{emptyDescription}</p>
      {emptyAction}
    </div>
  </TableCell>
</TableRow>
```

---

### `components/shared/stat-card.tsx`

```tsx
// Layout refinado — ícono a la derecha, valor prominente
<Card className={cn(
  "relative overflow-hidden transition-all duration-200",
  href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
  variantStyles[variant]
)}>
  <CardContent className="p-4 sm:p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
        )}
        {trend && !isLoading && (
          <div className={cn("flex items-center gap-1 text-xs",
            trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
          )}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{trend.value}% {trend.label}</span>
          </div>
        )}
      </div>
      <div className={cn("rounded-lg p-2.5", iconBgStyles[variant])}>
        {/* ícono cloneado con tamaño h-5 w-5 */}
      </div>
    </div>
    {description && (
      <p className="mt-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
        {description}
      </p>
    )}
  </CardContent>
</Card>

// Variantes de color (usando clases Tailwind, no hex)
const variantStyles = {
  default: "bg-card",
  success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
  warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
  danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
}
const iconBgStyles = {
  default: "bg-muted",
  success: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
  danger: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
}
```

---

### `components/shared/confirm-dialog.tsx`

```tsx
// Variante danger — replicar Supabase exactamente
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
    </AlertDialogHeader>

    {variant === 'danger' && (
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Esta acción es irreversible</AlertTitle>
        <AlertDescription>{warningText}</AlertDescription>
      </Alert>
    )}

    <p className="text-sm text-muted-foreground">
      {description}
      {highlightedText && (
        <> el usuario <span className="font-semibold text-foreground">{highlightedText}</span>?</>
      )}
    </p>

    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
      <AlertDialogCancel asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          {cancelLabel ?? "Cancelar"}
        </Button>
      </AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'default'}
          onClick={onConfirm}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {confirmLabel ?? "Confirmar"}
        </Button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## MÓDULOS — REFINAMIENTO DETALLADO

---

### 📦 INVENTARIO — Refinamiento

#### `components/modules/inventory/inventory-table.tsx`

**Columna Material (refinada):**
```tsx
// Avatar cuadrado con fallback de ícono, no circular
<div className="flex items-center gap-3">
  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted">
    {item.imageUrl ? (
      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
    ) : (
      <div className="flex h-full items-center justify-center">
        <Layers className="h-5 w-5 text-muted-foreground/50" />
      </div>
    )}
  </div>
  <div className="min-w-0">
    <p className="text-sm font-medium truncate">{item.name}</p>
    <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.category]}</p>
  </div>
</div>
```

**Columna Stock (refinada):**
```tsx
<div className="space-y-1.5 min-w-[120px]">
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm font-medium tabular-nums">
      {Number(item.quantity).toFixed(2)} {item.unit}
    </span>
    <StatusBadge status={stockStatus} type="stock" />
  </div>
  <Progress
    value={progressValue}
    className={cn("h-1.5", progressColorClass)}
  />
</div>
```

**Toolbar con filtros mejorados:**
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
  <SearchInput
    value={search}
    onChange={setSearch}
    placeholder="Buscar por nombre o proveedor..."
    className="w-full sm:max-w-xs"
  />
  <div className="flex gap-2 flex-wrap">
    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
      <SelectTrigger className="h-9 w-full sm:w-[140px] text-xs">
        <SelectValue placeholder="Categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas</SelectItem>
        {/* items con ícono inline */}
      </SelectContent>
    </Select>
    <Select value={stockFilter} onValueChange={setStockFilter}>
      <SelectTrigger className="h-9 w-full sm:w-[130px] text-xs">
        <SelectValue placeholder="Stock" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        <SelectItem value="normal">Normal</SelectItem>
        <SelectItem value="low">Bajo</SelectItem>
        <SelectItem value="critical">Crítico</SelectItem>
        <SelectItem value="out">Agotado</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

#### `components/modules/inventory/adjust-stock-dialog.tsx`

**Reemplazar cualquier radio manual con ShadCN RadioGroup:**
```tsx
<RadioGroup value={adjustType} onValueChange={setAdjustType}
  className="grid grid-cols-3 gap-2">
  {["add", "subtract", "set"].map((type) => (
    <label key={type} className={cn(
      "flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-all",
      "hover:bg-muted/50",
      adjustType === type
        ? "border-brand bg-brand-muted text-brand"
        : "border-border text-muted-foreground"
    )}>
      <RadioGroupItem value={type} className="sr-only" />
      {/* ícono por tipo */}
      <span className="text-xs font-medium">{TYPE_LABELS[type]}</span>
    </label>
  ))}
</RadioGroup>

// Preview de resultado — prominente
<div className={cn(
  "rounded-lg border p-3 text-center",
  resultIsValid
    ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"
    : "border-red-500/30 bg-red-50 dark:bg-red-950/20"
)}>
  <p className="text-xs text-muted-foreground mb-1">Stock resultante</p>
  <p className="text-lg font-bold tabular-nums">
    <span className="text-muted-foreground line-through text-sm mr-2">
      {currentQuantity} {unit}
    </span>
    <span className={resultIsValid ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
      {newQuantity} {unit}
    </span>
  </p>
</div>
```

#### `components/modules/inventory/inventory-form.tsx`

**Zona de upload mejorada:**
```tsx
// Usar ShadCN para label interactivo + input file oculto
<div className={cn(
  "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 sm:p-8",
  "transition-all duration-200 cursor-pointer",
  isDragging
    ? "border-brand bg-brand-muted"
    : "border-border/60 bg-muted/30 hover:border-border hover:bg-muted/50"
)}>
  {preview ? (
    // Preview con botón X para remover
    <div className="relative">
      <Image src={preview} alt="preview" width={120} height={120} className="rounded-lg object-cover" />
      <Button
        type="button" variant="destructive" size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={removeImage}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  ) : (
    <>
      <div className="rounded-full bg-muted p-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Arrastra una imagen o haz clic</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG hasta 5MB</p>
      </div>
    </>
  )}
  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
</div>

// Campo fabric_type — condicional con transición
<div className={cn(
  "overflow-hidden transition-all duration-300",
  watchCategory === 'fabric' ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
)}>
  <FormFieldWrapper name="fabric_type" label="Tipo de tela" control={control}>
    {(field) => (
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
        <SelectContent>
          {FABRIC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
    )}
  </FormFieldWrapper>
</div>
```

---

### 🧵 PRODUCCIÓN — Refinamiento

#### `components/modules/production/production-form.tsx`

**Selector de empleado — usar Command + Popover de ShadCN:**
```tsx
// REEMPLAZAR cualquier select nativo o implementación manual
<Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox"
      className="w-full justify-between font-normal h-10">
      {selectedEmployee ? (
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px]">
              {getInitials(selectedEmployee.fullName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{selectedEmployee.fullName}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">Seleccionar empleado...</span>
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
    <Command>
      <CommandInput placeholder="Buscar empleado..." />
      <CommandEmpty>No se encontraron empleados.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          {employees.map(emp => (
            <CommandItem key={emp.id} value={emp.fullName}
              onSelect={() => { setEmployee(emp); setEmployeeOpen(false) }}>
              <Check className={cn("mr-2 h-4 w-4",
                selectedEmployee?.id === emp.id ? "opacity-100" : "opacity-0")} />
              <div>
                <p className="text-sm font-medium">{emp.fullName}</p>
                <p className="text-xs text-muted-foreground">{CONTRACT_LABELS[emp.contractType]}</p>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**DatePicker — usar Calendar + Popover de ShadCN:**
```tsx
// REEMPLAZAR cualquier input type="date" nativo
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline"
      className={cn("w-full justify-start text-left font-normal h-10",
        !date && "text-muted-foreground")}>
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      initialFocus
      locale={es}
    />
  </PopoverContent>
</Popover>
```

**Líneas de producción — Card por línea en mobile:**
```tsx
// Mobile: cada línea es un Card con Collapsible
// Desktop: tabla inline con celdas compactas

// En mobile (< md):
<div className="space-y-3 md:hidden">
  {fields.map((field, index) => (
    <Card key={field.id} className="border-border/50">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Línea {index + 1}</span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* campos del item */}
      </CardContent>
    </Card>
  ))}
</div>

// En desktop (md+): tabla compacta
<div className="hidden md:block border border-border/50 rounded-lg overflow-hidden">
  <table className="w-full">
    <thead className="bg-muted/50">
      <tr>
        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Material</th>
        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Tipo</th>
        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Talla</th>
        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cant.</th>
        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Yardas</th>
        <th className="w-10"></th>
      </tr>
    </thead>
    <tbody>
      {fields.map((field, index) => (
        <tr key={field.id} className="border-t border-border/50">
          {/* celdas con inputs compactos h-8 */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

### 💰 VENTAS — Refinamiento

#### `components/modules/sales/pos-interface.tsx`

**Layout del POS:**
```tsx
// Desktop: grid fijo 60/40 con altura de viewport
<div className="hidden md:grid md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px] h-[calc(100vh-4rem)] gap-0">
  <div className="overflow-y-auto border-r border-border/50">
    <PosCatalogPanel />
  </div>
  <div className="overflow-y-auto bg-card">
    <PosCart />
  </div>
</div>

// Mobile: Tabs de ShadCN con badge en "Carrito"
<div className="md:hidden">
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="w-full rounded-none border-b border-border/50 bg-background h-12">
      <TabsTrigger value="catalog" className="flex-1 text-sm">
        <LayoutGrid className="mr-2 h-4 w-4" />
        Catálogo
      </TabsTrigger>
      <TabsTrigger value="cart" className="flex-1 text-sm">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Carrito
        {cartCount > 0 && (
          <Badge className="ml-1.5 h-5 min-w-5 rounded-full bg-brand text-brand-foreground text-[10px] px-1">
            {cartCount}
          </Badge>
        )}
      </TabsTrigger>
    </TabsList>
    <TabsContent value="catalog" className="mt-0 h-[calc(100vh-8rem)] overflow-y-auto">
      <PosCatalogPanel />
    </TabsContent>
    <TabsContent value="cart" className="mt-0 h-[calc(100vh-8rem)] overflow-y-auto">
      <PosCart />
    </TabsContent>
  </Tabs>
</div>
```

#### `components/modules/sales/pos-cart.tsx`

**Método de pago — RadioGroup estilizado:**
```tsx
<RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}
  className="grid grid-cols-2 gap-2">
  {PAYMENT_METHODS.map(method => (
    <label key={method.value} className={cn(
      "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-all text-sm",
      "hover:bg-muted/50",
      paymentMethod === method.value
        ? "border-brand bg-brand-muted font-medium"
        : "border-border text-muted-foreground"
    )}>
      <RadioGroupItem value={method.value} className="sr-only" />
      <method.icon className="h-4 w-4 flex-shrink-0" />
      {method.label}
    </label>
  ))}
</RadioGroup>

// Total prominente con separador
<Separator className="my-4" />
<div className="space-y-1.5">
  <div className="flex justify-between text-sm text-muted-foreground">
    <span>Subtotal</span>
    <CurrencyDisplay amount={subtotal} />
  </div>
  {discount > 0 && (
    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
      <span>Descuento</span>
      <span>-<CurrencyDisplay amount={discount} /></span>
    </div>
  )}
  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border/50">
    <span>Total</span>
    <CurrencyDisplay amount={total} size="lg" />
  </div>
</div>

// Botón de confirmar — prominente verde brand
<Button
  className="w-full h-12 text-base font-semibold bg-brand hover:bg-brand/90 text-brand-foreground mt-4"
  disabled={cartItems.length === 0 || isSubmitting}
  onClick={handleSubmit}
>
  {isSubmitting ? (
    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
  ) : (
    <CheckCircle className="mr-2 h-5 w-5" />
  )}
  Registrar Venta
</Button>
```

#### `components/modules/sales/customer-selector.tsx`

```tsx
// Usar Command + Popover — IGUAL que el selector de empleado en producción
// Añadir opción especial "Crear nuevo cliente"
<CommandGroup heading="Clientes">
  {customers.map(customer => (
    <CommandItem key={customer.id} ...>
      <Avatar className="h-6 w-6 mr-2">
        <AvatarFallback className="text-[10px] bg-muted">
          {getInitials(customer.fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{customer.fullName}</p>
        <p className="text-xs text-muted-foreground">{customer.phone ?? customer.email}</p>
      </div>
    </CommandItem>
  ))}
</CommandGroup>
<CommandSeparator />
<CommandGroup>
  <CommandItem onSelect={() => setCreateMode(true)}
    className="text-brand font-medium">
    <Plus className="mr-2 h-4 w-4" />
    Crear nuevo cliente
  </CommandItem>
</CommandGroup>
```

---

### 📋 PEDIDOS — Refinamiento

#### `components/modules/orders/order-kanban.tsx`

**Columnas del Kanban:**
```tsx
// Header de columna con color por estado
const COLUMN_STYLES: Record<WorkOrderStatus, string> = {
  received: "border-t-slate-400",
  confirmed: "border-t-blue-500",
  in_production: "border-t-amber-500",
  ready: "border-t-brand",
  delivered: "border-t-emerald-600",
  cancelled: "border-t-red-500",
}

<div className={cn(
  "flex flex-col rounded-xl border-t-2 bg-muted/30 min-h-[200px] min-w-[260px] sm:min-w-[280px]",
  COLUMN_STYLES[status]
)}>
  <div className="flex items-center justify-between px-3 py-2.5">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold">{STATUS_LABELS[status]}</span>
      <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 text-xs">
        {orders.length}
      </Badge>
    </div>
  </div>
  <ScrollArea className="flex-1 px-2 pb-2">
    <div className="space-y-2">
      {/* OrderCards */}
    </div>
  </ScrollArea>
</div>

// Vista mobile — Select + lista
<div className="md:hidden space-y-3">
  <Select value={mobileFilter} onValueChange={setMobileFilter}>
    <SelectTrigger className="w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {Object.entries(STATUS_LABELS).map(([value, label]) => (
        <SelectItem key={value} value={value}>
          <div className="flex items-center gap-2">
            <span>{label}</span>
            <Badge variant="secondary" className="text-xs">{counts[value]}</Badge>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <div className="space-y-2">
    {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
  </div>
</div>
```

#### `components/modules/orders/order-card.tsx`

```tsx
<Card className={cn(
  "group cursor-pointer border-border/50 bg-card transition-all duration-150",
  "hover:shadow-md hover:-translate-y-0.5 hover:border-border",
  isDragging && "shadow-lg rotate-1 scale-105 opacity-90"
)}>
  <CardContent className="p-3.5 space-y-3">
    {/* Fila 1: Cliente + urgencia */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-[10px] bg-muted font-medium">
            {getInitials(order.customer.fullName)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold truncate">{order.customer.fullName}</span>
      </div>
      {isOverdue && (
        <Badge variant="destructive" className="text-[10px] flex-shrink-0">Vencido</Badge>
      )}
      {isUrgent && !isOverdue && (
        <Badge className="text-[10px] flex-shrink-0 bg-amber-500 text-white">Urgente</Badge>
      )}
    </div>

    {/* Fila 2: Metadata */}
    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Scissors className="h-3 w-3 flex-shrink-0" />
        <span>{order.items.length} prenda{order.items.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={cn("flex items-center gap-1",
        isOverdue ? "text-red-500 font-medium" :
        isUrgent ? "text-amber-600 dark:text-amber-400 font-medium" : ""
      )}>
        <CalendarClock className="h-3 w-3 flex-shrink-0" />
        <span>{format(parseISO(order.deliveryDate), 'd MMM', { locale: es })}</span>
      </div>
    </div>

    {/* Fila 3: Saldo (si aplica) */}
    {Number(order.balanceDue) > 0 && (
      <div className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1.5 text-xs">
        <span className="text-amber-700 dark:text-amber-400 font-medium">Saldo pendiente</span>
        <CurrencyDisplay amount={order.balanceDue} className="text-amber-700 dark:text-amber-400 font-bold" />
      </div>
    )}
  </CardContent>
</Card>
```

#### `components/modules/orders/order-status-stepper.tsx`

```tsx
// Stepper horizontal con línea conectora
<div className="overflow-x-auto -mx-4 px-4 pb-1">
  <div className="flex items-center min-w-max gap-0">
    {STEPS.map((step, index) => {
      const isComplete = stepIndex > index
      const isCurrent = stepIndex === index
      const isCancelled = status === 'cancelled'

      return (
        <React.Fragment key={step.status}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
              isComplete && "border-brand bg-brand text-brand-foreground",
              isCurrent && !isCancelled && "border-brand bg-brand-muted text-brand ring-2 ring-brand/20",
              isCurrent && isCancelled && "border-destructive bg-destructive/10 text-destructive",
              !isComplete && !isCurrent && "border-border bg-background text-muted-foreground"
            )}>
              {isComplete ? <Check className="h-4 w-4" /> :
               isCurrent && isCancelled ? <X className="h-4 w-4" /> :
               step.emoji}
            </div>
            <span className={cn(
              "text-[10px] font-medium whitespace-nowrap",
              isCurrent && !isCancelled && "text-brand",
              isCurrent && isCancelled && "text-destructive",
              !isCurrent && !isComplete && "text-muted-foreground"
            )}>
              {isCancelled && isCurrent ? "Cancelado" : step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn(
              "h-0.5 w-8 sm:w-12 mx-1 transition-all",
              stepIndex > index ? "bg-brand" : "bg-border"
            )} />
          )}
        </React.Fragment>
      )
    })}
  </div>
</div>
```

---

### 💸 GASTOS — Refinamiento

#### `components/modules/expenses/expense-form.tsx`

**Switch con campo condicional animado:**
```tsx
// Switch de ShadCN para updates_inventory
<div className="flex items-center justify-between rounded-lg border border-border/50 p-3 sm:p-4">
  <div className="space-y-0.5">
    <Label className="text-sm font-medium cursor-pointer">Actualiza inventario</Label>
    <p className="text-xs text-muted-foreground">
      Aumenta el stock del material seleccionado
    </p>
  </div>
  <Switch
    checked={updatesInventory}
    onCheckedChange={setUpdatesInventory}
    className="data-[state=checked]:bg-brand"
  />
</div>

{/* Campo condicional con animación CSS */}
<div className={cn(
  "space-y-3 overflow-hidden transition-all duration-300",
  updatesInventory ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
)}>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
    {/* selector material + campo cantidad */}
  </div>
</div>
```

**Cálculo automático de total:**
```tsx
// Total se calcula automáticamente y se muestra de forma prominente
<div className="rounded-lg bg-brand-muted border border-brand/20 p-4 text-center">
  <p className="text-xs font-medium text-brand/70 uppercase tracking-wide mb-1">Total calculado</p>
  <p className="text-2xl font-bold text-brand">
    {calculatedTotal > 0
      ? new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(calculatedTotal)
      : '$0.00'
    }
  </p>
  {quantity && unitPrice && (
    <p className="text-xs text-muted-foreground mt-1">
      {quantity} × ${unitPrice} = ${calculatedTotal}
    </p>
  )}
</div>
```

---

### 👥 PLANILLA — Refinamiento

#### `components/modules/payroll/payroll-form.tsx`

**Resumen de pago en tiempo real:**
```tsx
// Card prominente que se actualiza en tiempo real
<Card className="border-brand/30 bg-brand-muted sticky bottom-0 sm:static">
  <CardContent className="p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold">Resumen del pago</h3>
      <Badge className="bg-brand text-brand-foreground text-xs">
        {STATUS_LABELS[watch('status') ?? 'pending']}
      </Badge>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Base</span>
        <CurrencyDisplay amount={watchBaseAmount} />
      </div>
      {watchBonuses > 0 && (
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>+ Bonificaciones</span>
          <CurrencyDisplay amount={watchBonuses} />
        </div>
      )}
      {watchDeductions > 0 && (
        <div className="flex justify-between text-red-500">
          <span>- Deducciones</span>
          <CurrencyDisplay amount={watchDeductions} />
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-bold text-base">
        <span>Total a pagar</span>
        <CurrencyDisplay amount={total} size="lg" className="text-brand" />
      </div>
    </div>
  </CardContent>
</Card>
```

#### `components/modules/payroll/mark-paid-dialog.tsx`

**Dialog con DatePicker de ShadCN:**
```tsx
// REEMPLAZAR cualquier input date nativo
<Dialog>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-brand" />
        Marcar como pagado
      </DialogTitle>
    </DialogHeader>

    {/* Resumen */}
    <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Empleado</span>
        <span className="font-medium">{payment.employee.fullName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Período</span>
        <span>{periodLabel}</span>
      </div>
      <div className="flex justify-between font-bold text-base pt-1 border-t border-border/50 mt-1">
        <span>Total</span>
        <CurrencyDisplay amount={payment.total} className="text-brand" />
      </div>
    </div>

    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="text-blue-700 dark:text-blue-300 text-xs">
        Se creará un gasto de planilla automáticamente.
      </AlertDescription>
    </Alert>

    {/* DatePicker con Calendar ShadCN */}
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {paymentDate ? format(paymentDate, "d 'de' MMMM, yyyy", { locale: es }) : "Fecha de pago"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate}
          disabled={(date) => date > new Date()} initialFocus locale={es} />
      </PopoverContent>
    </Popover>

    {/* Método de pago */}
    <RadioGroup value={method} onValueChange={setMethod} className="grid grid-cols-3 gap-2">
      {[{ v: 'cash', l: 'Efectivo', i: Banknote },
        { v: 'transfer', l: 'Transferencia', i: CreditCard },
        { v: 'other', l: 'Otro', i: MoreHorizontal }].map(({ v, l, i: Icon }) => (
        <label key={v} className={cn(
          "flex flex-col items-center gap-1.5 rounded-lg border p-2.5 cursor-pointer text-xs",
          method === v ? "border-brand bg-brand-muted text-brand font-medium" : "border-border text-muted-foreground"
        )}>
          <RadioGroupItem value={v} className="sr-only" />
          <Icon className="h-4 w-4" />
          {l}
        </label>
      ))}
    </RadioGroup>
  </DialogContent>
</Dialog>
```

---

### 👗 CATÁLOGO — Refinamiento

#### `components/modules/catalog/catalog-card.tsx`

```tsx
<Card className={cn(
  "group overflow-hidden border-border/50 transition-all duration-200",
  "hover:shadow-lg hover:-translate-y-1 hover:border-border"
)}>
  {/* Imagen con aspect ratio 3:4 */}
  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
    {item.imageUrl ? (
      <Image src={item.imageUrl} alt={item.name} fill
        className="object-cover transition-transform duration-300 group-hover:scale-105" />
    ) : (
      <div className="flex h-full items-center justify-center">
        <Shirt className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )}
    {/* Overlay de acciones al hover */}
    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" asChild>
          <Link href={`/catalog/${item.id}`}><Eye className="h-4 w-4" /></Link>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <Link href={`/catalog/${item.id}/edit`}><Edit className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
    {/* Badge de margen */}
    <div className="absolute top-2 right-2">
      <ProfitMarginIndicator margin={margin} compact />
    </div>
  </div>

  <CardContent className="p-3">
    <p className="text-sm font-semibold truncate">{item.name}</p>
    <p className="text-xs text-muted-foreground mb-2">{GARMENT_LABELS[item.garmentType]}</p>
    <div className="flex items-center justify-between">
      <CurrencyDisplay amount={item.ourPriceUnit ?? item.salePrice} className="font-bold text-brand" />
      {item.marketPriceUnit && (
        <span className="text-xs text-muted-foreground line-through">
          ${Number(item.marketPriceUnit).toFixed(2)}
        </span>
      )}
    </div>
  </CardContent>
</Card>
```

---

## PÁGINAS — REFINAMIENTO

### Estructura base de cada página (obligatoria):

```tsx
// Todas las páginas deben seguir esta estructura
export default function ModulePage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Título del Módulo"
        description="Descripción breve del módulo"
        actions={
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva acción
          </Button>
        }
      />
      {/* Contenido del módulo */}
    </div>
  )
}
```

### `/inventory` — Refinamiento de la página:

```tsx
// 4 StatCards arriba (Materiales activos, Stock bajo, Stock crítico, Agotados)
// IGUAL a la captura de pantalla proporcionada
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  <StatCard title="Materiales activos" value={stats.active}
    icon={<Layers />} description="Registros disponibles para operaciones" />
  <StatCard title="Stock bajo" value={stats.low}
    icon={<AlertTriangle />} variant={stats.low > 0 ? 'warning' : 'default'}
    description="Materiales por encima del mínimo pero en vigilancia" />
  <StatCard title="Stock crítico" value={stats.critical}
    icon={<AlertTriangle />} variant={stats.critical > 0 ? 'danger' : 'default'}
    description="Materiales en límite mínimo" />
  <StatCard title="Agotados" value={stats.out}
    icon={<PackageX />} variant={stats.out > 0 ? 'danger' : 'default'}
    description="Materiales sin existencia" />
</div>

// Tabla con espacio correcto
<Card className="border-border/50">
  <InventoryTable />
</Card>
```

---

## CHECKLIST DE REFINAMIENTO POR COMPONENTE

Para cada componente, verificar:

- [ ] **Sin colores hardcoded** — Solo tokens de diseño (`bg-background`, `text-foreground`, etc.)
- [ ] **Calendarios** — Usando `Calendar` + `Popover` de ShadCN, no `<input type="date">`
- [ ] **Selectores de búsqueda** — Usando `Command` + `Popover` de ShadCN
- [ ] **Dropdowns** — Usando `Select` de ShadCN, no `<select>` nativo
- [ ] **Toggles** — Usando `Switch` de ShadCN, no checkbox o div clickeable
- [ ] **Radio buttons** — Usando `RadioGroup` + `RadioGroupItem` de ShadCN
- [ ] **Checkboxes** — Usando `Checkbox` de ShadCN
- [ ] **Modales** — Usando `Dialog` o `Sheet` de ShadCN
- [ ] **Confirmaciones destructivas** — Usando `AlertDialog` vía `ConfirmDialog`
- [ ] **Tooltips** — Usando `Tooltip` de ShadCN para textos truncados
- [ ] **Loading states** — `Skeleton` en carga, `Loader2` en botones
- [ ] **Mobile** — Funciona y se ve bien en 375px
- [ ] **Dark mode** — Sin diferencias visuales inesperadas

---

## ORDEN DE EJECUCIÓN

1. `components/shared/` — Todos los componentes shared primero
2. `/inventory` + componentes de inventario
3. `/production` + componentes de producción
4. `/sales` + `/sales/new` (POS) + componentes de ventas
5. `/orders` (Kanban) + componentes de pedidos
6. `/expenses` + componentes de gastos
7. `/payroll` + componentes de planilla
8. `/catalog` + componentes de catálogo
9. Dashboard `/` — último (consume datos de todos los módulos)