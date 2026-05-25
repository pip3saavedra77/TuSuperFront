# Pull Requests — Frontend Angular (`TuSuperFront`)

> Fecha: 2026-05-24  
> Rama base: `main`  
> Repositorio: `pip3saavedra77/TuSuperFront`

---

## Tabla Resumen

| # | Rama | Título | Severidad | Estado |
|---|------|--------|-----------|--------|
| [#54](https://github.com/pip3saavedra77/TuSuperFront/pull/54) | `feature/sec-oauth-fragment-front` | sec(auth): read JWT from window.location.hash in social-callback (HIGH-4) | **HIGH** | 🔵 Abierto |
| [#55](https://github.com/pip3saavedra77/TuSuperFront/pull/55) | `feature/ux-auth-improvements` | ux(auth): loading states, remember-me, password strength meter | **MEDIUM** | 🔵 Abierto |

---

## PR #54 — Seguridad OAuth (HIGH-4)

### Descripción
Adapta el componente `social-callback` para leer de manera segura el token JWT desde el **URL fragment** (`window.location.hash`) en lugar de depender únicamente de los query params.

### Contexto de seguridad
El backend ahora redirige el inicio de sesión exitoso de Google OAuth hacia:
```
/auth/social-callback#token=<JWT>
```
Esto evita que el token se exponga en:
- Logs de proxies, balanceadores y CDNs
- Historial del navegador
- Cabeceras `Referer` al cargar recursos externos

### Cambios
- `src/app/auth/social-callback/social-callback.ts`
  - Parseo del token desde `window.location.hash` usando `URLSearchParams`
  - Fallback a query params por compatibilidad

### Verificación
```bash
npx tsc --noEmit -p tsconfig.json  # OK
```

---

## PR #55 — Mejoras UX en Autenticación

### Descripción
Conjunto de mejoras focalizadas en los flujos de login, registro y restablecimiento de contraseña.

### Commits incluidos

#### Commit 1 — `ux(auth): loading states, remember-me, password strength meter`

**Nuevo componente compartido**
- `src/app/shared/components/password-strength/password-strength.ts`
  - Barra segmentada con color dinámico (rojo → verde)
  - Checklist en tiempo real: mayúscula, minúscula, número, símbolo, longitud
  - Score 0–4 con etiquetas descriptivas

**LogIn**
- `loading()` signal + spinner en botón "Ingresar"; botón se deshabilita mientras se procesa
- `rememberMe()` signal que persiste email en `localStorage` y lo pre-carga en la siguiente visita vía `ngOnInit`
- Mínimo de contraseña subido de **6 a 8 caracteres**

**SignIn**
- `PasswordStrengthComponent` integrado debajo del campo de contraseña
- Mínimo de contraseña subido de **6 a 8 caracteres**

**ResetPassword**
- `PasswordStrengthComponent` integrado debajo del campo de nueva contraseña

#### Commit 2 — `ux(auth): shake animation, failed-attempts counter, clear password on error`

**LogIn — Error UX**
- **Shake animation** en el formulario cuando la autenticación falla (feedback táctil visual)
- **Contador de intentos fallidos** (`failedAttempts` signal)
- Después de **3 intentos fallidos**: se muestra un banner prominente sugiriendo recuperar la contraseña
- **Auto-limpieza** del campo de contraseña en error para reintentar rápido
- **SnackBar** con mensaje más descriptivo y acción sugerida tras 3 fallos

### Verificación
```bash
npx tsc --noEmit -p tsconfig.json  # OK, sin errores
```

---

## Hallazgos de Auditoría (Workflows)

### `audit-ui.md` — Heurísticas de Nielsen aplicables

| # | Heurística | Estado | Notas |
|---|-----------|--------|-------|
| 1 | Visibilidad del estado | ✅ Mejorado | Loading spinner, shake animation, password strength |
| 2 | Match mundo real | ✅ OK | Lenguaje natural en español |
| 3 | Control del usuario | ✅ OK | Botón "Volver", enlace "Olvidaste tu contraseña" |
| 4 | Consistencia | ✅ OK | Mismo patrón de inputs/botones en login/signin/reset |
| 5 | Prevención de errores | ✅ Mejorado | Password strength en tiempo real, minlength 8 |
| 6 | Reconocer > recordar | ✅ Mejorado | Remember-me funcional, email pre-llenado |
| 7 | Flexibilidad | ⚪ Parcial | Sin atajos de teclado documentados |
| 8 | Diseño minimalista | ✅ OK | Solo info relevante en cada paso |
| 9 | Ayuda con errores | ✅ Mejorado | Shake + mensaje claro + sugerencia tras 3 intentos |
| 10 | Ayuda y documentación | ⚪ Parcial | Sin FAQ inline visible |

### `audit-code-quality.md` — Patrones Angular

| Criterio | Estado |
|----------|--------|
| `strict: true` | ✅ Revisar `tsconfig.json` |
| `strictTemplates: true` | ✅ Revisar `tsconfig.json` |
| Componentes standalone | ✅ Todos los auth son standalone |
| Signals (Angular 16+) | ✅ `loading()`, `rememberMe()`, `failedAttempts()`, `shakeForm()` |
| `subscribe()` sin `unsubscribe` | ⚠️ Revisar: login usa `subscribe()` directo |
| `async` pipe preferido | ⚠️ Login usa `subscribe()` manual (justificado por side-effects) |

### `audit-security.md` — Seguridad

| Criterio | Estado |
|----------|--------|
| Token en `localStorage` | ⚠️ Riesgo XSS (no hay XSS conocido, pero documentado) |
| Logout limpia token | ✅ `AuthService.logout()` remueve `localStorage` |
| Anti-enumeración forgot-password | ✅ Mensaje genérico en frontend |
| CSP headers | ⚠️ Revisar en servidor (`render.yaml` o `nginx.conf`) |
| `innerHTML` sin sanitizar | ✅ No encontrado |

---

## Próximos pasos sugeridos

1. **Mergear PR #54** (HIGH) lo antes posible — sin esto, el login con Google está roto
2. **Mergear PR #55** (MEDIUM) — mejora UX general
3. **Auditoría UI completa** con Playwright (ver `audit-ui.md` paso 2–4)
4. **Revisar bundle size** (`npm run build` + analizar `dist/`)
5. **Agregar tests unitarios** para `PasswordStrengthComponent` y `LogIn`
6. **Revisar `tsconfig.json`** para confirmar `strictTemplates: true`

---

## Notas técnicas

- Convención de ramas frontend: desde `main`
- No se modifica `main` directamente (solo vía PRs)
- Los commits usan [Conventional Commits](https://www.conventionalcommits.org/)
- `npx tsc --noEmit -p tsconfig.json` pasa limpio en ambos PRs
