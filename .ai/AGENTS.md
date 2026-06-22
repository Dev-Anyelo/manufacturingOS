# Guía Principal para Agentes

## Objetivo

Este proyecto usa documentación interna en `.ai/` como contexto operativo para cualquier IA o desarrollador que vaya a:

- implementar features,
- corregir bugs,
- refactorizar,
- revisar seguridad,
- trabajar con base de datos,
- modificar permisos, roles o flujos de negocio,
- ajustar UI/UX o rutas API.

La prioridad siempre es:

1. Código real del proyecto
2. Documentación en `.ai/`
3. Documentación previa como `rules.md`

## Orden mínimo de lectura por tipo de tarea

### Para cualquier cambio

Lee primero:

1. `AGENTS.md` raíz
2. `.ai/PROJECT_CONTEXT.md`
3. `.ai/ARCHITECTURE.md`
4. `.ai/DEVELOPMENT_GUIDE.md`

### Si vas a tocar autenticación, permisos o acceso

Lee además:

- `.ai/PERMISSIONS.md`
- `.ai/API_GUIDE.md`
- `.ai/DATABASE.md`

Y revisa en código:

- `proxy.ts`
- `lib/auth/current-user.ts`
- `lib/api/response.ts`
- `lib/api/require-permission.ts`
- `lib/permissions/constants.ts`
- `lib/permissions/resolve.ts`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/006_rls_new_tables.sql`
- `supabase/migrations/010_permissions.sql`
- `supabase/migrations/016_attendance_module.sql`

### Si vas a tocar base de datos o lógica persistente

Lee además:

- `.ai/DATABASE.md`
- `.ai/BUSINESS_RULES.md`

Y revisa en código:

- `prisma/schema.prisma`
- `supabase/migrations/`
- `prisma/migrations/`

### Si vas a tocar UI o experiencia de usuario

Lee además:

- `.ai/UI_GUIDE.md`
- `.ai/MODULES.md`

Y revisa en código:

- `app/(dashboard)/layout.tsx`
- `components/ui/`
- `components/shared/`
- `components/modules/`
- `app/globals.css`
- `components.json`

### Si vas a tocar APIs o integraciones

Lee además:

- `.ai/API_GUIDE.md`
- `.ai/BUSINESS_RULES.md`

Y revisa en código:

- `app/api/`
- `lib/validations/`
- `lib/api/`
- `lib/services/`
- `lib/storage/`
- `lib/email/`

## Cómo analizar una tarea

1. Identifica el módulo afectado.
2. Localiza si el cambio toca datos, permisos, UI, auth o procesos automáticos.
3. Revisa primero los archivos fuente de verdad del área.
4. Confirma restricciones funcionales antes de proponer cambios.
5. Comprueba si hay validaciones Zod, permisos por módulo y efectos secundarios en BD.
6. Define el cambio mínimo necesario para cumplir el objetivo.

## Cómo proponer cambios

Una propuesta de implementación debe incluir:

- objetivo del cambio,
- archivos a revisar o modificar,
- impacto en reglas de negocio,
- impacto en permisos o seguridad,
- impacto en base de datos o migraciones,
- validación esperada.

## Cómo evitar romper reglas existentes

- No deduzcas permisos desde la UI; confírmalos en `lib/permissions/` y en `app/api/`.
- No asumas que middleware o layout son la única protección; revisa también RLS y guards API.
- No introduzcas nuevos campos o enum values sin revisar Prisma, migraciones SQL, validaciones y tipos.
- No cambies respuestas API sin revisar consumidores en `components/modules/`, `hooks/` y `lib/data/`.
- No muevas lógica crítica desde servidor a cliente sin justificación.

## Antes de tocar áreas sensibles

### Base de datos

- Revisa `prisma/schema.prisma`.
- Busca triggers o políticas relacionadas en `supabase/migrations/`.
- Verifica si hay cálculos dependientes en `lib/data/`, `app/api/` o SQL.

### Permisos y roles

- Revisa `lib/permissions/constants.ts`, `lib/permissions/types.ts` y `lib/permissions/resolve.ts`.
- Revisa endpoints del módulo para confirmar enforcement real.
- Considera overrides en `user_module_permissions`.

### APIs

- Revisa si usan `requireAuth`, `requirePermission`, validación con Zod y `handleApiError`.
- Conserva el formato de respuesta `{ success, data | error }` cuando aplique.

### UI

- Reutiliza primero componentes de `components/ui/` y `components/shared/`.
- Mantén textos visibles al usuario en español.
- Mantén código, nombres de props y utilidades en inglés.

## Formato esperado al entregar una implementación

- Resumen breve del cambio.
- Archivos modificados.
- Riesgos o decisiones relevantes.
- Validaciones ejecutadas o pendientes.
- Secciones de documentación actualizadas si cambió comportamiento.

## Criterios de calidad para agentes

- Basarse en el código real.
- Documentar incertidumbres en vez de inventar.
- Mantener el alcance estrecho.
- Priorizar seguridad, permisos y consistencia de datos.
- Actualizar `.ai/` cuando cambie la arquitectura o una regla central.
