# Despliegue en Vercel + Neon (PostgreSQL)

Esta app está lista para desplegar en **Vercel** con base de datos **Neon (PostgreSQL)**.
Localmente sigue funcionando con SQLite (demo offline); en producción usa Postgres.
El proveedor se detecta automáticamente por el prefijo de `DATABASE_URL` — no hay que
tocar código.

> **Arquitectura de la migración:** hay un único schema fuente (`prisma/schema.prisma`,
> SQLite). El script `scripts/gen-pg.mjs` deriva mecánicamente la variante PostgreSQL
> (`prisma/schema.pg.prisma`) cambiando solo el proveedor — los modelos no se duplican.
> El `buildCommand` de Vercel (`npm run vercel-build`) genera el cliente Postgres y compila.

---

## Parte A — Publicar en Vercel

1. **Instala la CLI de Vercel** (si no la tienes):
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión** (esto lo haces tú — no introduzco tus credenciales):
   ```
   ! vercel login
   ```
   (Escribe eso en el chat con el prefijo `!` para ejecutarlo en esta sesión, o hazlo en tu terminal.)

3. **Genera un secreto de sesión** para el panel:
   ```bash
   openssl rand -hex 32
   ```
   Guarda el valor para el paso siguiente.

4. **Primer despliegue** (crea el proyecto en Vercel):
   ```bash
   vercel
   ```
   Acepta los valores por defecto. Vercel detecta Next.js y usa `vercel-build` (ver `vercel.json`).

5. **Configura las variables de entorno** en el panel de Vercel
   (Project → Settings → Environment Variables), o por CLI:
   ```bash
   vercel env add DATABASE_URL          # pega la URL de Neon (ver Parte B)
   vercel env add SESSION_SECRET        # el valor de openssl del paso 3
   vercel env add ANTHROPIC_API_KEY     # (opcional) para valuación con IA real
   ```

6. **Despliegue a producción:**
   ```bash
   vercel --prod
   ```
   La app quedará visible en tu URL `*.vercel.app`.

> El build de Vercel **no** necesita la base de datos poblada (las páginas que leen datos
> son dinámicas), así que compila aunque Neon esté aún vacío. Los datos se cargan en la Parte B.

---

## Parte B — Base de datos Neon (una vez la app esté visible)

1. Crea un proyecto en **https://neon.tech** y copia la **connection string "pooled"**
   (tiene `-pooler` en el host). Se ve así:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require
   ```

2. **Ponla como `DATABASE_URL`** en Vercel (paso A.5) y **redeploy** (`vercel --prod`).

3. **Crea las tablas y carga los datos de ejemplo** en Neon, desde tu máquina, apuntando a esa URL:
   ```bash
   # crea el esquema en Neon
   DATABASE_URL="postgresql://...pooler...neon.tech/DB?sslmode=require" npm run pg:push

   # carga usuarios, propiedades, leads, etc.
   DATABASE_URL="postgresql://...pooler...neon.tech/DB?sslmode=require" npm run pg:seed
   ```
   Credenciales demo tras el seed: `admin@floridianfirst.com` / `demo1234`.

4. Abre tu URL de Vercel — la app ya está viva con datos en Neon.

### Mantenimiento (cuando cambie el modelo de datos)

Edita `prisma/schema.prisma` (fuente única) y sincroniza Neon:
```bash
DATABASE_URL="postgresql://...neon.tech/DB?sslmode=require" npm run pg:push
```
`pg:push` usa `prisma db push` (sincroniza el esquema sin ficheros de migración — simple de
mantener para esta app). Si más adelante quieres historial de migraciones formal, se puede
cambiar a `prisma migrate` sobre el schema derivado.

> **Volver a SQLite en local:** `npm run pg:*` regenera el cliente Prisma para Postgres.
> Para volver al modo demo local con SQLite, ejecuta `npx prisma generate` (restaura el
> cliente SQLite) y usa `DATABASE_URL="file:./dev.db"`.

---

## Checklist rápido

- [ ] `vercel login` (tú)
- [ ] `vercel` → primer deploy
- [ ] Crear proyecto Neon y copiar la URL pooled
- [ ] `DATABASE_URL`, `SESSION_SECRET` (y opcional `ANTHROPIC_API_KEY`) en Vercel
- [ ] `npm run pg:push` y `npm run pg:seed` apuntando a Neon
- [ ] `vercel --prod`
