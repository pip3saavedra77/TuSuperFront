---
trigger: always_on
description: Reglas y checklist obligatorios para auditoría del frontend Angular
---

# Reglas de auditoría — Frontend Angular

Aplica SIEMPRE estas reglas al revisar código del frontend.

## TypeScript

- ❌ NUNCA `any` explícito. Usa `unknown` o tipos concretos
- ✅ `strict: true` y `strictTemplates: true` en `tsconfig.json`
- ✅ Tipos de retorno explícitos en métodos públicos

## Angular best practices

- ✅ `ChangeDetectionStrategy.OnPush` en componentes de presentación
- ✅ Componentes standalone preferidos (Angular 15+)
- ✅ Trackby en `*ngFor` con listas dinámicas
- ✅ `async` pipe en templates en lugar de `subscribe()` manual
- ✅ Si usas `subscribe()`, debe haber unsubscribe (`takeUntil`, `takeUntilDestroyed`)
- ❌ NO mutar @Input() directamente
- ❌ NO lógica compleja en templates — usa pipes o getters memoizados
- ✅ Lazy loading en routes (`loadChildren` o `loadComponent`)
- ✅ Preload strategy adecuada para módulos críticos

## RxJS

- ✅ Operadores específicos (`map`, `filter`) en lugar de subscribe + lógica
- ✅ `shareReplay({ bufferSize: 1, refCount: true })` para HTTP cacheable
- ✅ `catchError` en todos los observables HTTP
- ❌ NO `subscribe()` anidados — usa `switchMap`/`mergeMap`/`concatMap`
- ✅ `switchMap` para autocomplete, `concatMap` para orden secuencial

## Seguridad

- ❌ NUNCA tokens/API keys en `environment.ts` commiteado
- ❌ NUNCA `innerHTML` con datos del usuario sin `DomSanitizer`
- ✅ Sanitización explícita con `DomSanitizer.bypassSecurityTrust*` solo justificado
- ✅ Storage de tokens: prefiere cookies httpOnly server-side. Si usas localStorage, documenta el riesgo XSS
- ✅ Interceptor HTTP que agrega Authorization y maneja 401 (refresh/logout)
- ✅ Guards en rutas privadas (`canActivate`)
- ✅ CSP headers configurados en el servidor (revisa `render.yaml` o nginx)

## Accesibilidad (WCAG 2.1 AA)

- ✅ Contraste texto normal >= 4.5:1, grande >= 3:1
- ✅ Todos los inputs con `<label>` asociado
- ✅ Botones con texto o `aria-label`
- ✅ Imágenes con `alt` (decorativas = `alt=""`)
- ✅ Navegación completa por teclado (Tab, Enter, Esc)
- ✅ Focus visible en todos los elementos interactivos
- ✅ Heading hierarchy correcta (h1 > h2 > h3, no saltos)
- ✅ `role="alert"` o `aria-live` para feedback dinámico
- ✅ `lang` definido en `<html>`

## Performance

- ✅ Imágenes con `loading="lazy"` salvo above-the-fold
- ✅ Imágenes responsive con `srcset` o `<picture>`
- ✅ Bundle inicial < 500kb gzipped
- ✅ Lazy load de rutas
- ✅ `OnPush` change detection
- ✅ Evitar re-renders innecesarios (verifica con DevTools)
- ✅ Web vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

## UX (heurísticas Nielsen aplicadas)

- ✅ Loading states visibles (skeleton o spinner)
- ✅ Mensajes de error claros con acción de recuperación
- ✅ Confirmación antes de acciones destructivas
- ✅ Validación de formularios en tiempo real con feedback
- ✅ Estados disabled visualmente distintos
- ✅ Empty states informativos (no solo "No data")
- ✅ Soporte browser back/forward (no romper navegación)

## Estilos / Design system

- ✅ Variables CSS para colores, spacing, typography
- ❌ NO magic numbers en spacing (`margin: 17px` 🚫, `var(--spacing-md)` ✅)
- ❌ NO `!important` salvo override de librería de terceros documentado
- ✅ Mobile-first
- ✅ Sistema de espaciado consistente (4/8/16/24/32...)

## Testing

- ✅ Componentes con lógica testeados (Vitest detectado en este proyecto)
- ✅ Services con cobertura > 70%
- ✅ E2E para flujos críticos (login, compra, checkout)

## Severidad para reportar

- **CRITICAL** — XSS, leak de tokens, auth bypass, datos sensibles en logs/storage inseguro
- **HIGH** — Accesibilidad rota (no se puede usar con teclado), memory leaks, bundle gigante
- **MEDIUM** — `any` types, falta de OnPush, magic numbers, missing alt
- **LOW** — estilo, naming, comentarios

## Formato de reporte

```
### [SEVERIDAD] Título corto
**Archivo**: `@/c:/TuSuperFront/src/.../file.ts:LINEA`
**Categoría**: security | a11y | performance | ux | code-quality
**Descripción**: 1-2 frases
**Impacto**: qué afecta al usuario/seguridad
**Fix**: cómo arreglarlo
```
