---
description: Auditoría UI/UX/Accesibilidad con Playwright + heurísticas Nielsen + WCAG
---

# Audit UI — Frontend Angular

Audita la calidad visual, UX y accesibilidad usando MCP `playwright`.

## Prerrequisito

App corriendo en `http://localhost:4200` (o URL de staging).

## Paso 1 — Inventario de rutas

Lista todas las rutas de la app:
- Lee `src/app/app.routes.ts` o `*-routing.module.ts`
- Identifica rutas públicas vs autenticadas
- Identifica rutas con/sin guards

## Paso 2 — Auditoría por ruta

Para CADA ruta, vía MCP `playwright`:

### 2.1 Carga
- Tiempo hasta `domContentLoaded`
- Tiempo hasta LCP (debería < 2.5s)
- Errores 4xx/5xx en network
- Errores en console (none deseado)

### 2.3 Accesibilidad (WCAG 2.1 AA)
- Verifica que todo elemento interactivo sea alcanzable por Tab
- Verifica `aria-label` en botones sin texto visible
- Verifica `alt` en imágenes no decorativas
- Verifica contraste de colores: texto normal >= 4.5:1, texto grande >= 3:1
- Verifica que `<form>` tenga `<label>` asociados
- Verifica que mensajes de error sean `role="alert"` o `aria-live`

### 2.4 Responsive
Toma screenshots en breakpoints:
- 360x640 (móvil)
- 768x1024 (tablet)
- 1024x768 (laptop)
- 1920x1080 (desktop)
Detecta: overflow horizontal, contenido cortado, elementos solapados.

### 2.5 Interacciones críticas
Si la ruta tiene formularios o flujos:
- Prueba happy path
- Prueba errores (campos vacíos, datos inválidos)
- Verifica feedback al usuario (loading, success, error)
- Verifica desactivación de botón submit durante envío

## Paso 3 — Heurísticas de Nielsen

Para la app completa verifica:

1. **Visibilidad del estado** — ¿se ve qué está pasando? (loaders, breadcrumbs)
2. **Match mundo real** — lenguaje natural, no jerga técnica
3. **Control del usuario** — botones "atrás", "cancelar", "deshacer"
4. **Consistencia** — mismos patrones para mismas acciones
5. **Prevención de errores** — confirmar acciones destructivas
6. **Reconocer > recordar** — opciones visibles, no memorización
7. **Flexibilidad** — atajos para usuarios expertos
8. **Diseño minimalista** — solo info relevante
9. **Ayuda con errores** — mensajes en lenguaje claro con solución
10. **Ayuda y documentación** — accesible, contextual

## Paso 4 — Design tokens consistency

Lee `src/styles.*` (o `:root` global):
- ¿Existen variables CSS para colores/spacing/typography?
- ¿Los componentes las USAN o tienen magic numbers?

Busca con grep en `*.scss`, `*.css`:
- Colores hex hardcodeados (`#[0-9a-f]{3,6}`)
- Spacing hardcodeado (`\d+px` fuera de variables)
- `!important` (anti-patrón salvo casos justificados)

## Paso 5 — Reporte

`audit-reports/{fecha}/ui.md` con:
- Tabla: ruta | LCP | errores console | issues a11y | issues responsive
- Top 10 issues UX priorizados
- Screenshots adjuntos por hallazgo
- Plan de mejora (quick wins primero)
