# Guía de despliegue en Render — TuSuper (Frontend + Backend)

Esta guía deja el proyecto listo para **producción** en [Render](https://render.com) con:

- PostgreSQL vacía → migraciones → datos reales (categorías, proveedores, ~40 productos, roles, admin).
- API NestJS en Docker.
- Angular como **Static Site**.

Repositorios:

| Componente | Carpeta local |
|------------|---------------|
| Frontend   | `c:\TuSuperFront` |
| Backend    | `c:\tusuper-backend` |

---

## Resumen del orden de despliegue

1. Crear cuenta en Render y conectar GitHub (dos repos o monorepo).
2. Desplegar **PostgreSQL** + **API** (`tusuper-backend`).
3. Ejecutar **seed de producción** (una sola vez).
4. Desplegar **frontend** con `API_URL` apuntando al API.
5. Configurar **Google OAuth** y **Cloudinary** con URLs de producción.

---

## Parte 1 — Backend (API + base de datos)

### 1.1 Subir código

Asegúrate de que `tusuper-backend` esté en GitHub (rama `main`).

### 1.2 Crear Blueprint o servicios manualmente

**Opción A — Blueprint (recomendado)**  
En Render: **New → Blueprint** → conecta el repo del backend → usa el archivo `render.yaml`.

**Opción B — Manual**

1. **New → PostgreSQL**  
   - Nombre: `tusuper-db`  
   - Plan: Free (o Starter para producción real)

2. **New → Web Service**  
   - Runtime: **Docker**  
   - Root: raíz del backend  
   - Dockerfile: `./Dockerfile`  
   - Plan: Free  

### 1.3 Variables de entorno del API

Copia la plantilla `.env.render.example` y configura en el dashboard del Web Service:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Render la inyecta al vincular la BD |
| `JWT_SECRET` | Generar valor aleatorio largo |
| `JWT_EXPIRES_IN` | `86400` |
| `FRONTEND_URL` | URL del static site (la defines después del paso 2) |
| `GOOGLE_CLIENT_ID` / `SECRET` / `CALLBACK_URL` | OAuth (callback = `https://TU-API.onrender.com/auth/google/callback`) |
| `MAIL_*` | SMTP para recuperar contraseña |
| `CLOUDINARY_*` | Subida de imágenes de productos |
| `SEED_SECRET` | Secreto largo (mín. 16 caracteres) para poblar la BD |
| `ADMIN_EMAIL` | Ej. `admin@tusuper.com` |
| `ADMIN_PASSWORD` | Contraseña inicial del administrador |

También define (Render las pone automáticamente si usas blueprint):

- `NODE_ENV=production`
- `SKIP_ENV_FILE=true`
- `RENDER=true`

### 1.4 Primer deploy del API

El `Dockerfile` ejecuta:

```bash
npm run migration:run && node dist/main.js
```

Cuando el servicio esté **Live**, anota la URL:  
`https://tusuper-api.onrender.com` (o el nombre que elijas).

Comprueba salud:

```bash
curl https://TU-API.onrender.com/
# → {"status":"ok","service":"tusuper-api"}
```

### 1.5 Cargar la base de datos (seed de producción)

**Solo una vez**, con la BD vacía después de migraciones:

```bash
curl -X POST https://TU-API.onrender.com/seed/production \
  -H "x-seed-secret: TU_SEED_SECRET" \
  -H "Content-Type: application/json"
```

Esto ejecuta:

1. **Bootstrap**: módulos, roles (ADMIN, TENDERO, USER…), usuario admin.  
2. **Inventario**: 6 categorías, 5 proveedores (Colanta, Zenú, Fruver del Valle, La Económica, Chocorramo), ~40 productos con precios en COP.

Respuesta esperada (resumen):

```json
{
  "bootstrap": { "adminEmail": "admin@tusuper.com", "adminCreated": true, ... },
  "inventory": { "categoriesInserted": 6, "providersInserted": 5, "productsInserted": 40, ... }
}
```

Inicia sesión en el front con `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> **Desarrollo local:** `GET http://localhost:3000/seed` sigue disponible solo con `NODE_ENV=dev`.

---

## Parte 2 — Frontend (Static Site)

### 2.1 Subir código

Repo: `TuSuperFront` en GitHub.

### 2.2 Crear Static Site en Render

- **New → Static Site** → conecta el repo del frontend.
- **Build Command:**

  ```bash
  npm ci && npm run build:render
  ```

- **Publish directory:** `dist/adso_3063267/browser`
- **Environment variable:**

  | Key | Value |
  |-----|--------|
  | `API_URL` | `https://TU-API.onrender.com` (sin barra final) |

El script `scripts/set-env.js` genera `environment.prod.ts` antes del build.

### 2.3 Rutas SPA

El archivo `public/_redirects` redirige todas las rutas a `index.html` (necesario para Angular Router).

### 2.4 Actualizar el backend

Vuelve al Web Service del API y actualiza:

```
FRONTEND_URL=https://TU-FRONTEND.onrender.com
```

Redeploy del API si hace falta.

---

## Parte 3 — Servicios externos

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → Credenciales OAuth.  
2. **Authorized redirect URI:** `https://TU-API.onrender.com/auth/google/callback`  
3. **Authorized JavaScript origins:** `https://TU-FRONTEND.onrender.com`  
4. Copia Client ID y Secret al API.

### Cloudinary

1. Cuenta en [cloudinary.com](https://cloudinary.com).  
2. Copia `cloud_name`, `api_key`, `api_secret` al API.  
3. Sin esto, los productos se crean pero **falla la subida de imagen** (el front ya avisa si ocurre).

### Correo (recuperar contraseña)

Usa Gmail con contraseña de aplicación o un SMTP transaccional (SendGrid, etc.).

---

## Parte 4 — Checklist de producción

- [ ] `JWT_SECRET` y `SEED_SECRET` únicos y largos (no los del repo).  
- [ ] Cambiar `ADMIN_PASSWORD` tras el primer login.  
- [ ] `FRONTEND_URL` y `GOOGLE_CALLBACK_URL` con HTTPS reales.  
- [ ] Plan de BD acorde al tráfico (Free se “duerme” tras inactividad).  
- [ ] No exponer `GET /seed` en producción (bloqueado por `DevOnlyGuard`).  
- [ ] Rotar credenciales que hayan estado en chats o commits.  

---

## Comandos útiles locales

```bash
# Backend
cd c:\tusuper-backend
npm run start:dev

# Seed solo inventario (dev)
curl http://localhost:3000/seed

# Frontend
cd c:\TuSuperFront
npm start

# Build como en Render
set API_URL=http://localhost:3000
npm run build:render
```

---

## Solución de problemas

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| API no arranca | Falta variable en Joi | Revisa logs en Render → Environment |
| Error SSL en BD | Postgres gestionado | Ya configurado con `ssl` si hay `DATABASE_URL` |
| 403 al crear producto | Rol USER | Usa cuenta ADMIN o TENDERO |
| 400 al crear producto | Tipos string en JSON | Actualiza front (rama con `buildProductPayload`) |
| Imagen no sube | Cloudinary | Revisa `CLOUDINARY_*` en el API |
| Front no carga rutas | SPA | Confirma `_redirects` y rewrite en Render |

---

## Rama de trabajo actual (frontend)

Los cambios de logo, fix de productos y archivos Render están en:

`fix/login-logo-product-create`

Logo: `public/branding/tusuper-logo.png` (fondo transparente).
