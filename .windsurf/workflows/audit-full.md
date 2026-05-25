---
description: Auditoría completa del frontend Angular (seguridad + UI + código + Sonar + PR)
---

# Audit Full — Frontend Angular

Auditoría minuciosa del frontend combinando todos los MCPs.

## Paso 0 — Preparación

1. Crea `audit-reports/$(Get-Date -Format yyyy-MM-dd)/` en la raíz.
2. Aplica todas las reglas en `.windsurf/rules/auditing.md`.

## Paso 1 — Seguridad estática (Semgrep CLI)

Ejecuta vía `run_command`:

```
semgrep scan ^
  --config=p/owasp-top-ten ^
  --config=p/typescript ^
  --config=p/javascript ^
  --config=p/secrets ^
  --config=p/xss ^
  --json --quiet --metrics=off ^
  src/ > audit-reports/{fecha}/semgrep.json
```
// turbo

Parsea `results[]` y genera `semgrep.md` clasificado por severidad.

> Si `semgrep` no está en PATH: `set PATH=C:\Users\Escritorio\AppData\Roaming\uv\tools\semgrep-mcp\Scripts;%PATH% &&`

## Paso 2 — UI/UX/Accesibilidad (Playwright)

Invoca MCP `playwright`:
1. Levanta la app (`npm start` o ya corriendo en localhost)
2. Navega las rutas principales: `/`, `/login`, `/register`, `/dashboard`, etc.
3. Para cada ruta:
   - Captura screenshot full-page
   - Recoge errores de consola
   - Recoge requests con status >= 400
   - Mide performance: LCP, CLS, FID
   - Verifica accesibilidad: roles ARIA, alt text, contraste, navegación por teclado
4. Prueba responsive: 360px, 768px, 1024px, 1920px
5. Output: `ui-report.md` con tabla de hallazgos por ruta

## Paso 3 — Calidad de código Angular

Revisar con `code_search` y `grep_search`:
- ¿Componentes usan `ChangeDetectionStrategy.OnPush`?
- ¿Subscripciones a Observables tienen `takeUntil` o `async pipe`?
- ¿Hay `subscribe()` sin unsubscribe?
- ¿Routes con `loadChildren` (lazy loading)?
- ¿`HttpClient` errors manejados con `catchError`?
- ¿Templates con `*ngIf` complejos que deberían ser variables/pipes?
- ¿`any` en TypeScript?
- ¿Tokens/credentials en `environment.ts`?
- ¿Uso de `innerHTML` sin `DomSanitizer`?

Output: `code-quality.md`

## Paso 4 — Bundle y performance

```
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

Detecta:
- Bundles > 500kb
- Librerías duplicadas
- Imports completos donde se podría usar tree-shaking
- Imágenes no optimizadas (>200kb sin lazy)

Output: `performance.md`

## Paso 5 — Diff con SonarCloud

Invoca MCP `sonarqube` con projectKey `Andreycho-B_tusuper-frontend`:
- Issues abiertos vs código actual
- Marcar obsoletos, persistentes y nuevos locales

Output: `sonar-diff.md`

## Paso 6 — Fidelidad de diseño (Figma)

Si hay referencia Figma:
- MCP `figma` lee el nodo
- Playwright captura componente equivalente
- Compara: spacing, colores, tipografía, layout

Si NO hay Figma:
- Aplica heurísticas Nielsen + WCAG (ver `auditing.md`)
- Verifica sistema de diseño consistente (tokens CSS, no magic numbers)

Output: `ui-fidelity.md`

## Paso 7 — Revisión PRs (GitHub MCP)

Últimos 5 PRs en `pip3saavedra77/TuSuperFront`:
- Cambios riesgosos
- Componentes sin tests
- Modificaciones de routing/guards

Output: `pr-review.md`

## Paso 8 — Resumen ejecutivo

`audit-reports/{fecha}/summary.md` con:
- Hallazgos por severidad
- Top 10 críticos
- Plan de remediación
- Métricas: LCP, bundle size, # warnings consola, # issues a11y
