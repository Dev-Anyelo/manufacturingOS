# manufacturingOS (DANIELSS CONFECCIONES)

Guía de entrada rápida para agentes de IA y desarrolladores.

## Antes de modificar cualquier cosa

Lee estos archivos en este orden:

1. `.ai/AGENTS.md`
2. `.ai/PROJECT_CONTEXT.md`
3. `.ai/ARCHITECTURE.md`
4. `.ai/BUSINESS_RULES.md`
5. `.ai/MODULES.md`
6. `.ai/DATABASE.md`
7. `.ai/API_GUIDE.md`
8. `.ai/PERMISSIONS.md`
9. `.ai/UI_GUIDE.md`
10. `.ai/DEVELOPMENT_GUIDE.md`

## Reglas generales

- No asumas comportamiento del sistema sin confirmarlo en código.
- No modifiques base de datos, permisos, auth, rutas API o UI crítica sin revisar primero la documentación en `.ai/`.
- Usa `prisma/schema.prisma`, `supabase/migrations/`, `app/api/`, `lib/permissions/` y `proxy.ts` como fuentes de verdad técnicas.
- Si encuentras contradicciones entre `rules.md` y el código actual, prioriza el código y documenta la diferencia.
- Si algo no está claro, añade la incertidumbre en la documentación antes de expandir alcance.

## Documentos de referencia

- `.ai/AGENTS.md`: protocolo de trabajo para agentes
- `.ai/PROJECT_CONTEXT.md`: contexto del negocio y del producto
- `.ai/ARCHITECTURE.md`: stack, estructura y flujo técnico
- `.ai/BUSINESS_RULES.md`: reglas funcionales y restricciones
- `.ai/MODULES.md`: módulos, responsabilidades y dependencias
- `.ai/DATABASE.md`: esquema, relaciones, migraciones y riesgos
- `.ai/API_GUIDE.md`: convenciones y endpoints API
- `.ai/UI_GUIDE.md`: patrones visuales y de interacción
- `.ai/PERMISSIONS.md`: roles, permisos y puntos de control
- `.ai/DEVELOPMENT_GUIDE.md`: instalación, comandos y checklist
- `.ai/CHANGELOG_CONTEXT.md`: decisiones y hallazgos confirmados
- `.ai/PROMPTS.md`: prompts reutilizables para trabajo asistido por IA

## Nota sobre documentación previa

`rules.md` se conserva como referencia histórica. No debe asumirse como fuente principal si contradice el estado actual del proyecto.
