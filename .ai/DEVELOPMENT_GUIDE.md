# Guía de Desarrollo

## Requisitos

- Node.js compatible con Next.js 16
- acceso a PostgreSQL/Supabase del proyecto
- variables de entorno configuradas

## Instalación

```bash
npm install
```

El proyecto ejecuta `prisma generate` en `postinstall`.

## Ejecutar localmente

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

## Comandos confirmados

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Variables de entorno detectadas en código

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- `NEXT_REVALIDATE_KEY`
- `NEXT_PUBLIC_REVALIDATE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `DATABASE_URL`
- `DIRECT_URL`

## Qué hace cada variable

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: key pública para auth/client
- `SUPABASE_SERVICE_ROLE_KEY`: uso server-only para admin client y ciertos cron/jobs
- `NEXT_PUBLIC_APP_URL`: URL base usada en enlaces y procesos internos
- `CRON_SECRET`: protección de endpoints cron
- `NEXT_REVALIDATE_KEY` y/o `NEXT_PUBLIC_REVALIDATE_KEY`: key para revalidación
- `RESEND_API_KEY`: envío de correos
- `RESEND_FROM_EMAIL`: remitente
- `DATABASE_URL`: conexión principal Prisma
- `DIRECT_URL`: conexión directa Prisma

## Archivos de configuración importantes

- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `components.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `vercel.json`

## Convenciones observadas

- App Router con layouts por grupos de rutas.
- Componentes en inglés, copy de UI en español.
- Validaciones por módulo en `lib/validations/`.
- Route handlers en `app/api/`.
- Permisos centralizados en `lib/permissions/`.

## Branches y commits

No se encontró en el repo una convención formal documentada de commits o branches.

## Checklist antes de entregar cambios

1. Revisar documentación `.ai/` relevante.
2. Confirmar impacto en permisos, auth y datos.
3. Ejecutar `npm run typecheck`.
4. Ejecutar `npm run build` si el cambio toca flujos relevantes.
5. Verificar que no se expongan claves o datos sensibles.
6. Si cambió comportamiento central, actualizar documentación en `.ai/`.

## Checklist especial para cambios sensibles

### Si cambia base de datos

- Revisar `prisma/schema.prisma`
- revisar `supabase/migrations/`
- revisar validaciones y tipos

### Si cambia permisos

- revisar `lib/permissions/*`
- revisar endpoints del módulo
- revisar UI y navegación filtrada

### Si cambia UI

- reutilizar componentes existentes
- mantener español en UI
- validar comportamiento responsive

## Pruebas

No se detectó configuración activa de Jest, Vitest o React Testing Library en `package.json`.

### Recomendación

Si se empiezan a agregar tests:

- unit tests para utilidades de negocio y currency
- tests de componentes para formularios complejos
- tests de integración para endpoints críticos

## Pendiente por confirmar

- versión exacta de Node recomendada por el equipo
- flujo oficial de despliegue y manejo de ambientes
- estrategia formal de testing automatizado
