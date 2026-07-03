# LeadEngine — Floridian First Realty

Plataforma de captación y gestión de leads para una inmobiliaria boutique de Coral Gables.
Web pública que convierte visitantes en leads + panel interno (CRM) donde el equipo los
califica, prioriza y cierra. **Ningún interesado se pierde.**

> Esta es la **demo v1**: las áreas funcionales están vivas con datos de ejemplo realistas.
> Integraciones externas (IDX/MLS, WhatsApp real, IA) se simulan; la arquitectura queda lista
> para conectarlas en fase 2. Ver `docs/superpowers/specs/2026-07-03-leadengine-demo-design.md`.

## Puesta en marcha

```bash
npm install          # instala dependencias (regenera el cliente Prisma en postinstall)
npx prisma migrate dev   # crea la base de datos SQLite (dev.db)
npm run db:seed          # carga datos de ejemplo
npm run dev              # arranca en http://localhost:3000
```

Tests: `npm test` · Build de producción: `npm run build`

### Credenciales demo (panel `/admin`)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | `admin@floridianfirst.com` | `demo1234` |
| Agente | `agente1@floridianfirst.com` | `demo1234` |

## Qué incluye

**Web pública** (`/`): home, catálogo con filtros (`/propiedades`), ficha
(`/propiedades/[id]`), valuación imán de leads (`/valuacion`), mapa (`/mapa`),
contacto (`/contacto`). Cada formulario crea un lead calificado en el CRM.

**Panel interno** (`/admin`): dashboard, CRM de leads (lista + ficha con score,
estados, notas e historial), pipeline visual por etapas con importes, gestión de
propiedades, mapa interno, analítica (Recharts) y alertas inteligentes. Incluye un
botón de **captura omnicanal (demo)** para simular leads entrantes de WhatsApp/Instagram.

## Arquitectura

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — una sola app: web + panel + backend.
- **Prisma 7** + **SQLite** (migrable a Postgres sin reescribir la lógica).
- **Tailwind v4** + sistema de diseño "Coastal" (`tokens.css`). Fuentes Fraunces + Geist.
- **Leaflet + OpenStreetMap** (mapas sin clave API). **Recharts** (gráficas).
- Auth con cookie de sesión firmada (HMAC) + bcrypt; roles admin/agent.
- Lógica de negocio pura y testeada en `lib/`: `scoring`, `valuation`, `channels`, `alerts`.

## Estructura

```
app/(public)/     Web pública
app/admin/        Login + panel (grupo (dash) protegido)
components/site/   UI pública    components/admin/  UI del panel
lib/               Motores, queries, server actions, auth
prisma/            schema + seed
docs/superpowers/  Diseño (spec) y planes de implementación
```
