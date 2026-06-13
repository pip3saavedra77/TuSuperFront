# Guia de despliegue — TuSuper (Backend + Frontend)

Esta guia describe como desplegar el proyecto en produccion usando:

- **Base de datos**: [Clever Cloud](https://clever-cloud.com) PostgreSQL
- **Backend API**: [Render](https://render.com) Web Service (Docker)
- **Frontend**: [Render](https://render.com) Static Site

---

## Resumen del orden de despliegue

1. Crear base de datos PostgreSQL en Clever Cloud
2. Desplegar backend API en Render (con migraciones automaticas)
3. Ejecutar seed de produccion (bootstrap + inventario)
4. Desplegar frontend en Render
5. Configurar servicios externos (Google OAuth, Cloudinary, SMTP)

---

## Parte 0 — Preparacion local

Asegurate de que ambos repositorios esten en GitHub y la rama `main` tenga los ultimos cambios:

- Backend: `tusuper-backend` (rama `dev`)
- Frontend: `TuSuperFront` (rama `main`)

---

## Parte 1 — Base de datos (Clever Cloud)

### 1.1 Crear la base de datos

1. Crear cuenta en [Clever Cloud](https://clever-cloud.com)
2. **Create → an add-on → PostgreSQL**
3. Elegir plan (DEV/Free para empezar)
4. Una vez creada, ir a **Information** y copiar la **Connection URI** (formato: `postgres://user:password@host:port/db`)

Guarda esta URI — la necesitaras como `DATABASE_URL` en el backend.

### 1.2 Configurar SSL

La conexion a Clever Cloud requiere SSL. El backend ya esta configurado para usar `ssl: { rejectUnauthorized: false }` en produccion.

---

## Parte 2 — Backend API (Render Web Service)

### 2.1 Crear el Web Service

1. En Render: **New → Web Service**
2. Conecta el repositorio `tusuper-backend`
3. Configuracion del servicio:
   - **Name**: `tusuper-api`
   - **Runtime**: Docker
   - **Branch**: `dev`
   - **Root Directory**: (dejar vacio, es la raiz)
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free

### 2.2 Variables de entorno

Configura estas en el dashboard de Render (Environment → Environment Variables):

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno de ejecucion | `prod` |
| `PORT` | Puerto del servidor | `3000` |
| `SKIP_ENV_FILE` | No cargar archivos .env | `true` |
| `DATABASE_URL` | URI de Clever Cloud | `postgres://user:pass@host:port/db` |
| `JWT_SECRET` | Secreto JWT (>= 32 chars) | Generar con `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Expiracion del token (seg) | `86400` |
| `FRONTEND_URL` | URL del frontend en Render | `https://tusuper-frontend.onrender.com` |
| `MAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP | `465` |
| `MAIL_USER` | Usuario SMTP | `tu_correo@gmail.com` |
| `MAIL_PASSWORD` | App password SMTP | `tu_app_password` |
| `MAIL_FROM` | Remitente | `"TuSuper <tu_correo@gmail.com>"` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | (de Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | (de Google Cloud Console) |
| `GOOGLE_CALLBACK_URL` | Callback OAuth | `https://tusuper-api.onrender.com/auth/google/callback` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (opcional) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (opcional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (opcional) |
| `SEED_SECRET` | Secreto para seed de produccion (>= 16 chars) | Generar aleatorio |
| `ADMIN_EMAIL` | Email del admin inicial | `admin@tusuper.com` |
| `ADMIN_PASSWORD` | Password del admin inicial (>= 8 chars) | `cambiar_tras_primer_login` |

### 2.3 Desplegar

Render ejecutara automaticamente:
1. `npm ci` (instalar dependencias)
2. `npm run build` (compilar TypeScript)
3. Construir imagen Docker
4. Al iniciar el contenedor: `npm run migration:run && node dist/main.js`

Cuando el servicio este **Live**, anota la URL: `https://tusuper-api.onrender.com`

### 2.4 Verificar salud

```bash
curl https://tusuper-api.onrender.com/
# Debe devolver: {"status":"ok","service":"tusuper-api","environment":"prod"}
```

---

## Parte 3 — Seed de produccion

Ejecuta esto UNA SOLA VEZ con la base de datos vacia:

```bash
curl -X POST https://tusuper-api.onrender.com/seed/production \
  -H "x-seed-secret: TU_SEED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"adminEmail": "ADMIN_EMAIL", "adminPassword": "ADMIN_PASSWORD"}'
```

Esto crea:
- **9 modulos**: users, roles, modules, product, category, provider, orders, dashboard, notifications
- **5 roles**: ADMIN, TENDERO, TENDER, VENDEDOR, USER
- **1 admin**: con el email y password configurados
- **Inventario**: 6 categorias, 5 proveedores, ~40 productos con precios en COP

Respuesta esperada:

```json
{
  "message": "Seeder completado exitosamente",
  "bootstrap": {
    "adminEmail": "admin@tusuper.com",
    "adminCreated": true,
    "rolesInserted": 5,
    "modulesInserted": 9
  },
  "categoriesInserted": 6,
  "providersInserted": 5,
  "productsInserted": 40
}
```

---

## Parte 4 — Frontend (Render Static Site)

### 4.1 Crear el Static Site

1. En Render: **New → Static Site**
2. Conecta el repositorio `TuSuperFront`
3. Configuracion:
   - **Name**: `tusuper-frontend`
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run build:render`
   - **Publish Directory**: `dist/adso_3063267/browser`

### 4.2 Variable de entorno

| Key | Value |
|---|---|
| `API_URL` | `https://tusuper-api.onrender.com` |

El script `scripts/set-env.js` genera `environment.prod.ts` con esta URL antes del build.

### 4.3 Desplegar

Render construira el sitio y lo servira como estatico. Las rutas SPA se manejan con `public/_redirects`.

Cuando este **Live**, anota la URL: `https://tusuper-frontend.onrender.com`

---

## Parte 5 — Servicios externos

### Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
3. Configurar:
   - **Authorized redirect URI**: `https://tusuper-api.onrender.com/auth/google/callback`
   - **Authorized JavaScript origins**: `https://tusuper-frontend.onrender.com`
4. Copiar Client ID y Client Secret al dashboard de Render (backend)

### Cloudinary (subida de imagenes)

1. Crear cuenta en [cloudinary.com](https://cloudinary.com)
2. Copiar `cloud_name`, `api_key`, `api_secret` al dashboard de Render (backend)
3. Sin esto, los productos se crean pero falla la subida de imagen

### SMTP (recuperacion de contrasena)

Usa Gmail con contraseña de aplicacion:
1. Activar 2FA en tu cuenta Google
2. Generar App Password en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Usar esa contraseña como `MAIL_PASSWORD`

---

## Parte 6 — Verificar todo

1. Abrir `https://tusuper-frontend.onrender.com`
2. Iniciar sesion con `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. Verificar que el dashboard carga con graficos
4. Navegar a Productos, Categorias, Proveedores — debe haber datos del seed
5. Crear un pedido de prueba como USER
6. Verificar notificaciones en el panel admin

---

## Parte 7 — Checklist de produccion

- [ ] `JWT_SECRET` y `SEED_SECRET` unicos y largos (>= 32 y >= 16 chars)
- [ ] `ADMIN_PASSWORD` cambiado tras el primer login
- [ ] `FRONTEND_URL` y `GOOGLE_CALLBACK_URL` con HTTPS reales
- [ ] Plan de Clever Cloud acorde al trafico (Free es suficiente para pruebas)
- [ ] Endpoint `GET /seed` bloqueado en produccion (solo funciona con `NODE_ENV !== 'prod'`)
- [ ] Rotar credenciales que hayan estado en chats o commits

---

## Solucion de problemas

| Sintoma | Causa probable | Accion |
|---|---|---|
| API no arranca | Falta variable de entorno | Revisar logs en Render → Deploy |
| Error SSL en BD | `sslmode` no configurado | El backend ya fuerza SSL en produccion |
| 403 al seed | `SEED_SECRET` no coincide | Verificar `x-seed-secret` header |
| 403 al crear producto | Rol USER | Usar cuenta ADMIN o TENDERO |
| Imagen no sube | Cloudinary no configurado | Verificar `CLOUDINARY_*` en el backend |
| Front no carga rutas | SPA rewrite | Verificar `_redirects` en el despliegue |
| WebSocket no conecta | URL hardcodeada antigua | Este fix ya esta aplicado en `notifications.service.ts` |
