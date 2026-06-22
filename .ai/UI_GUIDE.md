# Guía de UI

## Dirección visual actual

La aplicación usa un dashboard administrativo con sidebar, header superior, cards métricas, tablas, sheets/dialogs y componentes compartidos para consistencia transversal.

Archivos base:

- `app/(dashboard)/layout.tsx`
- `components/app-sidebar.tsx`
- `components/site-header.tsx`
- `app/globals.css`
- `components.json`

## Librerías y base UI confirmadas

- ShadCN UI
- Radix UI
- Tailwind CSS 4
- Lucide React
- Recharts
- Sonner
- Vaul

La configuración de ShadCN indica:

- estilo `radix-nova`
- `rsc: true`
- variables CSS activadas

## Convenciones de componentes

### Reutilización primero

Antes de crear un componente nuevo, revisar:

- `components/ui/`
- `components/shared/`
- `components/modules/<modulo>/`

### Niveles de componentes

- `ui/`: primitives y wrappers visuales
- `shared/`: patrones reutilizables del producto
- `modules/`: composición específica por dominio

## Componentes compartidos importantes

- `page-header`
- `data-table`
- `empty-state`
- `loading-skeleton`
- `currency-display`
- `status-badge`
- `date-range-picker`
- `confirm-dialog`

## Formularios

La base del proyecto sugiere este patrón:

- React Hook Form
- Zod
- componentes `components/ui/form.tsx`
- inputs y selects de `components/ui/`
- mensajes al usuario en español

## Manejo de estados

- Estado server y datos remotos: React Query
- Estado cliente transversal: Zustand
- Estado de formulario: React Hook Form

## Reglas visuales a conservar

- Mantener layout protegido con sidebar.
- Mantener nomenclatura de secciones por módulo.
- Reutilizar `Card`, `Table`, `Badge`, `Dialog`, `Sheet`, `Tabs`, `Tooltip`.
- Mantener jerarquía de encabezados y espacios del dashboard existente.
- Mantener textos visibles en español.

## Responsive y UX

- Debe seguir funcionando en desktop y mobile.
- El proyecto ya incluye `hooks/use-mobile.ts`.
- Las tablas y paneles deben degradar correctamente en pantallas pequeñas.
- Evitar introducir patrones visuales fuera del lenguaje ya existente si no es un rediseño explícito.

## Realtime y feedback

- Notificaciones efímeras se muestran con Sonner.
- La campana y panel de notificaciones dependen de sincronización por Realtime y store local.
- Cambios de inventario críticos disparan toasts y notificaciones locales.

## Riesgos comunes al tocar UI

- Romper consistencia entre pantallas de módulo y shared components.
- Introducir textos en inglés en UI visible.
- Duplicar componentes que ya existen en `shared` o `ui`.
- Acoplar componentes cliente innecesariamente cuando una página puede seguir siendo server-first.

## Recomendaciones prácticas

- Si el cambio es de flujo, revisar también el endpoint del módulo.
- Si el cambio muestra datos sensibles, revisar permisos y filtro backend.
- Si el componente depende de tipos complejos, validar compatibilidad con `types/index.ts` o resultados Prisma.

## Pendiente por confirmar

- Sistema oficial de diseño o tokens fuera de lo que ya está embebido en CSS y ShadCN.
- Convenciones internas sobre copywriting o accesibilidad más allá de lo observable en el código.
