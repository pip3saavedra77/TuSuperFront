---
description: Auditoría de calidad de código Angular (componentes, RxJS, performance, tests)
---

# Audit Code Quality — Frontend Angular

Análisis de mantenibilidad, performance y patrones Angular.

## Paso 1 — Estructura

- ¿Estructura por feature o por tipo? (preferir por feature: `features/users/`, `features/auth/`)
- ¿Componentes standalone o NgModule? (Angular 15+ recomienda standalone)
- ¿Servicios en `core/`, modelos en `shared/models/`, etc.?
- ¿Componentes > 300 líneas? (sugerir split)
- ¿Templates > 100 líneas? (sugerir subcomponentes)

## Paso 2 — TypeScript hygiene

`grep_search` en `src/`:
- `\bany\b` (excluir comentarios)
- `@ts-ignore`, `@ts-expect-error` sin justificación
- `as any` casts

Verifica `tsconfig.json`:
- `strict: true`
- `strictTemplates: true` (en `angularCompilerOptions`)
- `strictNullChecks: true`

## Paso 3 — Componentes Angular

Para cada `*.component.ts`:
- ¿`changeDetection: ChangeDetectionStrategy.OnPush`?
- ¿Usa `signals` (Angular 16+) o `Input/Output` clásico?
- ¿`@Input()` con tipos correctos y defaults?
- ¿`@Output()` emite tipos específicos, no `any`?
- ¿Lógica compleja en template? → mover a getter/método/pipe
- ¿`ngOnInit`, `ngOnDestroy` correctamente implementados?
- ¿Hay `subscribe()` sin `unsubscribe`?

## Paso 4 — RxJS patterns

Buscar:
- `subscribe()` directos → preferir `async` pipe
- `subscribe()` anidados → reescribir con `switchMap`/`mergeMap`
- Subscripciones sin `takeUntil` o `takeUntilDestroyed`
- HTTP calls sin `catchError`
- `BehaviorSubject` expuestos públicamente (mejor exponer como `Observable`)

## Paso 5 — Routing y lazy loading

- Lista todas las rutas
- ¿Hay `loadChildren` / `loadComponent` para lazy?
- Rutas eagerly loaded que deberían ser lazy
- ¿Preload strategy configurada?
- ¿Resolvers para datos críticos pre-navegación?

## Paso 6 — Performance

```
npm run build
```
// turbo

Analiza `dist/`:
- Tamaño bundle inicial (debería < 500kb gzipped)
- Vendor chunk gigante (revisar imports completos vs específicos)
- Imágenes en `assets/` no optimizadas

Si hay `webpack-bundle-analyzer` o equivalente, generar reporte.

Revisar:
- `*ngFor` sin `trackBy`
- Cálculos en template ejecutados en cada CD
- Listas grandes sin virtualización (`cdk-virtual-scroll`)

## Paso 7 — Testing

Verifica `vitest.config.ts` (este proyecto usa Vitest):
```
npm run test -- --coverage
```
// turbo

- Total coverage > 60%?
- Componentes críticos > 80%?
- Services con tests
- E2E para flujos clave

Lista archivos sin spec correspondiente.

## Paso 8 — Estilos y design system

`grep_search` en `src/**/*.scss`, `src/**/*.css`:
- Magic numbers de spacing fuera de variables
- Colores hex hardcodeados
- `!important` (cuántos y dónde)
- Selectores muy específicos (>3 niveles)

## Paso 9 — Reporte

`audit-reports/{fecha}/code-quality.md`:
- Métricas: % coverage, # `any`, bundle size, # componentes sin OnPush
- Tabla por feature: complejidad, deuda técnica
- Top 10 refactors prioritarios
