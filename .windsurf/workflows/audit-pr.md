---
description: Code review automatizado de un PR del frontend vía GitHub MCP
---

# Audit PR — Frontend Angular

Code review minucioso de un Pull Request del frontend.

## Argumentos

Pídele al usuario el número del PR. Si pide "el último", lista PRs recientes en `pip3saavedra77/TuSuperFront` y elige.

## Paso 1 — Contexto del PR

Vía MCP `github`:
- Título, descripción, autor, branches
- Archivos cambiados con # líneas
- Commits incluidos
- CI status (tests, lint, build)
- Reviews previos

## Paso 2 — Análisis de cambios

Para cada archivo modificado, aplica reglas de `.windsurf/rules/auditing.md` y detecta:

### Componentes
- ¿OnPush change detection mantenido?
- ¿Inputs/Outputs tipados?
- ¿Suscripciones con cleanup?
- ¿Lógica en componente vs servicio?

### Servicios
- ¿HTTP errors manejados?
- ¿Cache estrategia correcta?
- ¿Tests añadidos?

### Templates
- ¿`*ngFor` con `trackBy`?
- ¿Bindings sin XSS?
- ¿Accesibilidad mantenida (aria, alt, labels)?

### Estilos
- ¿Variables CSS o magic numbers?
- ¿Responsive verificado?

## Paso 3 — Riesgos transversales

- ¿Cambio en routes? → verificar guards
- ¿Cambio en interceptor HTTP? → impacto global
- ¿Cambio en environment? → no debe haber secrets
- ¿Nueva librería UI? → tamaño bundle, accesibilidad
- ¿Cambio en autenticación? → revisar storage, refresh, logout

## Paso 4 — Tests y build

- ¿Tests añadidos para nueva lógica?
- ¿Tests E2E para nuevo flujo crítico?
- ¿Build sigue funcionando? (CI debería confirmar)
- ¿Bundle size no creció más de 5%?

## Paso 5 — UX/UI verification

Si el PR incluye cambios visuales:
- Pide al usuario URL de preview deploy si existe
- Vía MCP `playwright`, navega y verifica:
  - Render correcto
  - No hay errores consola
  - Responsive
  - Accesibilidad (Tab, contraste)

## Paso 6 — Comentarios al PR

Vía MCP `github`, deja comentarios:
- Severidad
- Archivo:línea
- Sugerencia concreta

Agrupa nits (estilo) en un solo comentario general.

## Paso 7 — Veredicto

`audit-reports/{fecha}/pr-{numero}.md`:
- ✅ APROBAR / ⚠️ CON CAMBIOS / ❌ BLOQUEAR
- Hallazgos por severidad
- Recomendación final
