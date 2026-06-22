# Contexto Evolutivo y Decisiones Confirmadas

## Propósito

Este archivo no reemplaza un changelog formal. Sirve para dejar constancia de decisiones y hallazgos confirmados en el código actual.

## Hallazgos confirmados del estado actual

### 1. La fuente de verdad ya no debe ser `rules.md`

- `rules.md` contiene contexto útil, pero también mezcla roadmap y afirmaciones que ya no coinciden exactamente con el repositorio.
- La nueva fuente de entrada para agentes debe ser `AGENTS.md` raíz más `.ai/`.

### 2. El proyecto ya opera con permisos granulares por módulo

- Confirmado en `lib/permissions/` y `supabase/migrations/010_permissions.sql`.
- Ya no es correcto documentarlo solo como RBAC simple por rol.

### 3. El proyecto combina Prisma con lógica SQL relevante en Supabase

- El esquema de aplicación está en Prisma.
- RLS, triggers y automatismos relevantes viven en `supabase/migrations/`.
- Cualquier cambio estructural debe considerar ambas capas.

### 4. Attendance es un módulo ya integrado al dominio

- Confirmado en `prisma/schema.prisma`, `app/api/attendance/`, `components/modules/attendance/` y migraciones `016` y `018`.

### 5. Multi-moneda es una preocupación transversal real

- Confirmado en `Currency`, `ExchangeRate`, `lib/currency/`, dashboard y ventas/pedidos.

### 6. El README actual estaba en estado de plantilla

- El `README.md` del repositorio no documentaba el negocio ni la arquitectura.
- Se agregó solo una referencia mínima al nuevo contexto para agentes.

## Decisiones documentales adoptadas

- `AGENTS.md` raíz se usa como entrypoint.
- `.ai/` se usa como fuente permanente de contexto para IA y devs.
- `rules.md` se conserva como referencia histórica, no como autoridad principal.
- La documentación evita inventar historial no confirmado.

## Riesgos detectados al documentar

- Algunos endpoints de reportes o asistencia pueden no reflejar todavía el scope fino sugerido por documentación previa.
- Existen patrones API consistentes, pero no todos los handlers viejos siguen exactamente la misma forma.
- La marca/branding del sistema requiere confirmación adicional entre `manufacturingOS`, `DANIELSS` y `DANIELLS`.

## Pendiente por documentar

- Decisiones históricas de producto anteriores a las migraciones disponibles.
- Cambios de arquitectura realizados fuera del historial presente en este checkout.
- Convenciones internas de deploy, QA y branching si existen fuera del repositorio.
