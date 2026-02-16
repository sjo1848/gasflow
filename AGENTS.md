# AGENTS.md — Reglas Operativas para Codex CLI

Este repo se trabaja como lo haría un equipo profesional: **plan → cambios mínimos → verificación → resumen**.

## 1) Objetivo
Construir el MVP de GasFlow (reparto de garrafas) según:
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- ADRs en `docs/adr/`

## 2) Principios (OBLIGATORIOS)
1. **No inventar requisitos**: si falta info, asumir lo mínimo, documentarlo y dejar TODO explícito.
2. **Cambios pequeños y trazables**: un PR / cambio por tarea.
3. **Siempre proponer plan primero** (si no se pidió código explícitamente).
4. **Preferir decisiones simples**: monolito con arquitectura hexagonal.
5. **Nada de “magia”**: todo cambio debe quedar reflejado en archivos versionados (docs/config/tests).

## 3) Entregables por tarea (Definition of Done)
Una tarea está “Done” cuando:
- Implementación completa (si aplica)
- Tests / verificación (si aplica)
- Docs actualizadas
- Sin warnings obvios (fmt/lint cuando exista)
- Mensaje final incluye: archivos tocados + cómo verificar

## 4) Convenciones Técnicas (cuando empecemos código)
- Backend: Rust (Axum sugerido) + PostgreSQL
- Persistencia: SQLx (sugerido) con migraciones
- Arquitectura: Hexagonal (Domain / Application / Adapters)
- API: REST + OpenAPI
- Docker: backend + db en dev
- Logging: estructurado (JSON), niveles claros

## 5) Seguridad y datos
- No commitear secretos (tokens, claves, `.env` reales).
- No loguear datos sensibles.
- Si hay configuración, usar `.env.example` y variables de entorno.

## 6) Estilo de respuesta
- Directo y concreto.
- Listas con prioridades.
- Evitar repetir; si algo ya está dicho, referenciar el archivo.
