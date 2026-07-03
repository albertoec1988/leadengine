# Fase 2: Mapa guiado, Favoritas, Seed real, Mapa en listado/footer y Redes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir a la portada un mapa de Miami guiado por scroll que conecta hasta 10 propiedades favoritas (curadas desde el admin), reemplazar el seed demo por las 9 propiedades reales del cliente, añadir vista mapa al listado, mapa de la oficina y redes sociales al footer.

**Architecture:** `isFeatured/featuredOrder` en `Property` + server action admin para curar favoritas. La sección `MapJourney` (client) usa Leaflet no-interactivo + overlay SVG cuyo trazo se dibuja con ScrollTrigger scrub; la interpolación de cámara/segmentos vive en un helper puro testeable (`lib/journey.ts`). El seed se reescribe con datos reales del scrape. El resto son integraciones pequeñas sobre componentes existentes (`PropertyMap`, `SiteFooter`, `SETTING_KEYS`).

**Tech Stack:** Next.js 16, React 19, Prisma 7, Leaflet (ya instalado), GSAP/ScrollTrigger (ya instalado), vitest, sharp (para comprimir fotos).

**Spec:** `docs/superpowers/specs/2026-07-03-fase2-mapa-favoritas-seed-real-design.md`

## Global Constraints

- Portada en INGLÉS, identidad FFR (navy `#00305B`, Montserrat, tokens `ffr-*`). Panel admin en español.
- Efectos: gate central `useMotion()` (`enabled`/`heavyEnabled`); pesados solo desktop sin reduced-motion; **cero dead-scroll en fallback** (lección v1: altura condicional).
- Contenido server-rendered siempre visible sin JS; Leaflet/GSAP solo mejoran.
- Mutaciones admin: gate `getSessionUser()?.role === "admin"` ANTES de tocar la BD; retorno tipado.
- Prisma: editar SOLO `prisma/schema.prisma`; el pg se deriva. Cliente vía `{ prisma }` de `@/lib/db`.
- Precios de las 9 propiedades reales NO están publicados → valores ilustrativos (comentario en el seed).
- Tests: vitest, node env, solo `lib/**/*.test.ts`; módulos testeados sin imports de `next`/`gsap`/`leaflet`.
- Solo `transform`/`opacity` en animaciones DOM; el trazado SVG usa `stroke-dashoffset` (barato).
- Commits terminan con: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Favoritas — schema, server action y estrella en el admin

**Files:**
- Modify: `prisma/schema.prisma` (model Property)
- Modify: `lib/property-actions.ts` (nueva action)
- Create: `components/admin/FeaturedToggle.tsx`
- Modify: `app/admin/(dash)/propiedades/page.tsx` (columna estrella)

**Interfaces:**
- Produces: campos `Property.isFeatured: Boolean @default(false)`, `Property.featuredOrder: Int @default(0)`; action `toggleFeatured(id: string): Promise<{ ok: boolean }>`; componente `FeaturedToggle({ id, isFeatured })`.

- [ ] **Step 1: Añadir campos al modelo `Property`** en `prisma/schema.prisma`, junto a `status`:

```prisma
  isFeatured    Boolean       @default(false) // favorita: entra en el recorrido del mapa de la portada
  featuredOrder Int           @default(0)     // orden dentro del recorrido
```

- [ ] **Step 2: Regenerar y aplicar local**

Run: `npx prisma generate && npx prisma db push`
Expected: `in sync`. Run también: `node scripts/gen-pg.mjs && npx prisma validate --schema prisma/schema.pg.prisma` → `is valid`.

- [ ] **Step 3: Añadir `toggleFeatured` al final de `lib/property-actions.ts`** (los imports `prisma`, `revalidatePath`, `getSessionUser` ya existen):

```ts
export async function toggleFeatured(id: string): Promise<{ ok: boolean }> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false }

  const prop = await prisma.property.findUnique({ where: { id }, select: { isFeatured: true } })
  if (!prop) return { ok: false }

  if (prop.isFeatured) {
    await prisma.property.update({ where: { id }, data: { isFeatured: false } })
  } else {
    const max = await prisma.property.aggregate({ _max: { featuredOrder: true } })
    await prisma.property.update({
      where: { id },
      data: { isFeatured: true, featuredOrder: (max._max.featuredOrder ?? 0) + 1 },
    })
  }

  revalidatePath("/admin/propiedades")
  revalidatePath("/")
  return { ok: true }
}
```

- [ ] **Step 4: Crear `components/admin/FeaturedToggle.tsx`**

```tsx
"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleFeatured } from "@/lib/property-actions"

export function FeaturedToggle({ id, isFeatured }: { id: string; isFeatured: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={isFeatured ? "Quitar de favoritas" : "Marcar como favorita"}
      aria-pressed={isFeatured}
      title={isFeatured ? "Favorita (en el mapa de la portada)" : "Marcar como favorita"}
      onClick={() =>
        startTransition(async () => {
          await toggleFeatured(id)
          router.refresh()
        })
      }
      className={`text-lg leading-none transition-transform hover:scale-110 disabled:opacity-50 ${
        isFeatured ? "text-gold" : "text-line hover:text-gold-deep"
      }`}
    >
      {isFeatured ? "★" : "☆"}
    </button>
  )
}
```

- [ ] **Step 5: Columna estrella en `app/admin/(dash)/propiedades/page.tsx`**

Importar `FeaturedToggle`. En el `<thead>`, añadir una columna vacía al PRINCIPIO (`<th className="w-10 px-2 py-3"></th>`); en cada fila, como primera celda:

```tsx
<td className="px-2 py-3 text-center">
  <FeaturedToggle id={p.id} isFeatured={p.isFeatured} />
</td>
```

(`getMapProperties()` hace `findMany` sin `select`, así que `p.isFeatured` ya llega tipado tras el `prisma generate` del Step 2.)

- [ ] **Step 6: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma lib/property-actions.ts components/admin/FeaturedToggle.tsx "app/admin/(dash)/propiedades/page.tsx"
git commit -m "feat(favoritas): flag isFeatured con orden, action admin y estrella en el listado

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Seed real — 9 propiedades del cliente con fotos

**Files:**
- Create: `public/ffr/listings/listado-0{1..9}.png` (copiadas/comprimidas)
- Modify: `prisma/seed.ts` (bloque de propiedades)
- Modify: `lib/queries.ts:62` (ZONES)
- Modify: `lib/property-actions.ts` (ZONE_COORDS + zonas nuevas)
- Modify: `components/admin/PropertyForm.tsx` (array ZONES local)

**Interfaces:**
- Produces: BD con exactamente 9 propiedades reales, todas `isFeatured: true` con `featuredOrder` 0..8, cada una con su `PropertyImage` primaria; `ZONES = ["Coral Gables", "South Miami", "Kendall", "Miami", "Fort Lauderdale"]`.

- [ ] **Step 1: Copiar y comprimir las fotos**

```bash
cd /home/albe/Projects/FFR
mkdir -p public/ffr/listings
node -e '
const sharp = require("sharp"); const fs = require("fs");
(async () => {
  for (let i = 1; i <= 9; i++) {
    const n = String(i).padStart(2, "0");
    const src = `docs/floridian-first-scrape/imagenes/internas/listado-${n}.png`;
    const out = `public/ffr/listings/listado-${n}.jpg`;
    await sharp(src).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    console.log(out, fs.statSync(out).size);
  }
})()'
ls -la public/ffr/listings/   # 9 archivos .jpg, cada uno ≤ ~400KB
```

(Se convierten a JPEG — mejor peso; el seed referencia `.jpg`.)

- [ ] **Step 2: Ampliar zonas**

En `lib/queries.ts:62`: `export const ZONES = ["Coral Gables", "South Miami", "Kendall", "Miami", "Fort Lauderdale"] as const`
En `lib/property-actions.ts`, ampliar `ZONE_COORDS` con: `Miami: [25.7743, -80.2094], "Fort Lauderdale": [26.1224, -80.1373],`
En `components/admin/PropertyForm.tsx`, el array local `ZONES` pasa a los 5 valores.
Verificar con grep si `app/(public)/propiedades/page.tsx` u otros duplican la lista de zonas en un array local; si usan `ZONES` de `lib/queries`, nada que tocar.

- [ ] **Step 3: Reescribir el bloque de propiedades de `prisma/seed.ts`**

Reemplazar el bucle `for (let i = 0; i < 15; i++) {...}` (y su comentario `// propiedades`) por datos reales. Añadir ANTES de `async function main()` la tabla:

```ts
// Propiedades REALES del sitio del cliente (scrape 2026-07-03, /ffr-listings).
// Direcciones auténticas; coordenadas aproximadas (nivel manzana);
// PRECIOS ILUSTRATIVOS (no publicados en la web del cliente).
const REAL_LISTINGS = [
  { title: "1210 SW 91st Ave #1210", address: "1210 SW 91st Ave #1210, Miami, FL 33174", zone: "Miami", lat: 25.7601, lng: -80.3428, price: 465_000, beds: 3, baths: 2, sqft: 1480, photo: "/ffr/listings/listado-01.jpg" },
  { title: "Restaurant for Sale — E Las Olas Blvd", address: "E Las Olas Blvd, Fort Lauderdale, FL 33316", zone: "Fort Lauderdale", lat: 26.1195, lng: -80.1373, price: 495_000, beds: 0, baths: 2, sqft: 2600, photo: "/ffr/listings/listado-02.jpg" },
  { title: "Restaurant for Sale — Kendall", address: "Kendall, Miami, FL 33193", zone: "Kendall", lat: 25.6432, lng: -80.4370, price: 285_000, beds: 0, baths: 2, sqft: 1900, photo: "/ffr/listings/listado-03.jpg" },
  { title: "Restaurant for Sale — Miami", address: "Miami, FL 33135", zone: "Miami", lat: 25.7659, lng: -80.2352, price: 320_000, beds: 0, baths: 2, sqft: 2100, photo: "/ffr/listings/listado-04.jpg" },
  { title: "3101 Bayshore Dr #1505", address: "3101 Bayshore Dr #1505, Fort Lauderdale, FL 33304", zone: "Fort Lauderdale", lat: 26.1369, lng: -80.1042, price: 720_000, beds: 2, baths: 2, sqft: 1350, photo: "/ffr/listings/listado-05.jpg" },
  { title: "12415 SW 93rd Ct", address: "12415 SW 93rd Ct, Miami, FL 33176", zone: "Kendall", lat: 25.6528, lng: -80.3441, price: 685_000, beds: 4, baths: 3, sqft: 2240, photo: "/ffr/listings/listado-06.jpg" },
  { title: "1155 SW 6th St — 2nd Floor", address: "1155 SW 6th St #2nd Floor, Miami, FL 33130", zone: "Miami", lat: 25.7682, lng: -80.2148, price: 398_000, beds: 2, baths: 1, sqft: 1100, photo: "/ffr/listings/listado-07.jpg" },
  { title: "6161 SW 8th St #6161", address: "6161 SW 8th St #6161, Miami, FL 33144", zone: "Miami", lat: 25.7628, lng: -80.2946, price: 350_000, beds: 0, baths: 1, sqft: 1500, photo: "/ffr/listings/listado-08.jpg" },
  { title: "2800 SW 38th Ct", address: "2800 SW 38th Ct, Miami, FL 33134", zone: "Coral Gables", lat: 25.7491, lng: -80.2531, price: 890_000, beds: 4, baths: 3, sqft: 2450, photo: "/ffr/listings/listado-09.jpg" },
] as const
```

Y el bloque de creación (en el lugar del bucle demo):

```ts
  // propiedades (reales del cliente; todas favoritas para el recorrido del mapa)
  const properties = []
  for (let i = 0; i < REAL_LISTINGS.length; i++) {
    const r = REAL_LISTINGS[i]
    const p = await prisma.property.create({
      data: {
        title: r.title,
        price: r.price,
        zone: r.zone,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        status: "for_sale",
        bedrooms: r.beds,
        bathrooms: r.baths,
        areaSqft: r.sqft,
        photoUrl: r.photo,
        isFeatured: true,
        featuredOrder: i,
        images: {
          create: [{ url: r.photo, pathname: r.photo, order: 0, isPrimary: true }],
        },
      },
    })
    properties.push(p)
  }
```

El resto del seed (usuarios, leads, oportunidades, valuaciones, notificaciones) queda igual — ya referencia `properties` y `ZONES` locales del seed: actualizar la constante local `const ZONES = [...]` del seed a las 5 zonas y `ZONE_COORDS` local con las dos nuevas (mismos valores que en Step 2).

- [ ] **Step 4: Reseed local y verificar**

Run: `npx prisma db push && npm run db:seed`
Expected: `Seed completado…`. Verificar: `DATABASE_URL="file:./dev.db" npx tsx --eval "import { prisma } from './lib/db'; prisma.property.count().then(c => { console.log('props:', c); return prisma.propertyImage.count() }).then(ci => { console.log('images:', ci); return prisma.\$disconnect() })"` → `props: 9`, `images: 9`.

- [ ] **Step 5: Verificar build** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 6: Commit**

```bash
git add public/ffr/listings prisma/seed.ts lib/queries.ts lib/property-actions.ts components/admin/PropertyForm.tsx
git commit -m "feat(seed): 9 propiedades reales del cliente con fotos, zonas ampliadas y favoritas

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `lib/journey.ts` (TDD) — interpolación del recorrido

**Files:**
- Create: `lib/journey.ts`
- Test: `lib/journey.test.ts`

**Interfaces:**
- Produces:
  - `type LatLng = { lat: number; lng: number }`
  - `interpolateStops(stops: LatLng[], t: number): { index: number; lat: number; lng: number }` — posición de cámara en progreso t∈[0,1] (clamp), `index` = parada activa (redondeo del segmento).
  - `polylineLength(points: { x: number; y: number }[]): number` — longitud total en px.

- [ ] **Step 1: Test que falla**

```ts
// lib/journey.test.ts
import { describe, it, expect } from "vitest"
import { interpolateStops, polylineLength } from "@/lib/journey"

const A = { lat: 25.0, lng: -80.0 }
const B = { lat: 26.0, lng: -81.0 }
const C = { lat: 27.0, lng: -80.0 }

describe("interpolateStops", () => {
  it("clamps t and returns endpoints", () => {
    expect(interpolateStops([A, B], -0.5)).toEqual({ index: 0, lat: 25.0, lng: -80.0 })
    expect(interpolateStops([A, B], 1.5)).toEqual({ index: 1, lat: 26.0, lng: -81.0 })
  })

  it("interpolates linearly within a segment", () => {
    const mid = interpolateStops([A, B], 0.5)
    expect(mid.lat).toBeCloseTo(25.5)
    expect(mid.lng).toBeCloseTo(-80.5)
  })

  it("maps t across multiple segments and reports the nearest stop index", () => {
    // 3 paradas = 2 segmentos; t=0.75 está a mitad del segundo segmento
    const p = interpolateStops([A, B, C], 0.75)
    expect(p.lat).toBeCloseTo(26.5)
    expect(p.lng).toBeCloseTo(-80.5)
    expect(p.index).toBe(2) // ya más cerca de C
    expect(interpolateStops([A, B, C], 0.5).index).toBe(1)
  })

  it("handles single-stop journeys", () => {
    expect(interpolateStops([A], 0.7)).toEqual({ index: 0, lat: 25.0, lng: -80.0 })
  })
})

describe("polylineLength", () => {
  it("sums segment lengths", () => {
    expect(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 14 }])).toBeCloseTo(15)
  })
  it("returns 0 for fewer than 2 points", () => {
    expect(polylineLength([{ x: 1, y: 1 }])).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test -- lib/journey.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `lib/journey.ts`**

```ts
// lib/journey.ts
// Matemática pura del recorrido del mapa de la portada (testeable sin leaflet/gsap).

export type LatLng = { lat: number; lng: number }

// Posición de cámara para un progreso t (0..1) a lo largo de las paradas,
// con interpolación lineal por segmento. index = parada más cercana.
export function interpolateStops(
  stops: LatLng[],
  t: number,
): { index: number; lat: number; lng: number } {
  if (stops.length === 0) return { index: 0, lat: 0, lng: 0 }
  if (stops.length === 1) return { index: 0, lat: stops[0].lat, lng: stops[0].lng }

  const clamped = Math.min(1, Math.max(0, t))
  const segments = stops.length - 1
  const pos = clamped * segments
  const seg = Math.min(Math.floor(pos), segments - 1)
  const segT = pos - seg

  const a = stops[seg]
  const b = stops[seg + 1]
  return {
    index: Math.round(pos),
    lat: a.lat + (b.lat - a.lat) * segT,
    lng: a.lng + (b.lng - a.lng) * segT,
  }
}

// Longitud total de una polilínea en px de pantalla (para stroke-dashoffset).
export function polylineLength(points: { x: number; y: number }[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test -- lib/journey.test.ts` → PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/journey.ts lib/journey.test.ts
git commit -m "feat(journey): interpolación pura del recorrido del mapa (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Componente `MapJourney`

**Files:**
- Create: `components/site/home/MapJourney.tsx`

**Interfaces:**
- Consumes: `useMotion`, `RevealText`, `interpolateStops`/`polylineLength` de `@/lib/journey`, Leaflet dinámico (patrón de `components/site/PropertyMap.tsx`), gsap/ScrollTrigger.
- Produces: `MapJourney({ stops }: { stops: JourneyStop[] })` con `export type JourneyStop = { id: string; title: string; lat: number; lng: number; photoUrl: string; priceLabel: string; href: string }`.

- [ ] **Step 1: Implementar `components/site/home/MapJourney.tsx`**

```tsx
"use client"

// Recorrido guiado por scroll sobre un mapa de Miami: la cámara viaja entre
// las propiedades favoritas, un camino SVG se traza con el progreso y la
// tarjeta activa muestra la miniatura. Desktop: sección pinned con scrub.
// Móvil/reduced-motion: mapa estático encuadrando todo + fila de tarjetas
// (sin dead-scroll: la altura solo crece cuando hay scrub).

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import "leaflet/dist/leaflet.css"
import { useMotion } from "@/components/motion/MotionProvider"
import { RevealText } from "@/components/motion/RevealText"
import { interpolateStops, polylineLength } from "@/lib/journey"

export type JourneyStop = {
  id: string
  title: string
  lat: number
  lng: number
  photoUrl: string
  priceLabel: string
  href: string
}

const JOURNEY_ZOOM = 12

export function MapJourney({ stops }: { stops: JourneyStop[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPolylineElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<import("leaflet").CircleMarker[]>([])
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const { heavyEnabled } = useMotion()

  // Montar Leaflet una vez (no interactivo).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !mapElRef.current || mapRef.current) return
      const map = L.map(mapElRef.current, {
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        attributionControl: true,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)

      markersRef.current = stops.map((s, i) =>
        L.circleMarker([s.lat, s.lng], {
          radius: i === 0 ? 11 : 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#00305b",
          fillOpacity: 0.95,
        }).addTo(map),
      )

      if (stops.length > 1) {
        map.fitBounds(stops.map((s) => [s.lat, s.lng] as [number, number]), { padding: [48, 48] })
      } else {
        map.setView([stops[0].lat, stops[0].lng], JOURNEY_ZOOM)
      }
      mapRef.current = map
      // primer dibujo del camino
      drawPath(1)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Proyecta las paradas a px del contenedor y actualiza la polilínea.
  // progress 0..1 controla cuánto camino se ve (dashoffset).
  function drawPath(progress: number) {
    const map = mapRef.current
    const path = pathRef.current
    if (!map || !path) return
    const pts = stops.map((s) => map.latLngToContainerPoint([s.lat, s.lng]))
    path.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "))
    const total = polylineLength(pts)
    path.style.strokeDasharray = `${total}`
    path.style.strokeDashoffset = `${total * (1 - Math.min(1, Math.max(0, progress)))}`
  }

  // Scrub del recorrido (solo desktop con motion pesado).
  useGSAP(
    () => {
      if (!heavyEnabled || !rootRef.current || stops.length < 2) return
      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          const map = mapRef.current
          if (!map) return
          const cam = interpolateStops(stops, self.progress)
          map.setView([cam.lat, cam.lng], JOURNEY_ZOOM, { animate: false })
          drawPath(self.progress)
          if (cam.index !== activeRef.current) {
            activeRef.current = cam.index
            setActive(cam.index)
            markersRef.current.forEach((m, i) =>
              m.setStyle({ radius: i === cam.index ? 11 : 8, fillColor: i === cam.index ? "#0a4a86" : "#00305b" }),
            )
          }
        },
      })
      return () => st.kill()
    },
    { scope: rootRef, dependencies: [heavyEnabled, stops.length] },
  )

  if (stops.length < 2) return null
  const current = stops[Math.min(active, stops.length - 1)]

  return (
    <section ref={rootRef} className={`relative bg-white ${heavyEnabled ? "h-[300vh]" : ""}`}>
      <div className={heavyEnabled ? "sticky top-0 flex h-svh flex-col" : "flex flex-col"}>
        <div className="mx-auto w-full max-w-6xl px-5 pb-6 pt-16 text-center">
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            Explore our featured listings
          </RevealText>
          <p className="mt-3 text-sm text-ffr-slate">
            {heavyEnabled ? "Scroll to travel between our most desired properties." : "Our most desired properties across Miami."}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-6xl flex-1 px-5 pb-8">
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-line">
            <div ref={mapElRef} className="absolute inset-0 z-0" />
            <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-[500] h-full w-full">
              <polyline
                ref={pathRef}
                fill="none"
                stroke="#00305b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="0"
              />
            </svg>

            {/* Tarjeta activa (desktop scrub) */}
            {heavyEnabled && (
              <Link
                href={current.href}
                key={current.id}
                className="absolute bottom-5 left-5 z-[600] flex w-72 items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur transition-opacity duration-300"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={current.photoUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-montserrat text-sm font-bold text-ffr-navy">{current.title}</p>
                  <p className="text-xs text-ffr-slate">{current.priceLabel}</p>
                </div>
              </Link>
            )}
          </div>

          {/* Fila de tarjetas: contenido base siempre visible (y única UI en móvil/reduced) */}
          <div className={`mt-4 flex gap-3 overflow-x-auto pb-2 ${heavyEnabled ? "lg:hidden" : ""}`}>
            {stops.map((s, i) => (
              <Link
                key={s.id}
                href={s.href}
                className={`flex w-60 shrink-0 items-center gap-3 rounded-xl border p-3 ${
                  heavyEnabled && i === active ? "border-ffr-navy" : "border-line"
                }`}
              >
                <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={s.photoUrl} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-montserrat text-xs font-bold text-ffr-navy">{s.title}</p>
                  <p className="text-xs text-ffr-slate">{s.priceLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 3: Commit**

```bash
git add components/site/home/MapJourney.tsx
git commit -m "feat(portada): MapJourney — recorrido de favoritas guiado por scroll sobre Leaflet

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Integrar `MapJourney` en la portada

**Files:**
- Modify: `app/(public)/page.tsx`

**Interfaces:**
- Consumes: `MapJourney` + `JourneyStop`, `prisma`, `formatUSD` de `@/lib/format`.

- [ ] **Step 1: Modificar `app/(public)/page.tsx`**

Añadir imports:

```tsx
import { prisma } from "@/lib/db"
import { formatUSD } from "@/lib/format"
import { MapJourney, type JourneyStop } from "@/components/site/home/MapJourney"
```

La página vuelve a leer BD → añadir `export const dynamic = "force-dynamic"` (bajo la metadata) y convertir el componente en async:

```tsx
export default async function HomePage() {
  const featured = await prisma.property.findMany({
    where: { isFeatured: true, status: "for_sale" },
    orderBy: { featuredOrder: "asc" },
    take: 10,
  })
  const stops: JourneyStop[] = featured.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    photoUrl: p.photoUrl,
    priceLabel: formatUSD(p.price),
    href: `/propiedades/${p.id}`,
  }))

  return (
    <>
      <HeroCinematic />
      <BrandStatement />
      <ServiceCategories />
      {stops.length >= 2 && <MapJourney stops={stops} />}
      <HeartOfFFR />
      <Testimonials />
      <ValuationMagnet />
      <HappyClients />
      <Partnerships />
      <ConnectWithUs />
    </>
  )
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → `/` vuelve a `ƒ` (dinámica; esperado y documentado).

- [ ] **Step 3: Verificación manual (dev)** — con el seed real: la sección aparece tras las categorías; al hacer scroll el mapa viaja entre las 9 propiedades y el camino se dibuja.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat(portada): sección de recorrido de favoritas tras las categorías

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `/propiedades` — toggle Lista | Mapa en los filtros

**Files:**
- Modify: `app/(public)/propiedades/page.tsx`

**Interfaces:**
- Consumes: `PropertyMap` + `MapPoint` de `@/components/site/PropertyMap` (existente), `formatUSD`.

- [ ] **Step 1: Modificar la página**

1. Ampliar el tipo de searchParams: `Promise<{ zone?: string; status?: string; beds?: string; view?: string }>`.
2. `const view = sp.view === "map" ? "map" : "list"`.
3. En la vista mapa, "aún por vender" por defecto: `const effectiveStatus = view === "map" ? (sp.status || "for_sale") : sp.status`. Pasar `status: effectiveStatus || undefined` a `getProperties`.
4. Tras el `<form>` de filtros (mismo contenedor), añadir el toggle que preserva los params actuales:

```tsx
{(() => {
  const qs = (v: string) => {
    const params = new URLSearchParams()
    if (sp.zone) params.set("zone", sp.zone)
    if (sp.status) params.set("status", sp.status)
    if (sp.beds) params.set("beds", sp.beds)
    if (v === "map") params.set("view", "map")
    const s = params.toString()
    return s ? `?${s}` : ""
  }
  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active ? "bg-navy text-paper" : "border border-line text-muted hover:text-ink"
    }`
  return (
    <div className="flex items-center gap-2">
      <Link href={`/propiedades${qs("list")}`} className={chip(view === "list")}>Lista</Link>
      <Link href={`/propiedades${qs("map")}`} className={chip(view === "map")}>Mapa</Link>
    </div>
  )
})()}
```

(Importar `Link` de `next/link` si no está.)
5. Renderizado condicional: si `view === "map"`, en lugar del grid de `PropertyCard`:

```tsx
<PropertyMap
  height="65vh"
  points={properties.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    price: formatUSD(p.price),
    status: p.status,
    zone: p.zone,
    href: `/propiedades/${p.id}`,
  }))}
/>
```

Importar `PropertyMap` desde `@/components/site/PropertyMap` y `formatUSD` de `@/lib/format` (comprobar imports existentes primero). Nota: `getProperties` incluye `images` solo en `getPropertyById`; aquí basta el shape base.

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK. Manual: `/propiedades?view=map` muestra el mapa con las propiedades en venta; cambiar zona conserva `view=map`.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/propiedades/page.tsx"
git commit -m "feat(listado): vista mapa de propiedades en venta como opción del filtro

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Redes sociales configurables + `SocialLinks`

**Files:**
- Modify: `lib/settings-keys.ts`
- Create: `components/site/SocialLinks.tsx`
- Modify: `components/site/home/ConnectWithUs.tsx` (prop opcional)
- Modify: `app/(public)/page.tsx` (leer settings y pasar prop)

**Interfaces:**
- Produces: claves `instagramUrl|facebookUrl|youtubeUrl|tiktokUrl`; `SocialLinks({ links, className? })` con `type SocialLink = { name: "instagram"|"facebook"|"youtube"|"tiktok"; url: string }`; helper `socialFromSettings(settings: Record<string,string>): SocialLink[]` exportado del mismo archivo; `ConnectWithUs({ social }: { social?: SocialLink[] })`.

- [ ] **Step 1: Añadir claves a `lib/settings-keys.ts`**

```ts
  { name: "instagramUrl", label: "Instagram", type: "url" as const },
  { name: "facebookUrl", label: "Facebook", type: "url" as const },
  { name: "youtubeUrl", label: "YouTube", type: "url" as const },
  { name: "tiktokUrl", label: "TikTok", type: "url" as const },
```

(El tab General del admin los renderiza automáticamente — data-driven.)

- [ ] **Step 2: Crear `components/site/SocialLinks.tsx`** (sin "use client" — presentacional puro)

```tsx
import type { ComponentProps } from "react"

export type SocialLink = {
  name: "instagram" | "facebook" | "youtube" | "tiktok"
  url: string
}

// Deriva los links definidos desde los settings del negocio (solo los configurados).
export function socialFromSettings(settings: Record<string, string>): SocialLink[] {
  const map = [
    ["instagram", settings.instagramUrl],
    ["facebook", settings.facebookUrl],
    ["youtube", settings.youtubeUrl],
    ["tiktok", settings.tiktokUrl],
  ] as const
  return map.filter(([, url]) => !!url).map(([name, url]) => ({ name, url: url! }))
}

const LABEL: Record<SocialLink["name"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
}

function Icon({ name, ...props }: { name: SocialLink["name"] } & ComponentProps<"svg">) {
  const paths: Record<SocialLink["name"], string> = {
    instagram:
      "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.3.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.3.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.3-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.3.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.3-.4 1.2-.1 1.6-.1 4.8-.1zm0 3.7a6.1 6.1 0 100 12.2 6.1 6.1 0 000-12.2zm0 2.2a3.9 3.9 0 110 7.8 3.9 3.9 0 010-7.8zm6.3-2.7a1.4 1.4 0 110 2.9 1.4 1.4 0 010-2.9z",
    facebook:
      "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z",
    youtube:
      "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.2 31.2 0 000 12a31.2 31.2 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.2 31.2 0 0024 12a31.2 31.2 0 00-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z",
    tiktok:
      "M12.9 2h3.1c.2 1.2.8 2.4 1.8 3.2.9.9 2.1 1.4 3.4 1.5v3.2c-1.2 0-2.4-.3-3.5-.8-.5-.2-1-.5-1.5-.9v6.7a6.4 6.4 0 11-6.4-6.4c.3 0 .7 0 1 .1v3.3a3.2 3.2 0 102.1 3V2z",
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d={paths[name]} />
    </svg>
  )
}

export function SocialLinks({ links, className = "" }: { links: SocialLink[]; className?: string }) {
  if (links.length === 0) return null
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABEL[l.name]}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:text-white"
        >
          <Icon name={l.name} className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: `ConnectWithUs` acepta `social` opcional**

En `components/site/home/ConnectWithUs.tsx` (client): importar `SocialLinks, type SocialLink` desde `@/components/site/SocialLinks` (es presentacional, válido en client). Firma: `export function ConnectWithUs({ social = [] }: { social?: SocialLink[] })`. Bajo el bloque de emails (`</dl>`), añadir: `<SocialLinks links={social} className="mt-8" />`.

- [ ] **Step 4: La portada pasa los settings**

En `app/(public)/page.tsx`: `import { getSettings } from "@/lib/settings"` y `import { socialFromSettings } from "@/components/site/SocialLinks"`. En el componente: `const settings = await getSettings()` (paralelizable con `Promise.all` junto a `featured`), y `<ConnectWithUs social={socialFromSettings(settings)} />`.

- [ ] **Step 5: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 6: Commit**

```bash
git add lib/settings-keys.ts components/site/SocialLinks.tsx components/site/home/ConnectWithUs.tsx "app/(public)/page.tsx"
git commit -m "feat(social): redes configurables desde el admin con iconos en Connect With Us

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Footer — mapa de la oficina + directions + redes

**Files:**
- Modify: `components/site/SiteFooter.tsx`

**Interfaces:**
- Consumes: `getSettings` de `@/lib/settings`, `SocialLinks`/`socialFromSettings`.
- Produces: footer con mapa embed OSM de la oficina, link a Google Maps y los iconos sociales. `SiteFooter` pasa a ser `async` (server component — ya lo es).

- [ ] **Step 1: Reescribir `components/site/SiteFooter.tsx`**

```tsx
import Link from "next/link"
import Image from "next/image"
import { getSettings } from "@/lib/settings"
import { SocialLinks, socialFromSettings } from "@/components/site/SocialLinks"

// Oficina principal: 710 S. Dixie Hwy #100, Coral Gables, FL 33146 (aprox.)
const OFFICE = { lat: 25.7145, lng: -80.2731 }
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${OFFICE.lng - 0.012}%2C${OFFICE.lat - 0.007}%2C${OFFICE.lng + 0.012}%2C${OFFICE.lat + 0.007}&layer=mapnik&marker=${OFFICE.lat}%2C${OFFICE.lng}`
const DIRECTIONS = "https://maps.google.com/?q=710+S+Dixie+Hwy+%23100,+Coral+Gables,+FL+33146"

export async function SiteFooter() {
  const settings = await getSettings()
  const social = socialFromSettings(settings)

  return (
    <footer className="bg-ffr-navy text-white/80">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
          <p className="text-sm">
            Floridian First Realty | 305.667.5235 | 710 S. Dixie Hwy #100, Coral Gables, FL 33146
          </p>
          <SocialLinks links={social} />
          <div className="flex items-center gap-5 text-sm">
            <a
              href={DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Get directions →
            </a>
            <Link href="/contacto" className="underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/15">
          <iframe
            src={OSM_EMBED}
            title="Floridian First Realty office — 710 S. Dixie Hwy #100, Coral Gables"
            className="h-56 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK. Nota: `SiteFooter` async dentro del layout server es válido en App Router. El iframe embebe openstreetmap.org (permitido; sin API key).

- [ ] **Step 3: Commit**

```bash
git add components/site/SiteFooter.tsx
git commit -m "feat(footer): mapa de la oficina con directions y redes sociales

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Verificación final

- [ ] **Step 1:** `npm test` → PASS (41: 35 previos + 6 de journey). `npm run build` → OK.
- [ ] **Step 2 (navegador, dev server):**
  1. `/admin/propiedades`: estrellas ★ funcionan (toggle persiste al refrescar).
  2. Portada: nueva sección tras categorías; el scroll viaja entre propiedades y el camino se traza; la tarjeta cambia; al terminar continúa a "At the heart of FFR".
  3. Emular `prefers-reduced-motion` y viewport móvil: la sección muestra mapa estático + fila de tarjetas SIN sección de 300vh (sin dead-scroll).
  4. `/propiedades`: toggle Lista/Mapa; el mapa muestra solo en venta por defecto; filtros se conservan.
  5. Footer: mapa de la oficina carga, "Get directions" abre Google Maps.
  6. Admin → Configuración → General: cargar una URL de Instagram → el icono aparece en footer y Connect With Us.
- [ ] **Step 3 (despliegue, tras aprobación del usuario):** merge a main; `npm run pg:push` y `npm run pg:seed` contra Neon (⚠️ reseed borra datos demo de prod — avisado); `git push`.

## Self-Review

- Spec §2 (modelo) → Task 1. §3 (botón admin) → Task 1. §4 (seed real, zonas, fotos, limpieza FK-safe ya existente en el seed) → Task 2. §5 (MapJourney + fallbacks + guard <2 + ubicación) → Tasks 4-5. §6 (toggle listado + for_sale default) → Task 6. §7 (footer mapa iframe + directions) → Task 8. §8 (redes configurables + footer + ConnectWithUs) → Tasks 7-8. §9 (tests journey + verificación navegador) → Tasks 3, 9. §10 (despliegue con pg:push/pg:seed) → Task 9. **Cobertura completa.**
- Tipos consistentes: `JourneyStop` (T4↔T5), `SocialLink`/`socialFromSettings` (T7↔T8), `toggleFeatured` (T1), `interpolateStops/polylineLength` (T3↔T4). Sin placeholders.
- Nota consciente: `/` vuelve a dinámica (query de favoritas) — trade-off aceptado y documentado en Task 5.
