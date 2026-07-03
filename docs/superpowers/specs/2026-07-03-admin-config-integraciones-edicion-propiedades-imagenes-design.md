# Diseño: Configuración del admin (integraciones), edición de propiedades e imágenes en Vercel Blob

**Fecha:** 2026-07-03
**Estado:** Aprobado para implementación
**Repo:** `albertoec1988/leadengine` (Next.js 16.2.10, App Router, Prisma 7, PostgreSQL/Neon)

## 1. Objetivo

Ampliar el panel `/admin` con tres capacidades:

1. Un apartado **Configuración** (`/admin/configuracion`) con navegación por **tabs**: Integraciones, General/Negocio y Usuarios/Equipo.
2. **Integraciones** de canales (Gmail, WhatsApp, Instagram, Facebook, YouTube, TikTok): UI + persistencia de credenciales **encriptadas at-rest**. En esta etapa NO hay envío/recepción en vivo; se construye la base para conectar cada API después.
3. **Editar propiedades** (hoy solo se pueden crear) y una **galería de imágenes** por propiedad, subidas a **Vercel Blob (público)**, con portada y orden.

### Fuera de alcance (YAGNI en esta etapa)

- OAuth real, webhooks y envío/recepción en vivo de cada canal.
- Tab de Notificaciones/Alertas (se pospone; el modelo `Notification` ya existe y no se toca aquí).
- Redimensionado/optimización de imágenes en el servidor (se sube el archivo tal cual; `next/image` ya optimiza en entrega).

## 2. Contexto actual (lo que ya existe)

- **Navegación** `components/admin/AdminNav.tsx`: Dashboard, Leads, Pipeline, Propiedades, Mapa, Analítica, Alertas. No hay Configuración.
- **Propiedades**: `app/admin/(dash)/propiedades/page.tsx` (lista), `.../propiedades/nueva/page.tsx` (crear), `components/admin/NewPropertyForm.tsx`, `components/admin/PropertyStatusControl.tsx`. Server actions en `lib/property-actions.ts` (`createProperty`, `updatePropertyStatus`). No hay edición.
- **Modelo `Property`** (`prisma/schema.prisma`): un solo campo `photoUrl` (una imagen). Modelos existentes: `User`, `Lead`, `LeadActivity`, `Property`, `Opportunity`, `Valuation`, `Notification`.
- **Auth**: `lib/auth-actions.ts` (bcryptjs, sesión firmada). Roles `admin` / `agent`. 4 usuarios seed.
- **DB**: esquema dual — `prisma/schema.prisma` (SQLite local) derivado a `prisma/schema.pg.prisma` (Postgres) por `scripts/gen-pg.mjs`. **Toda edición de modelos se hace en `schema.prisma`** (fuente); el de Postgres se regenera solo.
- **Cliente Prisma**: `lib/db.ts` elige adapter por el prefijo de `DATABASE_URL`.
- **Deps**: `@vercel/blob` NO instalado. No hay helper de criptografía.
- **Tests**: `vitest` (`npm test`).
- **Convención Next**: server actions con `"use server"`, `useActionState`, `revalidatePath`, `redirect`. **AGENTS.md exige leer `node_modules/next/dist/docs/` antes de escribir código** (esta versión de Next tiene cambios respecto al conocimiento base).

## 3. Modelo de datos (Prisma)

Editar **`prisma/schema.prisma`** (fuente SQLite; el schema Postgres se deriva). Añadir tres modelos y una relación:

```prisma
model PropertyImage {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url        String   // URL pública del Blob
  pathname   String   // ruta dentro del Blob (para poder borrar el archivo)
  order      Int      @default(0)
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([propertyId])
}

model Integration {
  id        String   @id @default(cuid())
  channel   String   @unique   // gmail | whatsapp | instagram | facebook | youtube | tiktok
  enabled   Boolean  @default(false)
  config    String?             // JSON encriptado (AES-256-GCM) con las credenciales
  status    String   @default("disconnected") // disconnected | configured
  updatedAt DateTime @updatedAt
}

model Setting {          // key-value para datos de General/Negocio
  key       String   @id  // businessName | logoUrl | phone | contactEmail | ...
  value     String
  updatedAt DateTime @updatedAt
}
```

Cambio en `Property`: añadir la relación inversa `images PropertyImage[]`.

**Portada denormalizada:** se mantiene `Property.photoUrl` como la URL de la imagen marcada `isPrimary`, para NO tocar las queries del sitio público (`lib/queries.ts`) ni el modelo de tarjetas. Cualquier acción que cambie la portada (subir la primera imagen, marcar otra como principal, borrar la portada) debe re-sincronizar `photoUrl`. Si una propiedad se queda sin imágenes, `photoUrl` vuelve a un placeholder por defecto (`/placeholder-property.jpg` u otra constante ya usada en el seed).

**Migración de datos:** las 15 propiedades del seed ya tienen `photoUrl` pero no filas en `PropertyImage`. No es obligatorio backfillear (la portada sigue funcionando por `photoUrl`); la galería aparecerá vacía hasta que se suban imágenes. Opcional: un pequeño backfill que cree una `PropertyImage` primaria a partir del `photoUrl` existente. **Decisión:** hacer el backfill en el mismo `pg:push`/seed no aplica (push no corre data-migrations); se añade un script idempotente `scripts/backfill-property-images.mjs` opcional, no bloqueante.

## 4. Criptografía de credenciales

Nuevo `lib/crypto.ts`:

- `encryptJSON(obj): string` y `decryptJSON(str): object` usando **AES-256-GCM**.
- Clave desde `process.env.APP_ENCRYPTION_KEY` (32 bytes en hex/base64). Formato de salida: `ivBase64:authTagBase64:cipherBase64`.
- Si `APP_ENCRYPTION_KEY` no está definida, `encryptJSON`/`decryptJSON` lanzan un error claro (fail-fast) — nunca guardar credenciales en claro.
- **Enmascarado:** helper `maskSecret(value)` → muestra solo los últimos 4 caracteres (`••••1234`). Las credenciales desencriptadas **nunca** se envían al cliente; los formularios muestran solo el estado (configurado/no) y valores enmascarados.

Env nueva: `APP_ENCRYPTION_KEY` (generar 32 bytes aleatorios; añadir a `.env`, `.env.example` como placeholder, y a Vercel en los 3 entornos).

## 5. Registro de canales de integración

Nuevo `lib/integrations.ts`: define, de forma **data-driven**, los canales y los campos de credenciales que pide cada uno. Añadir un canal futuro = una entrada en este array.

```ts
export type IntegrationField = {
  name: string          // clave dentro de config
  label: string
  type: "text" | "password"
  placeholder?: string
  help?: string
}

export type ChannelDef = {
  channel: string       // id estable
  name: string          // nombre visible
  description: string
  fields: IntegrationField[]
}
```

Canales incluidos en esta primera tanda (todos):

| channel     | Nombre visible | Campos de credenciales (ejemplo, ajustables) |
|-------------|----------------|----------------------------------------------|
| `gmail`     | Gmail          | Client ID, Client Secret, Refresh Token, Email remitente |
| `whatsapp`  | WhatsApp       | Phone Number ID, Business Account ID, Access Token, Verify Token |
| `instagram` | Instagram      | Business Account ID, Access Token |
| `facebook`  | Facebook       | Page ID, App ID, App Secret, Page Access Token |
| `youtube`   | YouTube        | Client ID, Client Secret, Channel ID, Refresh Token |
| `tiktok`    | TikTok         | Client Key, Client Secret, Access Token |

> Los nombres exactos de los campos son orientativos y fáciles de ajustar; lo importante es que el registro los declare y la UI los pinte genéricamente. Ningún campo se valida contra la API real en esta etapa.

## 6. UI: apartado Configuración

Tabs implementados como **sub-rutas con layout compartido** (patrón App Router). El layout pinta la barra de tabs y resalta la activa (misma lógica `isActive` de `AdminNav`).

- `app/admin/(dash)/configuracion/layout.tsx` — barra de tabs: Integraciones · General · Usuarios.
- `app/admin/(dash)/configuracion/page.tsx` — `redirect("/admin/configuracion/integraciones")`.
- `app/admin/(dash)/configuracion/integraciones/page.tsx` — server component: lee `Integration` de la BD, pinta una **tarjeta por canal** (desde el registro) con badge conectado/no-conectado y un formulario (client) por canal. Guardar → server action `saveIntegration`.
- `app/admin/(dash)/configuracion/general/page.tsx` — formulario de datos del negocio (lee/escribe `Setting`). Incluye subida de **logo** al Blob (reutiliza el flujo de imágenes).
- `app/admin/(dash)/configuracion/usuarios/page.tsx` — lista de usuarios; crear usuario, editar rol, resetear contraseña. Solo visible/operable por rol `admin`.

Añadir **"Configuración"** al array `NAV` en `components/admin/AdminNav.tsx`.

### Guardas de rol

- El tab **Usuarios** y sus acciones (`createUser`, `updateUserRole`, `resetUserPassword`) requieren rol `admin`. Las server actions verifican la sesión y el rol; si no es admin, retornan error y no mutan.
- Integraciones y General: accesibles a admin (agentes ven pero no guardan — o se ocultan; **decisión:** solo `admin` puede guardar en Configuración; agentes que naveguen ahí ven estado en solo-lectura).

## 7. UI: edición de propiedades e imágenes

### Refactor de formulario

Extraer un `components/admin/PropertyForm.tsx` compartido a partir de `NewPropertyForm.tsx`, parametrizado por modo (`create` | `edit`) y valores iniciales. `NewPropertyForm` pasa a usarlo (o se reemplaza). Server actions en `lib/property-actions.ts`:

- `updateProperty(id, prevState, formData)` — valida igual que `createProperty`, actualiza campos, `revalidatePath` de `/admin/propiedades`, `/propiedades`, `/propiedades/[id]`, `/mapa`.

### Página de edición

- `app/admin/(dash)/propiedades/[id]/editar/page.tsx` — carga la propiedad + sus imágenes; renderiza `PropertyForm` (modo edit) y el `ImageManager`.
- Link **"Editar"** en cada fila de `app/admin/(dash)/propiedades/page.tsx`.

### ImageManager (client component)

- **Subir**: input múltiple → por cada archivo, subida directa al Blob desde el cliente (ver §8). Al completar, llama a la server action `addImages(propertyId, [{url, pathname}])` que crea las filas `PropertyImage` (append al final del orden). Si la propiedad no tenía imágenes, la primera subida se marca `isPrimary` y sincroniza `photoUrl`.
- **Reordenar**: UI de orden (flechas o drag; empezar con flechas ↑/↓ por simplicidad) → `reorderImages(propertyId, orderedIds[])`.
- **Marcar portada**: `setPrimaryImage(propertyId, imageId)` → actualiza `isPrimary` (única) y sincroniza `Property.photoUrl`.
- **Borrar**: `deleteImage(imageId)` → borra el blob (`del(pathname)` de `@vercel/blob`) y la fila; si era la portada, re-asigna portada a la siguiente por orden (o placeholder si no queda ninguna).

Todas las acciones de imágenes viven en un nuevo `lib/image-actions.ts` (`"use server"`), verifican sesión admin, y hacen `revalidatePath` de las rutas afectadas.

## 8. Subida a Vercel Blob (público)

- Instalar `@vercel/blob`.
- **Subida directa desde el cliente** con `@vercel/blob/client` (`upload()`), apuntando a un route handler que firma la operación. Esto evita el límite de ~4.5 MB de body en server actions/route handlers de Vercel (crítico para fotos).
- `app/api/blob/upload/route.ts`: usa `handleUpload` de `@vercel/blob/client`. En `onBeforeGenerateToken` **verifica la sesión admin** (misma verificación de `lib/auth-actions`); si no hay admin, rechaza. Restringe `allowedContentTypes` a imágenes (`image/jpeg`, `image/png`, `image/webp`, `image/avif`) y fija `access: "public"`. Genera pathname con prefijo organizado: `properties/<propertyId>/<random>-<filename>` (y `branding/` para el logo).
- Token: `BLOB_READ_WRITE_TOKEN` (lo crea Vercel al crear el store Blob). En local, añadir a `.env` para pruebas; documentar en `.env.example`.
- **Organización** en el Blob por carpetas lógicas vía pathname: `properties/{propertyId}/...`, `branding/...`.

> Antes de implementar el route handler y las server actions, **leer los docs de Next 16 en `node_modules/next/dist/docs/01-app/`** (route handlers, server actions, revalidatePath) por posibles cambios de API respecto a versiones anteriores.

## 9. Server actions — resumen de contratos

| Acción | Archivo | Entrada | Efecto |
|--------|---------|---------|--------|
| `updateProperty` | `lib/property-actions.ts` | `id`, `FormData` | Actualiza campos; revalida rutas |
| `saveIntegration` | `lib/integration-actions.ts` | `channel`, `FormData` | Encripta config, upsert `Integration`, `status="configured"`, `enabled` |
| `saveSettings` | `lib/settings-actions.ts` | `FormData` | Upsert claves `Setting` |
| `createUser` / `updateUserRole` / `resetUserPassword` | `lib/user-actions.ts` | según acción | Gestión de usuarios (solo admin) |
| `addImages` / `reorderImages` / `setPrimaryImage` / `deleteImage` | `lib/image-actions.ts` | ver §7 | CRUD de galería + sync `photoUrl` |

Todas: `"use server"`, verifican sesión (y rol admin donde aplica), `revalidatePath` de las rutas afectadas, y devuelven un resultado tipado `{ ok: true } | { ok: false, error }` cuando se usan con `useActionState`.

## 10. Variables de entorno

| Variable | Uso | Dónde |
|----------|-----|-------|
| `APP_ENCRYPTION_KEY` | Clave AES-256-GCM para credenciales de integraciones | `.env`, `.env.example` (placeholder), Vercel (3 entornos) |
| `BLOB_READ_WRITE_TOKEN` | Token del store Blob (subida/borrado) | Auto en Vercel; `.env` en local |

## 11. Testing (vitest)

- `lib/crypto.ts`: round-trip encrypt→decrypt; `maskSecret` muestra solo últimos 4; falla sin `APP_ENCRYPTION_KEY`.
- `saveIntegration`: guarda config encriptada (no en claro en la fila) y marca `status="configured"`.
- Galería: `setPrimaryImage` deja exactamente una `isPrimary` y sincroniza `photoUrl`; `deleteImage` de la portada reasigna portada; `reorderImages` respeta el orden.
- `updateProperty`: valida precio/título y persiste cambios.
- Guardas de rol: acciones de usuarios rechazan si la sesión no es admin.

Los tests de acciones que tocan la BD usan el cliente Prisma sobre SQLite local (patrón existente), o se aíslan mockeando `prisma` donde el test sea unitario puro (cripto, enmascarado, cálculo de orden/portada).

## 12. Plan de despliegue

1. Editar `prisma/schema.prisma` → `npm run pg:push` contra Neon para crear las tablas nuevas (`PropertyImage`, `Integration`, `Setting`) y la relación.
2. Añadir `APP_ENCRYPTION_KEY` y confirmar `BLOB_READ_WRITE_TOKEN` en Vercel (3 entornos).
3. Deploy (push a `main` → Vercel).
4. Verificación en vivo: crear/editar una propiedad, subir 2–3 imágenes, marcar portada, ver la galería en el sitio público; guardar credenciales de un canal y confirmar que se persisten enmascaradas.

## 13. Riesgos y notas

- **Límite 4.5 MB**: mitigado con subida directa al Blob desde el cliente (§8).
- **Seguridad del endpoint de subida**: el route handler DEBE validar sesión admin en `onBeforeGenerateToken`; sin eso, cualquiera podría subir al Blob.
- **Sincronización `photoUrl`↔portada**: es la fuente de bugs más probable; cubierta por tests (§11) y centralizada en `lib/image-actions.ts`.
- **Next 16 con cambios**: leer los docs locales antes de codear route handlers/server actions.
- **Credenciales en claro**: prohibido; `lib/crypto.ts` hace fail-fast sin clave.
