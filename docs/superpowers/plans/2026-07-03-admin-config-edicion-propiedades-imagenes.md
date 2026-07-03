# Admin: Configuración, Edición de Propiedades e Imágenes (Vercel Blob) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir al panel `/admin` un apartado de Configuración con tabs (Integraciones, General, Usuarios), edición de propiedades y una galería de imágenes por propiedad subidas a Vercel Blob.

**Architecture:** App Router (Next 16) con server components para lectura, server actions (`"use server"`) para mutaciones, y subida directa de imágenes desde el cliente a Vercel Blob vía un route handler firmado. La lógica delicada (cripto de credenciales, orden/portada de galería) se aísla en helpers puros de `lib/` para poder testearla con vitest sin tocar `next` ni la BD. Persistencia con Prisma 7 (schema fuente SQLite → derivado Postgres).

**Tech Stack:** Next.js 16.2.10, React 19, Prisma 7 (+ Postgres/Neon en prod), `@vercel/blob`, `node:crypto` (AES-256-GCM), bcryptjs, vitest.

**Spec:** `docs/superpowers/specs/2026-07-03-admin-config-integraciones-edicion-propiedades-imagenes-design.md`

## Global Constraints

- **Runtime en Vercel: Node.js 20.** Todo el código debe correr en Node 20 (usar `node:crypto`, evitar APIs de Node 22+).
- **Next.js 16.2.10, App Router.** Server actions con `"use server"`; `revalidatePath` se importa de `next/cache`; route handlers usan Web `Request`/`Response`.
- **Esquema Prisma dual:** editar SIEMPRE `prisma/schema.prisma` (fuente SQLite). El de Postgres se deriva con `node scripts/gen-pg.mjs` (o `npm run pg:generate`). Nunca editar `prisma/schema.pg.prisma` a mano.
- **Cliente Prisma:** importar `{ prisma }` de `@/lib/db`.
- **Sesión/roles:** `getSessionUser()` de `@/lib/auth` devuelve `{ uid, name, email, role: "admin"|"agent" } | null`. Toda mutación de Configuración requiere `role === "admin"`.
- **Credenciales:** NUNCA guardar en claro ni enviarlas al cliente. Encriptar con `lib/crypto.ts`; mostrar enmascaradas.
- **Tests:** vitest, entorno `node`, solo se recogen `lib/**/*.test.ts`. Los tests no deben importar módulos que hagan `import "server-only"` ni `next/*`. Testear helpers puros.
- **Blob:** store público ya creado en Vercel; env `BLOB_READ_WRITE_TOKEN` (auto en Vercel; en local ponerla en `.env`). Subidas restringidas a imágenes y gateadas por sesión admin.
- **i18n/copys:** UI en español, coherente con el panel actual (clases Tailwind existentes: `bg-navy`, `text-paper`, `bg-gold`, `border-line`, `text-ink`, `text-muted`, etc.).
- **Commits frecuentes**, mensajes `feat(...)`/`test(...)`/`chore(...)`, terminando con:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## Fase 0 — Dependencias, esquema y entorno

### Task 0.1: Instalar `@vercel/blob` y añadir env vars

**Files:**
- Modify: `package.json` (dep)
- Modify: `.env.example`
- Modify: `.env`

- [ ] **Step 1: Instalar la dependencia**

```bash
cd /home/albe/Projects/FFR
npm install @vercel/blob
```

- [ ] **Step 2: Generar la clave de cifrado y añadir placeholders a `.env.example`**

Añadir al final de `.env.example`:

```bash
# Clave para cifrar credenciales de integraciones (AES-256-GCM). Genera una con:
#   openssl rand -hex 32
APP_ENCRYPTION_KEY="pon-aqui-64-hex-chars"

# Token del store Blob (Vercel lo crea automáticamente en el proyecto).
# En local, pégalo desde Vercel > Storage > tu Blob > .env.local
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

- [ ] **Step 3: Poner valores reales en `.env` (local)**

Generar y añadir a `.env` (NO commitear `.env`):

```bash
echo "APP_ENCRYPTION_KEY=\"$(openssl rand -hex 32)\"" >> .env
# BLOB_READ_WRITE_TOKEN: pegar el valor real desde Vercel para pruebas locales de subida
```

- [ ] **Step 4: Verificar que `.env` está gitignored**

Run: `git check-ignore .env && echo "ignored OK"`
Expected: `.env` + `ignored OK`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(deps): añadir @vercel/blob y documentar APP_ENCRYPTION_KEY/BLOB_READ_WRITE_TOKEN

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 0.2: Modelos Prisma (`PropertyImage`, `Integration`, `Setting`) + relación

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: modelos `PropertyImage`, `Integration`, `Setting`; relación `Property.images PropertyImage[]`.

- [ ] **Step 1: Añadir la relación inversa en `Property`**

En `model Property`, añadir dentro del bloque (junto a `leads`/`opportunities`):

```prisma
  images        PropertyImage[]
```

- [ ] **Step 2: Añadir los tres modelos nuevos al final de `prisma/schema.prisma`**

```prisma
model PropertyImage {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url        String
  pathname   String
  order      Int      @default(0)
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([propertyId])
}

model Integration {
  id        String   @id @default(cuid())
  channel   String   @unique
  enabled   Boolean  @default(false)
  config    String?
  status    String   @default("disconnected")
  updatedAt DateTime @updatedAt
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: Regenerar el cliente (SQLite local) y validar el schema**

Run: `npx prisma generate`
Expected: `Generated Prisma Client` sin errores.

Run: `node scripts/gen-pg.mjs && npx prisma validate --schema prisma/schema.pg.prisma`
Expected: `The schema at prisma/schema.pg.prisma is valid`.

- [ ] **Step 4: Aplicar el schema a la BD local (SQLite) para desarrollo**

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): modelos PropertyImage, Integration y Setting + relación Property.images

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **Nota de despliegue (no es un step de código):** en producción se ejecutará `npm run pg:push` contra Neon (ver Fase 8) para crear estas tablas.

---

## Fase 1 — Criptografía y galería: helpers puros (testeables)

### Task 1.1: `lib/crypto.ts` (AES-256-GCM + enmascarado)

**Files:**
- Create: `lib/crypto.ts`
- Test: `lib/crypto.test.ts`

**Interfaces:**
- Produces:
  - `encryptJSON(obj: unknown): string`
  - `decryptJSON<T = unknown>(payload: string): T`
  - `maskSecret(value: string): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/crypto.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { encryptJSON, decryptJSON, maskSecret } from "@/lib/crypto"

const ORIGINAL = process.env.APP_ENCRYPTION_KEY

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = "0".repeat(64) // 32 bytes en hex
})
afterAll(() => {
  process.env.APP_ENCRYPTION_KEY = ORIGINAL
})

describe("crypto", () => {
  it("round-trips an object and does not leak plaintext", () => {
    const enc = encryptJSON({ token: "abc123", id: "xyz" })
    expect(enc).not.toContain("abc123")
    expect(decryptJSON(enc)).toEqual({ token: "abc123", id: "xyz" })
  })

  it("produces different ciphertext each call (random IV)", () => {
    expect(encryptJSON({ a: 1 })).not.toBe(encryptJSON({ a: 1 }))
  })

  it("masks a secret showing only the last 4 chars", () => {
    expect(maskSecret("supersecret1234")).toBe("••••1234")
    expect(maskSecret("")).toBe("")
  })

  it("throws a clear error without a key", () => {
    const prev = process.env.APP_ENCRYPTION_KEY
    delete process.env.APP_ENCRYPTION_KEY
    expect(() => encryptJSON({ a: 1 })).toThrow(/APP_ENCRYPTION_KEY/)
    process.env.APP_ENCRYPTION_KEY = prev
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/crypto.test.ts`
Expected: FAIL (module `@/lib/crypto` no existe).

- [ ] **Step 3: Implementar `lib/crypto.ts`**

```ts
// lib/crypto.ts
import crypto from "node:crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY
  if (!raw) throw new Error("APP_ENCRYPTION_KEY no está definida")
  const key = Buffer.from(raw, raw.length === 64 ? "hex" : "base64")
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY debe ser de 32 bytes (64 hex o 44 base64)")
  }
  return key
}

export function encryptJSON(obj: unknown): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(obj), "utf8")),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":")
}

export function decryptJSON<T = unknown>(payload: string): T {
  const [ivB64, tagB64, dataB64] = payload.split(":")
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Formato de credencial inválido")
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ])
  return JSON.parse(dec.toString("utf8")) as T
}

export function maskSecret(value: string): string {
  if (!value) return ""
  return `••••${value.slice(-4)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/crypto.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/crypto.ts lib/crypto.test.ts
git commit -m "feat(crypto): cifrado AES-256-GCM de credenciales y enmascarado

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2: `lib/gallery.ts` (orden y portada, puro)

**Files:**
- Create: `lib/gallery.ts`
- Test: `lib/gallery.test.ts`

**Interfaces:**
- Produces:
  - `type GalleryImage = { id: string; order: number; isPrimary: boolean }`
  - `reorder(ids: string[]): { id: string; order: number }[]`
  - `computePrimaryAfterSet(images: GalleryImage[], primaryId: string): GalleryImage[]`
  - `computePrimaryAfterDelete(images: GalleryImage[], deletedId: string): { remaining: GalleryImage[]; newPrimaryId: string | null }`
  - `PLACEHOLDER_PHOTO: string`
  - `primaryUrlOrPlaceholder(images: { url: string; isPrimary: boolean }[]): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/gallery.test.ts
import { describe, it, expect } from "vitest"
import {
  reorder,
  computePrimaryAfterSet,
  computePrimaryAfterDelete,
  primaryUrlOrPlaceholder,
  PLACEHOLDER_PHOTO,
} from "@/lib/gallery"

describe("gallery", () => {
  it("reorder assigns sequential order by array index", () => {
    expect(reorder(["c", "a", "b"])).toEqual([
      { id: "c", order: 0 },
      { id: "a", order: 1 },
      { id: "b", order: 2 },
    ])
  })

  it("computePrimaryAfterSet marks exactly one primary", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
    ]
    const out = computePrimaryAfterSet(imgs, "2")
    expect(out.filter((i) => i.isPrimary).map((i) => i.id)).toEqual(["2"])
  })

  it("computePrimaryAfterDelete reassigns primary to first when the primary is removed", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
      { id: "3", order: 2, isPrimary: false },
    ]
    const { remaining, newPrimaryId } = computePrimaryAfterDelete(imgs, "1")
    expect(remaining.map((i) => i.id)).toEqual(["2", "3"])
    expect(remaining.map((i) => i.order)).toEqual([0, 1])
    expect(newPrimaryId).toBe("2")
    expect(remaining.find((i) => i.id === "2")?.isPrimary).toBe(true)
  })

  it("computePrimaryAfterDelete keeps existing primary when a non-primary is removed", () => {
    const imgs = [
      { id: "1", order: 0, isPrimary: true },
      { id: "2", order: 1, isPrimary: false },
    ]
    const { newPrimaryId } = computePrimaryAfterDelete(imgs, "2")
    expect(newPrimaryId).toBe("1")
  })

  it("computePrimaryAfterDelete returns null primary when list becomes empty", () => {
    const imgs = [{ id: "1", order: 0, isPrimary: true }]
    expect(computePrimaryAfterDelete(imgs, "1").newPrimaryId).toBeNull()
  })

  it("primaryUrlOrPlaceholder falls back to placeholder when no images", () => {
    expect(primaryUrlOrPlaceholder([])).toBe(PLACEHOLDER_PHOTO)
    expect(
      primaryUrlOrPlaceholder([{ url: "u2", isPrimary: true }, { url: "u1", isPrimary: false }]),
    ).toBe("u2")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/gallery.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `lib/gallery.ts`**

```ts
// lib/gallery.ts
export type GalleryImage = { id: string; order: number; isPrimary: boolean }

// Placeholder cuando una propiedad no tiene imágenes (mismo estilo que el seed).
export const PLACEHOLDER_PHOTO = "https://picsum.photos/seed/ffr-placeholder/800/600"

export function reorder(ids: string[]): { id: string; order: number }[] {
  return ids.map((id, index) => ({ id, order: index }))
}

export function computePrimaryAfterSet(
  images: GalleryImage[],
  primaryId: string,
): GalleryImage[] {
  return images.map((img) => ({ ...img, isPrimary: img.id === primaryId }))
}

export function computePrimaryAfterDelete(
  images: GalleryImage[],
  deletedId: string,
): { remaining: GalleryImage[]; newPrimaryId: string | null } {
  const remaining = images
    .filter((i) => i.id !== deletedId)
    .sort((a, b) => a.order - b.order)
    .map((img, index) => ({ ...img, order: index }))

  if (remaining.length === 0) return { remaining, newPrimaryId: null }

  const stillHasPrimary = remaining.some((i) => i.isPrimary)
  if (!stillHasPrimary) {
    remaining[0].isPrimary = true
    return { remaining, newPrimaryId: remaining[0].id }
  }
  return { remaining, newPrimaryId: remaining.find((i) => i.isPrimary)!.id }
}

export function primaryUrlOrPlaceholder(
  images: { url: string; isPrimary: boolean }[],
): string {
  return images.find((i) => i.isPrimary)?.url ?? PLACEHOLDER_PHOTO
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/gallery.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/gallery.ts lib/gallery.test.ts
git commit -m "feat(gallery): helpers puros de orden y portada de imágenes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3: `lib/integrations.ts` (registro de canales, puro)

**Files:**
- Create: `lib/integrations.ts`
- Test: `lib/integrations.test.ts`

**Interfaces:**
- Produces:
  - `type IntegrationField = { name: string; label: string; type: "text" | "password"; placeholder?: string; help?: string }`
  - `type ChannelDef = { channel: string; name: string; description: string; fields: IntegrationField[] }`
  - `CHANNELS: ChannelDef[]`
  - `getChannel(channel: string): ChannelDef | undefined`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/integrations.test.ts
import { describe, it, expect } from "vitest"
import { CHANNELS, getChannel } from "@/lib/integrations"

describe("integrations registry", () => {
  it("includes the six channels", () => {
    expect(CHANNELS.map((c) => c.channel).sort()).toEqual(
      ["facebook", "gmail", "instagram", "tiktok", "whatsapp", "youtube"].sort(),
    )
  })

  it("has unique channel ids", () => {
    const ids = CHANNELS.map((c) => c.channel)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every channel has at least one field with a stable name", () => {
    for (const c of CHANNELS) {
      expect(c.fields.length).toBeGreaterThan(0)
      for (const f of c.fields) expect(f.name).toMatch(/^[a-zA-Z0-9_]+$/)
    }
  })

  it("getChannel returns the def or undefined", () => {
    expect(getChannel("gmail")?.name).toBe("Gmail")
    expect(getChannel("nope")).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/integrations.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `lib/integrations.ts`**

```ts
// lib/integrations.ts
export type IntegrationField = {
  name: string
  label: string
  type: "text" | "password"
  placeholder?: string
  help?: string
}

export type ChannelDef = {
  channel: string
  name: string
  description: string
  fields: IntegrationField[]
}

export const CHANNELS: ChannelDef[] = [
  {
    channel: "gmail",
    name: "Gmail",
    description: "Enviar y recibir correos desde tu cuenta de Gmail.",
    fields: [
      { name: "clientId", label: "Client ID", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "refreshToken", label: "Refresh Token", type: "password" },
      { name: "senderEmail", label: "Email remitente", type: "text", placeholder: "ventas@tudominio.com" },
    ],
  },
  {
    channel: "whatsapp",
    name: "WhatsApp",
    description: "Mensajería vía WhatsApp Business Cloud API.",
    fields: [
      { name: "phoneNumberId", label: "Phone Number ID", type: "text" },
      { name: "businessAccountId", label: "Business Account ID", type: "text" },
      { name: "accessToken", label: "Access Token", type: "password" },
      { name: "verifyToken", label: "Verify Token", type: "password" },
    ],
  },
  {
    channel: "instagram",
    name: "Instagram",
    description: "Mensajes directos y publicaciones de Instagram.",
    fields: [
      { name: "businessAccountId", label: "Business Account ID", type: "text" },
      { name: "accessToken", label: "Access Token", type: "password" },
    ],
  },
  {
    channel: "facebook",
    name: "Facebook",
    description: "Messenger y publicaciones de la página de Facebook.",
    fields: [
      { name: "pageId", label: "Page ID", type: "text" },
      { name: "appId", label: "App ID", type: "text" },
      { name: "appSecret", label: "App Secret", type: "password" },
      { name: "pageAccessToken", label: "Page Access Token", type: "password" },
    ],
  },
  {
    channel: "youtube",
    name: "YouTube",
    description: "Publicación y métricas de tu canal de YouTube.",
    fields: [
      { name: "clientId", label: "Client ID", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "channelId", label: "Channel ID", type: "text" },
      { name: "refreshToken", label: "Refresh Token", type: "password" },
    ],
  },
  {
    channel: "tiktok",
    name: "TikTok",
    description: "Publicación de vídeos y métricas de TikTok.",
    fields: [
      { name: "clientKey", label: "Client Key", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "accessToken", label: "Access Token", type: "password" },
    ],
  },
]

export function getChannel(channel: string): ChannelDef | undefined {
  return CHANNELS.find((c) => c.channel === channel)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/integrations.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/integrations.ts lib/integrations.test.ts
git commit -m "feat(integrations): registro data-driven de canales (Gmail, WhatsApp, IG, FB, YT, TikTok)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 2 — Subida a Vercel Blob (route handler + helper cliente)

### Task 2.1: Route handler firmado `app/api/blob/upload/route.ts`

**Files:**
- Create: `app/api/blob/upload/route.ts`

**Interfaces:**
- Consumes: `getSessionUser` de `@/lib/auth`.
- Produces: endpoint `POST /api/blob/upload` compatible con `@vercel/blob/client`.

- [ ] **Step 1: Implementar el route handler**

```ts
// app/api/blob/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"]

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Gate: solo un admin autenticado puede obtener un token de subida.
        const user = await getSessionUser()
        if (!user || user.role !== "admin") {
          throw new Error("No autorizado")
        }
        return {
          allowedContentTypes: ALLOWED,
          addRandomSuffix: true,
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB por imagen
        }
      },
      // onUploadCompleted NO se usa para crear filas: no se dispara en localhost.
      // Las filas PropertyImage se crean vía la server action addImages tras upload().
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
```

- [ ] **Step 2: Verificar que compila (typecheck del build no-completo)**

Run: `npx tsc --noEmit`
Expected: sin errores en `app/api/blob/upload/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/api/blob/upload/route.ts
git commit -m "feat(blob): route handler firmado para subidas, gateado por sesión admin

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: Helper cliente de subida `lib/upload-client.ts`

**Files:**
- Create: `lib/upload-client.ts`

**Interfaces:**
- Consumes: `upload` de `@vercel/blob/client`.
- Produces: `uploadImage(file: File, prefix: string): Promise<{ url: string; pathname: string }>`

- [ ] **Step 1: Implementar el helper**

```ts
// lib/upload-client.ts
"use client"

import { upload } from "@vercel/blob/client"

// Sube un archivo al Blob (público) organizándolo bajo `prefix/`.
// `prefix` ej.: `properties/<propertyId>` o `branding`.
export async function uploadImage(
  file: File,
  prefix: string,
): Promise<{ url: string; pathname: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
  const result = await upload(`${prefix}/${cleanName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
  })
  return { url: result.url, pathname: result.pathname }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add lib/upload-client.ts
git commit -m "feat(blob): helper cliente uploadImage (subida directa al Blob)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 3 — Edición de propiedades

### Task 3.1: Server action `updateProperty`

**Files:**
- Modify: `lib/property-actions.ts`

**Interfaces:**
- Consumes: `prisma`, `revalidatePath`, `redirect`, `getSessionUser`.
- Produces: `updateProperty(id: string, _prev: CreatePropertyResult | null, formData: FormData): Promise<CreatePropertyResult>` (reusa el tipo `CreatePropertyResult` ya exportado).

- [ ] **Step 1: Añadir el import de sesión al inicio de `lib/property-actions.ts`**

Debajo de los imports existentes añadir:

```ts
import { getSessionUser } from "@/lib/auth"
```

- [ ] **Step 2: Implementar `updateProperty` (añadir al final del archivo)**

```ts
export async function updateProperty(
  id: string,
  _prev: CreatePropertyResult | null,
  formData: FormData,
): Promise<CreatePropertyResult> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false, error: "No autorizado." }

  const title = String(formData.get("title") ?? "").trim()
  const zone = String(formData.get("zone") ?? "Coral Gables")
  const price = Number(formData.get("price") ?? 0)
  const bedrooms = Number(formData.get("bedrooms") ?? 0)
  const bathrooms = Number(formData.get("bathrooms") ?? 0)
  const areaSqft = Number(formData.get("areaSqft") ?? 0)
  const status = String(formData.get("status") ?? "for_sale")
  const address = String(formData.get("address") ?? "").trim() || `${zone}, FL`

  if (!title) return { ok: false, error: "El título es obligatorio." }
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Introduce un precio válido." }
  if (!VALID_STATUS.includes(status)) return { ok: false, error: "Estado inválido." }

  await prisma.property.update({
    where: { id },
    data: {
      title,
      zone,
      price: Math.round(price),
      bedrooms: Math.max(0, bedrooms),
      bathrooms: Math.max(0, bathrooms),
      areaSqft: Math.max(0, areaSqft),
      address,
      status,
    },
  })

  revalidatePath("/admin/propiedades")
  revalidatePath("/propiedades")
  revalidatePath(`/propiedades/${id}`)
  revalidatePath("/mapa")
  redirect("/admin/propiedades")
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores (nota: `VALID_STATUS` y `CreatePropertyResult` ya existen en el archivo).

- [ ] **Step 4: Commit**

```bash
git add lib/property-actions.ts
git commit -m "feat(propiedades): server action updateProperty (solo admin)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.2: Formulario compartido `PropertyForm` (crear + editar)

**Files:**
- Create: `components/admin/PropertyForm.tsx`
- Modify: `components/admin/NewPropertyForm.tsx`

**Interfaces:**
- Consumes: `createProperty`, `updateProperty` de `@/lib/property-actions`.
- Produces: `PropertyForm({ mode, property? }: { mode: "create" | "edit"; property?: PropertyFormValues })`, con `type PropertyFormValues = { id: string; title: string; zone: string; price: number; bedrooms: number; bathrooms: number; areaSqft: number; address: string; status: string }`.

- [ ] **Step 1: Crear `components/admin/PropertyForm.tsx`**

```tsx
"use client"

import { useActionState } from "react"
import {
  createProperty,
  updateProperty,
  type CreatePropertyResult,
} from "@/lib/property-actions"

const ZONES = ["Coral Gables", "South Miami", "Kendall"]
const STATUS = [
  { value: "for_sale", label: "En venta" },
  { value: "pending", label: "Reservada" },
  { value: "sold", label: "Vendida" },
]
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

export type PropertyFormValues = {
  id: string
  title: string
  zone: string
  price: number
  bedrooms: number
  bathrooms: number
  areaSqft: number
  address: string
  status: string
}

export function PropertyForm({
  mode,
  property,
}: {
  mode: "create" | "edit"
  property?: PropertyFormValues
}) {
  const boundAction =
    mode === "edit" && property
      ? (prev: CreatePropertyResult | null, fd: FormData) =>
          updateProperty(property.id, prev, fd)
      : createProperty

  const [state, action, pending] = useActionState<CreatePropertyResult | null, FormData>(
    boundAction,
    null,
  )

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-paper p-6">
      <div>
        <label className={labelClass} htmlFor="title">Título</label>
        <input id="title" name="title" required defaultValue={property?.title}
          className={fieldClass} placeholder="3BR Coral Gables Villa" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="zone">Zona</label>
          <select id="zone" name="zone" className={fieldClass} defaultValue={property?.zone ?? "Coral Gables"}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="price">Precio (USD)</label>
          <input id="price" name="price" type="number" min={1} required defaultValue={property?.price}
            className={fieldClass} placeholder="850000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="areaSqft">Superficie (sqft)</label>
          <input id="areaSqft" name="areaSqft" type="number" min={0} defaultValue={property?.areaSqft}
            className={fieldClass} placeholder="2000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Dirección</label>
          <input id="address" name="address" defaultValue={property?.address}
            className={fieldClass} placeholder="123 Coral Way" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bedrooms">Habitaciones</label>
          <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property?.bedrooms}
            className={fieldClass} placeholder="3" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bathrooms">Baños</label>
          <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property?.bathrooms}
            className={fieldClass} placeholder="2" />
        </div>
        {mode === "edit" && (
          <div>
            <label className={labelClass} htmlFor="status">Estado</label>
            <select id="status" name="status" className={fieldClass} defaultValue={property?.status ?? "for_sale"}>
              {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending}
        className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gold-deep disabled:opacity-60">
        {pending ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Crear propiedad"}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Reescribir `components/admin/NewPropertyForm.tsx` para reusar `PropertyForm`**

```tsx
"use client"

import { PropertyForm } from "@/components/admin/PropertyForm"

export function NewPropertyForm() {
  return <PropertyForm mode="create" />
}
```

- [ ] **Step 3: Verificar typecheck y build local**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `npm run build`
Expected: build OK; ruta `/admin/propiedades/nueva` sigue existiendo.

- [ ] **Step 4: Commit**

```bash
git add components/admin/PropertyForm.tsx components/admin/NewPropertyForm.tsx
git commit -m "refactor(propiedades): PropertyForm compartido para crear y editar

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.3: Página de edición + link "Editar" en la lista

**Files:**
- Create: `app/admin/(dash)/propiedades/[id]/editar/page.tsx`
- Modify: `app/admin/(dash)/propiedades/page.tsx`

**Interfaces:**
- Consumes: `prisma`, `PropertyForm` + `PropertyFormValues`.
- Produces: ruta `/admin/propiedades/[id]/editar`.

- [ ] **Step 1: Crear la página de edición**

```tsx
// app/admin/(dash)/propiedades/[id]/editar/page.tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { PropertyForm, type PropertyFormValues } from "@/components/admin/PropertyForm"

export const dynamic = "force-dynamic"

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) notFound()

  const values: PropertyFormValues = {
    id: property.id,
    title: property.title,
    zone: property.zone,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    address: property.address,
    status: property.status,
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-8">
      <Link href="/admin/propiedades" className="text-sm text-muted hover:text-ink">
        ← Volver a propiedades
      </Link>
      <h1 className="mt-3 mb-6 font-display text-2xl text-ink">Editar propiedad</h1>
      <PropertyForm mode="edit" property={values} />
      {/* La galería de imágenes se añade en la Fase 4 (Task 4.3). */}
    </section>
  )
}
```

- [ ] **Step 2: Añadir el link "Editar" en la lista de propiedades**

En `app/admin/(dash)/propiedades/page.tsx`, localizar donde se pinta cada propiedad (fila/tarjeta) y añadir, junto al control de estado, un enlace:

```tsx
<Link
  href={`/admin/propiedades/${property.id}/editar`}
  className="text-sm font-medium text-gold-deep hover:underline"
>
  Editar
</Link>
```

Asegurarse de importar `Link` de `next/link` al inicio del archivo si no está ya importado.

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: aparece la ruta `ƒ /admin/propiedades/[id]/editar`.

- [ ] **Step 4: Verificación manual (dev)**

Run: `npm run dev` y visitar `/admin/propiedades`, entrar a "Editar" de una propiedad, cambiar el precio y guardar. Confirmar que redirige a la lista con el cambio aplicado.

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(dash)/propiedades/[id]/editar/page.tsx" "app/admin/(dash)/propiedades/page.tsx"
git commit -m "feat(propiedades): página de edición y acceso desde la lista

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 4 — Galería de imágenes

### Task 4.1: Server actions de galería `lib/image-actions.ts`

**Files:**
- Create: `lib/image-actions.ts`

**Interfaces:**
- Consumes: `prisma`, `revalidatePath`, `getSessionUser`, helpers de `@/lib/gallery`, `del` de `@vercel/blob`.
- Produces (todas requieren admin; devuelven `{ ok: true } | { ok: false; error: string }`):
  - `addImages(propertyId: string, files: { url: string; pathname: string }[]): Promise<ActionResult>`
  - `reorderImages(propertyId: string, orderedIds: string[]): Promise<ActionResult>`
  - `setPrimaryImage(propertyId: string, imageId: string): Promise<ActionResult>`
  - `deleteImage(imageId: string): Promise<ActionResult>`
  - `type ActionResult = { ok: true } | { ok: false; error: string }`

- [ ] **Step 1: Implementar `lib/image-actions.ts`**

```ts
// lib/image-actions.ts
"use server"

import { del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import {
  computePrimaryAfterDelete,
  computePrimaryAfterSet,
  reorder,
  PLACEHOLDER_PHOTO,
} from "@/lib/gallery"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  return !!user && user.role === "admin"
}

function revalidateProperty(propertyId: string) {
  revalidatePath(`/admin/propiedades/${propertyId}/editar`)
  revalidatePath("/admin/propiedades")
  revalidatePath("/propiedades")
  revalidatePath(`/propiedades/${propertyId}`)
  revalidatePath("/mapa")
}

// Recalcula Property.photoUrl a partir de la imagen isPrimary (o placeholder).
async function syncCover(propertyId: string) {
  const primary = await prisma.propertyImage.findFirst({
    where: { propertyId, isPrimary: true },
  })
  await prisma.property.update({
    where: { id: propertyId },
    data: { photoUrl: primary?.url ?? PLACEHOLDER_PHOTO },
  })
}

export async function addImages(
  propertyId: string,
  files: { url: string; pathname: string }[],
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  if (files.length === 0) return { ok: false, error: "No hay archivos." }

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } })

  await prisma.$transaction(
    files.map((f, i) =>
      prisma.propertyImage.create({
        data: {
          propertyId,
          url: f.url,
          pathname: f.pathname,
          order: existingCount + i,
          isPrimary: existingCount === 0 && i === 0,
        },
      }),
    ),
  )

  await syncCover(propertyId)
  revalidateProperty(propertyId)
  return { ok: true }
}

export async function reorderImages(
  propertyId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const updates = reorder(orderedIds)
  await prisma.$transaction(
    updates.map((u) =>
      prisma.propertyImage.update({
        where: { id: u.id },
        data: { order: u.order },
      }),
    ),
  )

  revalidateProperty(propertyId)
  return { ok: true }
}

export async function setPrimaryImage(
  propertyId: string,
  imageId: string,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const images = await prisma.propertyImage.findMany({ where: { propertyId } })
  const next = computePrimaryAfterSet(
    images.map((i) => ({ id: i.id, order: i.order, isPrimary: i.isPrimary })),
    imageId,
  )
  await prisma.$transaction(
    next.map((i) =>
      prisma.propertyImage.update({ where: { id: i.id }, data: { isPrimary: i.isPrimary } }),
    ),
  )

  await syncCover(propertyId)
  revalidateProperty(propertyId)
  return { ok: true }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const image = await prisma.propertyImage.findUnique({ where: { id: imageId } })
  if (!image) return { ok: false, error: "Imagen no encontrada." }

  const siblings = await prisma.propertyImage.findMany({ where: { propertyId: image.propertyId } })
  const { remaining, newPrimaryId } = computePrimaryAfterDelete(
    siblings.map((i) => ({ id: i.id, order: i.order, isPrimary: i.isPrimary })),
    imageId,
  )

  // Borrar el archivo del Blob (best-effort) y la fila.
  try {
    await del(image.url)
  } catch {
    // Si el blob ya no existe, seguimos; la fila igual se elimina.
  }

  await prisma.$transaction([
    prisma.propertyImage.delete({ where: { id: imageId } }),
    ...remaining.map((i) =>
      prisma.propertyImage.update({
        where: { id: i.id },
        data: { order: i.order, isPrimary: i.id === newPrimaryId },
      }),
    ),
  ])

  await syncCover(image.propertyId)
  revalidateProperty(image.propertyId)
  return { ok: true }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/image-actions.ts
git commit -m "feat(galería): server actions addImages/reorder/setPrimary/deleteImage con sync de portada

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Componente `ImageManager` (cliente)

**Files:**
- Create: `components/admin/ImageManager.tsx`

**Interfaces:**
- Consumes: `uploadImage` de `@/lib/upload-client`; `addImages`, `reorderImages`, `setPrimaryImage`, `deleteImage` de `@/lib/image-actions`.
- Produces: `ImageManager({ propertyId, images }: { propertyId: string; images: { id: string; url: string; isPrimary: boolean; order: number }[] })`.

- [ ] **Step 1: Implementar el componente**

```tsx
// components/admin/ImageManager.tsx
"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { uploadImage } from "@/lib/upload-client"
import {
  addImages,
  reorderImages,
  setPrimaryImage,
  deleteImage,
} from "@/lib/image-actions"

type Img = { id: string; url: string; isPrimary: boolean; order: number }

export function ImageManager({
  propertyId,
  images,
}: {
  propertyId: string
  images: Img[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ordered = [...images].sort((a, b) => a.order - b.order)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        uploaded.push(await uploadImage(file, `properties/${propertyId}`))
      }
      const res = await addImages(propertyId, uploaded)
      if (!res.ok) setError(res.error)
      else router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error ?? "Error")
      else router.refresh()
    })
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...ordered]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    run(() => reorderImages(propertyId, next.map((i) => i.id)))
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Imágenes</h2>

      <label className="inline-block cursor-pointer rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paper-2">
        {uploading ? "Subiendo…" : "Añadir imágenes"}
        <input type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={uploading} />
      </label>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Aún no hay imágenes. La portada usará un placeholder.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((img, index) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line">
              <div className="relative aspect-[4/3] bg-sand">
                <Image src={img.url} alt="" fill className="object-cover" sizes="240px" />
                {img.isPrimary && (
                  <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[10px] font-medium text-ink">
                    Portada
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={pending || index === 0}
                    className="rounded border border-line px-1.5 py-0.5 disabled:opacity-40" aria-label="Subir">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={pending || index === ordered.length - 1}
                    className="rounded border border-line px-1.5 py-0.5 disabled:opacity-40" aria-label="Bajar">↓</button>
                </div>
                <div className="flex gap-2">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => run(() => setPrimaryImage(propertyId, img.id))}
                      disabled={pending} className="text-gold-deep hover:underline">Portada</button>
                  )}
                  <button type="button" onClick={() => run(() => deleteImage(img.id))}
                    disabled={pending} className="text-red-600 hover:underline">Borrar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/admin/ImageManager.tsx
git commit -m "feat(galería): ImageManager (subir, reordenar, portada, borrar)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.3: Conectar `ImageManager` en la página de edición + galería pública

**Files:**
- Modify: `app/admin/(dash)/propiedades/[id]/editar/page.tsx`
- Modify: `app/(public)/propiedades/[id]/page.tsx`

**Interfaces:**
- Consumes: `ImageManager`.

- [ ] **Step 1: Cargar imágenes y renderizar `ImageManager` en la página de edición**

En `.../[id]/editar/page.tsx`, cambiar la consulta a incluir imágenes y renderizar el manager. Reemplazar el `findUnique` y el comentario placeholder:

```tsx
import { ImageManager } from "@/components/admin/ImageManager"
// ...
  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  })
  if (!property) notFound()
// ... (values igual que antes) ...
      <PropertyForm mode="edit" property={values} />
      <ImageManager
        propertyId={property.id}
        images={property.images.map((i) => ({
          id: i.id,
          url: i.url,
          isPrimary: i.isPrimary,
          order: i.order,
        }))}
      />
```

- [ ] **Step 2: Mostrar la galería en el detalle público**

En `app/(public)/propiedades/[id]/page.tsx`, la propiedad se obtiene con `getPropertyById`. Verificar en `lib/queries.ts` si `getPropertyById` incluye `images`; si NO, modificarlo para incluirlas ordenadas:

En `lib/queries.ts`, en `getPropertyById`, añadir a la query de Prisma:

```ts
    include: { images: { orderBy: { order: "asc" } } },
```

Luego, en `app/(public)/propiedades/[id]/page.tsx`, tras la imagen principal, renderizar miniaturas si hay más de una:

```tsx
{property.images && property.images.length > 1 && (
  <div className="mt-4 grid grid-cols-4 gap-2">
    {property.images.map((img: { id: string; url: string }) => (
      <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-sand">
        <Image src={img.url} alt="" fill className="object-cover" sizes="120px" />
      </div>
    ))}
  </div>
)}
```

> Si `getPropertyById` tiene un tipo de retorno explícito, actualizarlo para incluir `images: { id: string; url: string; isPrimary: boolean; order: number }[]`. Si es inferido de Prisma, no hace falta.

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: build OK, sin errores de tipos.

- [ ] **Step 4: Verificación manual (dev)**

Con `npm run dev`: editar una propiedad, subir 2–3 imágenes, marcar otra como portada, reordenar, borrar una. Confirmar en el detalle público (`/propiedades/<id>`) que la portada y las miniaturas reflejan los cambios.

> Nota: la subida real al Blob en `dev` requiere `BLOB_READ_WRITE_TOKEN` en `.env`. Sin token, la subida fallará con error mostrado en el `ImageManager` (comportamiento esperado).

- [ ] **Step 5: Commit**

```bash
git add "app/admin/(dash)/propiedades/[id]/editar/page.tsx" "app/(public)/propiedades/[id]/page.tsx" lib/queries.ts
git commit -m "feat(galería): manager en edición + miniaturas en el detalle público

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 5 — Apartado Configuración: shell de tabs

### Task 5.1: Layout de Configuración con tabs + redirección + nav

**Files:**
- Create: `app/admin/(dash)/configuracion/layout.tsx`
- Create: `app/admin/(dash)/configuracion/page.tsx`
- Create: `components/admin/ConfigTabs.tsx`
- Modify: `components/admin/AdminNav.tsx`

**Interfaces:**
- Produces: layout con barra de tabs (Integraciones/General/Usuarios) y redirección de `/admin/configuracion` a `/admin/configuracion/integraciones`.

- [ ] **Step 1: Crear `components/admin/ConfigTabs.tsx` (client, resalta tab activa)**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/admin/configuracion/integraciones", label: "Integraciones" },
  { href: "/admin/configuracion/general", label: "General" },
  { href: "/admin/configuracion/usuarios", label: "Usuarios" },
]

export function ConfigTabs() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex gap-1 border-b border-line">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/")
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active
                ? "border-gold-deep font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Crear el layout**

```tsx
// app/admin/(dash)/configuracion/layout.tsx
import { ConfigTabs } from "@/components/admin/ConfigTabs"

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-8">
      <h1 className="mb-4 font-display text-2xl text-ink">Configuración</h1>
      <ConfigTabs />
      {children}
    </section>
  )
}
```

- [ ] **Step 3: Crear la redirección de índice**

```tsx
// app/admin/(dash)/configuracion/page.tsx
import { redirect } from "next/navigation"

export default function ConfigIndex() {
  redirect("/admin/configuracion/integraciones")
}
```

- [ ] **Step 4: Añadir "Configuración" al `NAV` de `AdminNav.tsx`**

En el array `NAV` de `components/admin/AdminNav.tsx`, añadir tras "Alertas":

```ts
  { href: "/admin/configuracion", label: "Configuración" },
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: rutas `/admin/configuracion` y (por ahora) redirección; el build puede advertir que faltan las páginas hijas hasta la Fase 6/7. Para evitar 404 en este commit, crear placeholders mínimos NO es necesario porque la Task 6.x/7.x llegan después; si se ejecuta el plan en orden, `/integraciones` se crea en Task 5.2 (siguiente). Continuar.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/(dash)/configuracion/layout.tsx" "app/admin/(dash)/configuracion/page.tsx" components/admin/ConfigTabs.tsx components/admin/AdminNav.tsx
git commit -m "feat(config): shell de Configuración con tabs + entrada en el nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5.2: Tab Integraciones (lectura + guardado)

**Files:**
- Create: `lib/integration-actions.ts`
- Create: `components/admin/IntegrationCard.tsx`
- Create: `app/admin/(dash)/configuracion/integraciones/page.tsx`

**Interfaces:**
- Consumes: `CHANNELS`, `getChannel` de `@/lib/integrations`; `encryptJSON`, `maskSecret` de `@/lib/crypto`; `prisma`; `getSessionUser`.
- Produces:
  - `saveIntegration(channel: string, _prev: IntegrationResult | null, formData: FormData): Promise<IntegrationResult>` con `type IntegrationResult = { ok: true } | { ok: false; error: string }`.
  - `getIntegrationStatuses(): Promise<Record<string, { status: string; enabled: boolean; masked: Record<string, string> }>>`

- [ ] **Step 1: Implementar `lib/integration-actions.ts`**

```ts
// lib/integration-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { encryptJSON, decryptJSON, maskSecret } from "@/lib/crypto"
import { getChannel } from "@/lib/integrations"

export type IntegrationResult = { ok: true } | { ok: false; error: string }

export async function saveIntegration(
  channel: string,
  _prev: IntegrationResult | null,
  formData: FormData,
): Promise<IntegrationResult> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false, error: "No autorizado." }

  const def = getChannel(channel)
  if (!def) return { ok: false, error: "Canal desconocido." }

  const config: Record<string, string> = {}
  for (const field of def.fields) {
    const value = String(formData.get(field.name) ?? "").trim()
    if (value) config[field.name] = value
  }

  const enabled = formData.get("enabled") === "on"
  const encrypted = encryptJSON(config)

  await prisma.integration.upsert({
    where: { channel },
    create: { channel, config: encrypted, enabled, status: "configured" },
    update: { config: encrypted, enabled, status: "configured" },
  })

  revalidatePath("/admin/configuracion/integraciones")
  return { ok: true }
}

// Devuelve, por canal, estado y valores enmascarados (nunca en claro al cliente).
export async function getIntegrationStatuses(): Promise<
  Record<string, { status: string; enabled: boolean; masked: Record<string, string> }>
> {
  const rows = await prisma.integration.findMany()
  const out: Record<string, { status: string; enabled: boolean; masked: Record<string, string> }> = {}
  for (const row of rows) {
    const masked: Record<string, string> = {}
    if (row.config) {
      try {
        const cfg = decryptJSON<Record<string, string>>(row.config)
        for (const [k, v] of Object.entries(cfg)) masked[k] = maskSecret(v)
      } catch {
        // config corrupta o clave cambiada: se ignora el enmascarado
      }
    }
    out[row.channel] = { status: row.status, enabled: row.enabled, masked }
  }
  return out
}
```

- [ ] **Step 2: Implementar `components/admin/IntegrationCard.tsx`**

```tsx
// components/admin/IntegrationCard.tsx
"use client"

import { useActionState } from "react"
import {
  saveIntegration,
  type IntegrationResult,
} from "@/lib/integration-actions"
import type { ChannelDef } from "@/lib/integrations"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

export function IntegrationCard({
  def,
  state: current,
}: {
  def: ChannelDef
  state?: { status: string; enabled: boolean; masked: Record<string, string> }
}) {
  const boundAction = (prev: IntegrationResult | null, fd: FormData) =>
    saveIntegration(def.channel, prev, fd)
  const [state, action, pending] = useActionState<IntegrationResult | null, FormData>(
    boundAction,
    null,
  )
  const configured = current?.status === "configured"

  return (
    <form action={action} className="rounded-2xl border border-line bg-paper p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-ink">{def.name}</h3>
          <p className="text-xs text-muted">{def.description}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            configured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {configured ? "Configurado" : "Sin configurar"}
        </span>
      </div>

      <div className="grid gap-3">
        {def.fields.map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`${def.channel}-${f.name}`}>
              {f.label}
            </label>
            <input
              id={`${def.channel}-${f.name}`}
              name={f.name}
              type={f.type === "password" ? "password" : "text"}
              className={fieldClass}
              placeholder={current?.masked?.[f.name] ?? f.placeholder ?? ""}
            />
          </div>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="enabled" defaultChecked={current?.enabled} />
        Activar canal
      </label>

      {state && !state.ok && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="mt-3 text-sm text-green-700">Guardado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Implementar la página del tab**

```tsx
// app/admin/(dash)/configuracion/integraciones/page.tsx
import { CHANNELS } from "@/lib/integrations"
import { getIntegrationStatuses } from "@/lib/integration-actions"
import { IntegrationCard } from "@/components/admin/IntegrationCard"

export const dynamic = "force-dynamic"

export default async function IntegracionesPage() {
  const statuses = await getIntegrationStatuses()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CHANNELS.map((def) => (
        <IntegrationCard key={def.channel} def={def} state={statuses[def.channel]} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: ruta `ƒ /admin/configuracion/integraciones`.

- [ ] **Step 5: Verificación manual (dev)**

Guardar credenciales de prueba en un canal. Recargar: el badge pasa a "Configurado" y los placeholders muestran valores enmascarados (`••••…`). Confirmar en la BD que `Integration.config` NO contiene el texto en claro (`npx prisma studio` o consulta).

- [ ] **Step 6: Commit**

```bash
git add lib/integration-actions.ts components/admin/IntegrationCard.tsx "app/admin/(dash)/configuracion/integraciones/page.tsx"
git commit -m "feat(config): tab Integraciones con guardado cifrado y enmascarado

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 6 — Tab General / Negocio

### Task 6.1: `lib/settings.ts` + `lib/settings-actions.ts`

**Files:**
- Create: `lib/settings.ts`
- Create: `lib/settings-actions.ts`

**Interfaces:**
- Produces:
  - `SETTING_KEYS: { name: string; label: string; type: "text" | "email" | "tel" | "url" }[]`
  - `getSettings(): Promise<Record<string, string>>`
  - `saveSettings(_prev: SettingsResult | null, formData: FormData): Promise<SettingsResult>` con `type SettingsResult = { ok: true } | { ok: false; error: string }`.

- [ ] **Step 1: Implementar `lib/settings.ts` (definición de claves + lectura)**

```ts
// lib/settings.ts
import { prisma } from "@/lib/db"

export const SETTING_KEYS = [
  { name: "businessName", label: "Nombre del negocio", type: "text" as const },
  { name: "contactEmail", label: "Email de contacto", type: "email" as const },
  { name: "phone", label: "Teléfono", type: "tel" as const },
  { name: "logoUrl", label: "Logo (URL)", type: "url" as const },
]

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}
```

- [ ] **Step 2: Implementar `lib/settings-actions.ts`**

```ts
// lib/settings-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { SETTING_KEYS } from "@/lib/settings"

export type SettingsResult = { ok: true } | { ok: false; error: string }

export async function saveSettings(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false, error: "No autorizado." }

  await prisma.$transaction(
    SETTING_KEYS.map((k) => {
      const value = String(formData.get(k.name) ?? "").trim()
      return prisma.setting.upsert({
        where: { key: k.name },
        create: { key: k.name, value },
        update: { value },
      })
    }),
  )

  revalidatePath("/admin/configuracion/general")
  return { ok: true }
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add lib/settings.ts lib/settings-actions.ts
git commit -m "feat(config): settings de negocio (lectura + guardado, solo admin)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.2: Página del tab General

**Files:**
- Create: `components/admin/SettingsForm.tsx`
- Create: `app/admin/(dash)/configuracion/general/page.tsx`

**Interfaces:**
- Consumes: `SETTING_KEYS`, `getSettings`, `saveSettings`.

- [ ] **Step 1: Implementar `components/admin/SettingsForm.tsx`**

```tsx
// components/admin/SettingsForm.tsx
"use client"

import { useActionState } from "react"
import { saveSettings, type SettingsResult } from "@/lib/settings-actions"
import { SETTING_KEYS } from "@/lib/settings"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep"

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<SettingsResult | null, FormData>(
    saveSettings,
    null,
  )
  return (
    <form action={action} className="grid max-w-lg gap-4 rounded-2xl border border-line bg-paper p-6">
      {SETTING_KEYS.map((k) => (
        <div key={k.name}>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted" htmlFor={k.name}>
            {k.label}
          </label>
          <input id={k.name} name={k.name} type={k.type} defaultValue={values[k.name] ?? ""} className={fieldClass} />
        </div>
      ))}
      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-green-700">Guardado.</p>}
      <button type="submit" disabled={pending}
        className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Implementar la página**

```tsx
// app/admin/(dash)/configuracion/general/page.tsx
import { getSettings } from "@/lib/settings"
import { SettingsForm } from "@/components/admin/SettingsForm"

export const dynamic = "force-dynamic"

export default async function GeneralPage() {
  const values = await getSettings()
  return <SettingsForm values={values} />
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: ruta `ƒ /admin/configuracion/general`.

- [ ] **Step 4: Commit**

```bash
git add components/admin/SettingsForm.tsx "app/admin/(dash)/configuracion/general/page.tsx"
git commit -m "feat(config): tab General con datos del negocio

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 7 — Tab Usuarios / Equipo

### Task 7.1: `lib/user-actions.ts`

**Files:**
- Create: `lib/user-actions.ts`

**Interfaces:**
- Consumes: `prisma`, `getSessionUser`, `bcrypt`, `revalidatePath`.
- Produces (todas requieren admin; devuelven `UserResult = { ok: true } | { ok: false; error: string }`):
  - `createUser(_prev: UserResult | null, formData: FormData): Promise<UserResult>`
  - `updateUserRole(userId: string, role: string): Promise<UserResult>`
  - `resetUserPassword(userId: string, newPassword: string): Promise<UserResult>`

- [ ] **Step 1: Implementar `lib/user-actions.ts`**

```ts
// lib/user-actions.ts
"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export type UserResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  return !!user && user.role === "admin"
}

export async function createUser(
  _prev: UserResult | null,
  formData: FormData,
): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "agent") === "admin" ? "admin" : "agent"

  if (!name || !email) return { ok: false, error: "Nombre y email son obligatorios." }
  if (password.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return { ok: false, error: "Ya existe un usuario con ese email." }

  await prisma.user.create({
    data: { name, email, role, password: await bcrypt.hash(password, 10) },
  })
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}

export async function updateUserRole(userId: string, role: string): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  const safeRole = role === "admin" ? "admin" : "agent"
  await prisma.user.update({ where: { id: userId }, data: { role: safeRole } })
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  if (newPassword.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }
  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 10) },
  })
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/user-actions.ts
git commit -m "feat(config): acciones de usuarios (crear, cambiar rol, resetear contraseña)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7.2: Página del tab Usuarios

**Files:**
- Create: `components/admin/UsersManager.tsx`
- Create: `app/admin/(dash)/configuracion/usuarios/page.tsx`

**Interfaces:**
- Consumes: `createUser`, `updateUserRole`, `resetUserPassword`; `prisma`; `getSessionUser`.

- [ ] **Step 1: Implementar `components/admin/UsersManager.tsx`**

```tsx
// components/admin/UsersManager.tsx
"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createUser,
  updateUserRole,
  resetUserPassword,
  type UserResult,
} from "@/lib/user-actions"

type Row = { id: string; name: string; email: string; role: string }
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

export function UsersManager({ users }: { users: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rowError, setRowError] = useState<string | null>(null)
  const [state, action, creating] = useActionState<UserResult | null, FormData>(
    async (prev: UserResult | null, fd: FormData) => {
      const res = await createUser(prev, fd)
      if (res.ok) router.refresh()
      return res
    },
    null,
  )

  function run(fn: () => Promise<UserResult>) {
    setRowError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setRowError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="mb-3 font-medium text-ink">Usuarios</h2>
        {rowError && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{rowError}</p>}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-ink">{u.name}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  onChange={(e) => run(() => updateUserRole(u.id, e.target.value))}
                  className="rounded-lg border border-line bg-paper px-2 py-1 text-sm"
                >
                  <option value="admin">admin</option>
                  <option value="agent">agent</option>
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const pwd = window.prompt("Nueva contraseña (mín. 8 caracteres):")
                    if (pwd) run(() => resetUserPassword(u.id, pwd))
                  }}
                  className="text-sm text-gold-deep hover:underline"
                >
                  Resetear contraseña
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 font-medium text-ink">Nuevo usuario</h2>
        <form action={action} className="grid max-w-lg gap-3 rounded-2xl border border-line bg-paper p-6">
          <input name="name" placeholder="Nombre" className={fieldClass} required />
          <input name="email" type="email" placeholder="email@dominio.com" className={fieldClass} required />
          <input name="password" type="password" placeholder="Contraseña (mín. 8)" className={fieldClass} required />
          <select name="role" defaultValue="agent" className={fieldClass}>
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
          {state && !state.ok && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          {state?.ok && <p className="text-sm text-green-700">Usuario creado.</p>}
          <button type="submit" disabled={creating}
            className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
            {creating ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  )
}
```

> **Nota:** `window.prompt` bloquea; es aceptable para un panel admin interno en esta etapa (YAGNI vs. un modal). No usa dialogs del navegador que rompan la automatización porque esto es UI de producto, no del entorno de pruebas del asistente.

- [ ] **Step 2: Implementar la página (gate de rol admin)**

```tsx
// app/admin/(dash)/configuracion/usuarios/page.tsx
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { UsersManager } from "@/components/admin/UsersManager"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const session = await getSessionUser()
  if (!session || session.role !== "admin") {
    return <p className="text-sm text-muted">Solo un administrador puede gestionar usuarios.</p>
  }
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  })
  return <UsersManager users={users} />
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: ruta `ƒ /admin/configuracion/usuarios`.

- [ ] **Step 4: Verificación manual (dev)**

Como admin: crear un usuario `agent`, cambiar su rol a `admin`, resetear su contraseña. Confirmar que un usuario no-admin ve el mensaje de bloqueo.

- [ ] **Step 5: Commit**

```bash
git add components/admin/UsersManager.tsx "app/admin/(dash)/configuracion/usuarios/page.tsx"
git commit -m "feat(config): tab Usuarios (listar, crear, rol, reset password)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Fase 8 — Verificación final y despliegue

### Task 8.1: Suite completa + build

**Files:** —

- [ ] **Step 1: Ejecutar toda la suite de tests**

Run: `npm test`
Expected: PASS — incluye `crypto`, `gallery`, `integrations` (+ los tests previos `valuation`, `channels`, `alerts`, `scoring`).

- [ ] **Step 2: Build de producción local**

Run: `npm run build`
Expected: build OK; rutas nuevas presentes: `/admin/propiedades/[id]/editar`, `/admin/configuracion`, `/admin/configuracion/integraciones`, `/admin/configuracion/general`, `/admin/configuracion/usuarios`, `/api/blob/upload`.

- [ ] **Step 3: Commit (si hubo ajustes)**

```bash
git add -A
git commit -m "chore: verificación final de tests y build" || echo "nada que commitear"
```

### Task 8.2: Migrar Neon + env en Vercel + deploy

> Pasos operativos (no de código). El ejecutor los realiza o los delega al usuario.

- [ ] **Step 1: Añadir env en Vercel (Production/Preview/Development):**
  - `APP_ENCRYPTION_KEY` = valor de `openssl rand -hex 32` (el MISMO en los 3 entornos).
  - Confirmar `BLOB_READ_WRITE_TOKEN` (creado por el store Blob).

- [ ] **Step 2: Crear las tablas nuevas en Neon:**

```bash
DATABASE_URL="<Neon UNPOOLED>" npm run pg:push
```
Expected: `Your database is now in sync` (crea `PropertyImage`, `Integration`, `Setting`).

- [ ] **Step 3: Push a `main` y esperar el deploy de Vercel.**

```bash
git push
```

- [ ] **Step 4: Verificación en vivo (producción):**
  - `/admin/propiedades` → Editar una propiedad, subir 2–3 imágenes, marcar portada, reordenar, borrar. Ver la galería en `/propiedades/<id>`.
  - `/admin/configuracion/integraciones` → guardar credenciales de un canal; recargar y confirmar badge "Configurado" + valores enmascarados.
  - `/admin/configuracion/general` → guardar datos del negocio.
  - `/admin/configuracion/usuarios` → crear un usuario y cambiar rol.

---

## Self-Review (cobertura del spec)

- **§3 Modelo de datos** → Task 0.2 (modelos + relación); portada denormalizada sincronizada en Task 4.1 (`syncCover`). Backfill opcional: NO se implementó como script separado (decisión del spec: no bloqueante); la portada de las 15 propiedades del seed sigue funcionando por su `photoUrl` existente y se recalcula si se sube/edita alguna imagen. **Cubierto.**
- **§4 Criptografía** → Task 1.1 (`lib/crypto.ts` + tests). **Cubierto.**
- **§5 Registro de canales (6 canales)** → Task 1.3 (`lib/integrations.ts` + tests). **Cubierto.**
- **§6 UI Configuración (tabs Integraciones/General/Usuarios + nav + gates de rol)** → Tasks 5.1, 5.2, 6.x, 7.x. Gates de rol en cada server action y en la página de Usuarios. **Cubierto.**
- **§7 Edición de propiedades + ImageManager** → Tasks 3.x (edición), 4.x (galería). **Cubierto.**
- **§8 Subida a Vercel Blob (route handler firmado + cliente + organización por prefijo + del)** → Tasks 2.1, 2.2, borrado en 4.1. **Cubierto.**
- **§9 Contratos de server actions** → Tasks 3.1, 4.1, 5.2, 6.1, 7.1. **Cubierto.**
- **§10 Env vars** → Task 0.1 + Task 8.2. **Cubierto.**
- **§11 Testing** → crypto (1.1), gallery/portada-orden (1.2), integrations (1.3). Nota: los tests de acciones con BD/`next` se sustituyen por tests de los helpers puros que contienen la lógica delicada, para respetar el setup vitest (`node`, solo `lib/**`). La lógica de portada/orden vive en `lib/gallery.ts` y está testeada. **Cubierto con ajuste documentado.**
- **§12 Despliegue** → Task 8.2. **Cubierto.**
- **§13 Riesgos** → límite 4.5 MB (subida directa, Task 2), gate del endpoint (Task 2.1), sync portada centralizado + testeado (Tasks 1.2/4.1). **Cubierto.**

**Consistencia de tipos:** `CreatePropertyResult` reusado (3.1/3.2); `ActionResult`/`IntegrationResult`/`SettingsResult`/`UserResult` definidos y consumidos coherentemente; helpers de `lib/gallery` con firmas idénticas entre definición (1.2) y uso (4.1).

**Placeholders:** sin `TODO`/`TBD` pendientes; el único "placeholder" intencional es el comentario en la página de edición reemplazado en Task 4.3.
