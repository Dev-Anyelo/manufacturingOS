# Prompts Reutilizables

## Prompt para implementar un feature

```text
Actúa como ingeniero senior dentro de manufacturingOS.

Objetivo:
[describe el feature]

Antes de proponer cambios:
1. Lee AGENTS.md y los archivos relevantes dentro de .ai/.
2. Revisa el módulo afectado en código real.
3. Identifica impacto en permisos, APIs, base de datos, UI y reglas de negocio.
4. No inventes comportamiento que no esté confirmado.

Entrega:
- diagnóstico breve del estado actual,
- archivos a modificar,
- riesgos,
- propuesta de implementación,
- validaciones necesarias.
```

## Prompt para corregir un bug

```text
Actúa como arquitecto de software senior y depura este bug en manufacturingOS.

Bug:
[describe el problema]

Instrucciones:
- confirma primero el flujo real en código,
- identifica el punto exacto de falla,
- revisa auth, permisos, validaciones, Prisma y migraciones si aplica,
- no propongas soluciones genéricas,
- explica impacto y cambio mínimo recomendado.

Entrega:
- causa raíz,
- archivos implicados,
- fix propuesto,
- riesgos,
- forma de verificarlo.
```

## Prompt para revisar seguridad

```text
Revisa seguridad en manufacturingOS para este alcance:
[ruta, módulo o endpoint]

Analiza:
- autenticación,
- autorización,
- exposición de datos,
- validación de input,
- uso de service role,
- RLS/migraciones relacionadas,
- inconsistencias entre UI y backend.

Entrega:
- hallazgos ordenados por severidad,
- archivos exactos,
- riesgo real,
- corrección recomendada.
```

## Prompt para refactorizar

```text
Refactoriza este alcance en manufacturingOS sin cambiar comportamiento funcional:
[archivo o módulo]

Antes de tocar código:
- revisa AGENTS.md y .ai/ARCHITECTURE.md,
- identifica dependencias,
- confirma contratos API o tipos consumidos,
- evita romper permisos, filtros y lógica monetaria.

Entrega:
- problemas detectados,
- propuesta de refactor,
- archivos afectados,
- riesgos,
- validación posterior.
```

## Prompt para analizar permisos

```text
Analiza permisos y visibilidad en manufacturingOS para este flujo:
[flujo]

Revisa:
- proxy.ts,
- lib/api/response.ts,
- lib/api/require-permission.ts,
- lib/permissions/*,
- endpoints del módulo,
- RLS/migraciones de Supabase relacionadas.

Entrega:
- quién puede ver,
- quién puede crear/editar/eliminar/exportar,
- dónde se aplica realmente el control,
- huecos o inconsistencias detectadas.
```

## Prompt para revisar base de datos

```text
Analiza el impacto en base de datos para este cambio en manufacturingOS:
[cambio]

Revisa:
- prisma/schema.prisma,
- supabase/migrations/,
- enums relacionados,
- triggers/RLS,
- endpoints y validaciones consumidoras.

Entrega:
- tablas y campos afectados,
- riesgos,
- migraciones necesarias,
- validaciones y documentación a actualizar.
```

## Prompt para documentar nuevos cambios

```text
Actualiza la documentación interna de manufacturingOS para este cambio:
[cambio]

Instrucciones:
- documenta solo lo confirmado por código,
- actualiza los archivos relevantes dentro de .ai/,
- si algo no es verificable, colócalo bajo "Pendiente por confirmar",
- agrega impacto en arquitectura, negocio, permisos o base de datos si aplica.

Entrega:
- archivos documentales actualizados,
- resumen del cambio,
- secciones nuevas o modificadas,
- pendientes detectados.
```
