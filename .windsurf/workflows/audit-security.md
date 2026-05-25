---
description: Auditoría de seguridad del frontend Angular (XSS, secretos, deps, CSP)
---

# Audit Security — Frontend Angular

Análisis focalizado en seguridad cliente-side.

## Paso 1 — Semgrep multi-ruleset (CLI)

Ejecuta vía `run_command`:

```
semgrep scan ^
  --config=p/owasp-top-ten ^
  --config=p/typescript ^
  --config=p/javascript ^
  --config=p/secrets ^
  --config=p/xss ^
  --config=p/insecure-transport ^
  --json --quiet --metrics=off ^
  src/ > audit-reports/{fecha}/semgrep-raw.json
```
// turbo

Parsea el JSON y reporta cada hallazgo con: archivo:línea, severidad, `check_id`, snippet, fix.

> Si `semgrep` no está en PATH: `set PATH=C:\Users\Escritorio\AppData\Roaming\uv\tools\semgrep-mcp\Scripts;%PATH% &&`

## Paso 2 — Búsqueda de secretos

`grep_search` en `src/` y `environment*.ts`:
- API keys: `sk_`, `pk_`, `AIza`, `firebase`, `stripe`
- JWT en código fuente
- URLs con credenciales embebidas
- Comentarios con tokens/passwords
- Patrones genéricos: `password\s*[:=]\s*['"]`, `secret\s*[:=]`

⚠️ Recordar: cualquier "secret" en el frontend es PÚBLICO. Revisar si debería estar en backend.

## Paso 3 — XSS y sanitización

Buscar:
- `[innerHTML]` con bindings dinámicos sin `DomSanitizer`
- `bypassSecurityTrust*` (justificar cada uso)
- `eval()`, `Function()`, `setTimeout(string, ...)` — anti-patrones
- Templates con `{{ }}` interpolando datos no validados (Angular ya escapa, pero verificar atributos)
- Uso de `document.write`, `outerHTML` con datos dinámicos

## Paso 4 — Almacenamiento de tokens

Revisar:
- ¿Tokens en `localStorage`? → riesgo XSS (no se puede prevenir si hay XSS)
- ¿Tokens en `sessionStorage`? → mismo riesgo
- ✅ Recomendado: cookies `httpOnly` `secure` `sameSite=strict` gestionadas por backend
- Si usan localStorage, ¿hay logout que limpia? ¿hay rotación?

## Paso 5 — HTTP y CORS

- ¿Existe `HttpInterceptor` que añade Authorization header?
- ¿Maneja 401 con refresh + retry o redirect a login?
- ¿Maneja errores con `catchError`?
- ¿URLs hardcodeadas o vienen de `environment`?
- ¿Hay endpoints `http://` (no HTTPS)?

## Paso 6 — Routes y guards

- Lista todos los `Routes` con sus `canActivate`/`canMatch`
- ¿Rutas con datos sensibles tienen guard?
- ¿El guard verifica token válido (no solo presencia)?
- ¿Hay rutas de admin con verificación de rol?

## Paso 7 — CSP y headers de seguridad

Revisa archivo de despliegue (`render.yaml`, `nginx.conf`, etc.):
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy

Si no existen, redacta los headers recomendados.

## Paso 8 — Dependencias

```
npm audit --json > audit-reports/{fecha}/npm-audit.json
```
// turbo

Foco en CRITICAL/HIGH del lado runtime (no devDeps).

## Paso 9 — Reporte

`audit-reports/{fecha}/security.md`:
- Resumen por severidad
- Top 10 críticos con archivo:línea
- Quick fixes (cambios de 1-3 líneas)
- Recomendaciones de arquitectura (mover secrets a backend, migrar a cookies httpOnly, etc.)
