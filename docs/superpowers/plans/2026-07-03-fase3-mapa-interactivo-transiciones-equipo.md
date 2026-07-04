# Fase 3: Mapa interactivo con pines de foto, transiciones ricas y equipo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el mapa de scroll por un mapa interactivo estilo Google (CARTO + pines con foto), enriquecer las transiciones (secciones, tarjetas, hero, entre páginas con morph) y añadir la sección "Meet the Team" con el equipo real.

**Architecture:** `MapShowcase` (client, Leaflet + tiles CARTO Voyager + `L.divIcon` con foto) sustituye a `MapJourney`; `lib/journey` se elimina. Nueva primitiva `RevealGroup` (GSAP stagger sobre hijos) unifica entradas de tarjetas. View Transitions de Next 16 (`experimental.viewTransition`) dan crossfade global y morph foto→hero. `TeamDirectory` reusa `InertiaMarquee` con los headshots reales.

**Tech Stack:** Next.js 16.2.10 (View Transitions experimental), React 19 (`ViewTransition` de `react`), Leaflet + CARTO Voyager, GSAP (ya instalado), sharp (compresión).

**Spec:** `docs/superpowers/specs/2026-07-03-fase3-mapa-interactivo-transiciones-equipo-design.md`

## Global Constraints

- Tiles: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, attribution `© OpenStreetMap © CARTO`, maxZoom 20.
- Cero dead-scroll; contenido server-rendered visible sin JS; efectos gated por `useMotion()` (`enabled`/`heavyEnabled`); solo transform/opacity.
- Móvil: `dragging: false` en el mapa (no secuestrar scroll táctil); `scrollWheelZoom: false` siempre; `zoomControl: true`.
- Equipo: fotos y nombres SIN emparejar (mapeo no confirmado); roster textual con los 16 nombres/roles literales del scrape.
- Copys de portada en inglés; identidad FFR (`ffr-navy`, `font-montserrat`).
- Commits terminan con: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: `MapShowcase` (CARTO + pines con foto + tarjeta)

**Files:**
- Create: `components/site/home/MapShowcase.tsx`
- Modify: `app/globals.css` (animación de pines)

**Interfaces:**
- Consumes: `useMotion`, `RevealText`.
- Produces: `MapShowcase({ stops }: { stops: ShowcaseStop[] })` con `export type ShowcaseStop = { id: string; title: string; lat: number; lng: number; photoUrl: string; priceLabel: string; href: string }`.

- [ ] **Step 1: Animación CSS de los pines en `app/globals.css`** (al final del archivo)

```css
/* Pines con foto del MapShowcase: entrada escalonada con rebote */
@keyframes ffr-pin-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.ffr-photo-pin {
  transform-origin: bottom center;
}
.ffr-photo-pin.pin-animate {
  animation: ffr-pin-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--pin-delay, 0ms);
}
@media (prefers-reduced-motion: reduce) {
  .ffr-photo-pin.pin-animate { animation: none; }
}
```

- [ ] **Step 2: Implementar `components/site/home/MapShowcase.tsx`**

```tsx
"use client"

// Mapa interactivo de favoritas estilo Google (tiles CARTO Voyager, sin API key):
// pines circulares con la FOTO de cada propiedad, entrada escalonada, y una
// tarjeta flotante al hacer click con el link al detalle.

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import "leaflet/dist/leaflet.css"
import { useMotion } from "@/components/motion/MotionProvider"
import { RevealText } from "@/components/motion/RevealText"

export type ShowcaseStop = {
  id: string
  title: string
  lat: number
  lng: number
  photoUrl: string
  priceLabel: string
  href: string
}

const IS_TOUCH = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches

export function MapShowcase({ stops }: { stops: ShowcaseStop[] }) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<ShowcaseStop | null>(null)
  const { enabled } = useMotion()

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !mapElRef.current) return

      const touch = IS_TOUCH()
      map = L.map(mapElRef.current, {
        dragging: !touch,          // en móvil no secuestrar el scroll táctil
        scrollWheelZoom: false,
        touchZoom: true,
        doubleClickZoom: true,
        zoomControl: true,
        attributionControl: true,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 20,
        updateWhenIdle: true,
      }).addTo(map)

      stops.forEach((s, i) => {
        const icon = L.divIcon({
          className: "", // sin estilos por defecto de leaflet
          html: `
            <div class="ffr-photo-pin${enabled ? " pin-animate" : ""}" style="--pin-delay:${i * 90}ms">
              <div style="width:52px;height:52px;border-radius:9999px;border:3px solid #fff;box-shadow:0 6px 16px rgb(0 0 0/.35);overflow:hidden;background:#e6e2d8">
                <img src="${s.photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy"/>
              </div>
              <div style="width:0;height:0;margin:-2px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #fff;filter:drop-shadow(0 2px 2px rgb(0 0 0/.25))"></div>
            </div>`,
          iconSize: [52, 64],
          iconAnchor: [26, 64],
        })
        const marker = L.marker([s.lat, s.lng], { icon }).addTo(map!)
        marker.on("click", () => setActive(s))
      })

      map.on("click", () => setActive(null))

      if (stops.length > 1) {
        map.fitBounds(stops.map((s) => [s.lat, s.lng] as [number, number]), { padding: [56, 56] })
      } else if (stops.length === 1) {
        map.setView([stops[0].lat, stops[0].lng], 13)
      }
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
    // stops es estático por render del server; enabled solo afecta la animación de entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (stops.length === 0) return null

  return (
    <section ref={sectionRef} className="bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="text-center">
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            Explore our featured listings
          </RevealText>
          <p className="mt-3 text-sm text-ffr-slate">
            Tap a property pin to see the details.
          </p>
        </div>

        <div className="relative mt-10 h-[420px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">
          <div ref={mapElRef} className="absolute inset-0 z-0" />

          {active && (
            <Link
              href={active.href}
              className="absolute bottom-5 left-5 z-[600] flex w-72 items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={active.photoUrl} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-montserrat text-sm font-bold text-ffr-navy">{active.title}</p>
                <p className="text-xs text-ffr-slate">{active.priceLabel}</p>
                <p className="mt-0.5 text-xs font-semibold text-ffr-navy">View property →</p>
              </div>
            </Link>
          )}
        </div>

        {/* Acceso alternativo en móvil (drag del mapa desactivado en táctil) */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:hidden">
          {stops.map((s) => (
            <Link key={s.id} href={s.href} className="flex w-60 shrink-0 items-center gap-3 rounded-xl border border-line p-3">
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
    </section>
  )
}
```

- [ ] **Step 3: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 4: Commit**

```bash
git add components/site/home/MapShowcase.tsx app/globals.css
git commit -m "feat(portada): MapShowcase interactivo con tiles CARTO y pines de foto

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Swap en la portada y eliminar `MapJourney`/`journey`

**Files:**
- Modify: `app/(public)/page.tsx`
- Delete: `components/site/home/MapJourney.tsx`, `lib/journey.ts`, `lib/journey.test.ts`

- [ ] **Step 1: Sustituir en `app/(public)/page.tsx`**

Cambiar el import `MapJourney, type JourneyStop` por `MapShowcase, type ShowcaseStop` de `@/components/site/home/MapShowcase`; renombrar el tipo del array (`const stops: ShowcaseStop[]`) — el shape es idéntico. Render: `{stops.length > 0 && <MapShowcase stops={stops} />}` (antes era `>= 2`; con 1 también funciona).

- [ ] **Step 2: Verificar que nada más usa lo que se elimina y borrar**

```bash
grep -rn "MapJourney\|lib/journey" app components lib --include="*.ts*" | grep -v "MapShowcase"
# esperado: solo referencias dentro de los archivos a borrar
git rm components/site/home/MapJourney.tsx lib/journey.ts lib/journey.test.ts
```

- [ ] **Step 3: Verificar** — `npx tsc --noEmit && npm test && npm run build` → OK (la suite baja a 35 tests).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(portada): reemplazar el recorrido por MapShowcase y retirar journey

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Primitiva `RevealGroup` + aplicarla (tarjetas/secciones)

**Files:**
- Create: `components/motion/RevealGroup.tsx`
- Modify: `components/site/home/ServiceCategories.tsx`, `components/site/home/Partnerships.tsx`, `components/site/home/Testimonials.tsx`, `components/site/home/ConnectWithUs.tsx`

**Interfaces:**
- Produces: `RevealGroup({ children, className?, y?, stagger? })` — anima los HIJOS DIRECTOS del wrapper al entrar en viewport.

- [ ] **Step 1: Crear `components/motion/RevealGroup.tsx`**

```tsx
"use client"

// Entrada escalonada con profundidad (y + scale + fade) de los hijos directos
// al entrar en viewport. Contenido siempre visible sin JS/reduced-motion.

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"
import { DUR, EASE, STAGGER } from "@/lib/motion-config"

export function RevealGroup({
  children,
  className,
  y = 36,
  stagger = STAGGER.cards,
}: {
  children: React.ReactNode
  className?: string
  y?: number
  stagger?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled } = useMotion()

  useGSAP(
    () => {
      if (!enabled || !ref.current) return
      gsap.from(ref.current.children, {
        y,
        scale: 0.965,
        opacity: 0,
        duration: DUR.reveal,
        ease: EASE.out,
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      })
    },
    { scope: ref, dependencies: [enabled, y, stagger] },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Aplicar en `ServiceCategories`** — envolver el grid: el `<div className="grid gap-6 md:grid-cols-3">` pasa a `<RevealGroup className="grid gap-6 md:grid-cols-3">` (import de `@/components/motion/RevealGroup`; quitar nada más).

- [ ] **Step 3: Aplicar en `Partnerships`** — ELIMINAR el gsap inline (imports de gsap/useGSAP/useMotion/motion-config, el `useRef` del grid y el bloque `useGSAP`) y volverlo server component si queda sin hooks: el grid `<div className="mt-12 grid ...">` pasa a `<RevealGroup className="mt-12 grid grid-cols-2 items-center gap-10 sm:grid-cols-3 lg:grid-cols-6">`. Mantener título y estilos navy.

- [ ] **Step 4: Aplicar en `Testimonials`** — envolver la `<ul>` (o su contenedor) con `<RevealGroup>` conservando las clases actuales del contenedor.

- [ ] **Step 5: Aplicar en `ConnectWithUs`** — envolver el grid de 2 columnas: `<div className="mx-auto grid ...">` → `<RevealGroup className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2">` (las 2 columnas entran escalonadas). Nota: `ConnectWithUs` es client — `RevealGroup` también, sin problema.

- [ ] **Step 6: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 7: Commit**

```bash
git add components/motion/RevealGroup.tsx components/site/home/ServiceCategories.tsx components/site/home/Partnerships.tsx components/site/home/Testimonials.tsx components/site/home/ConnectWithUs.tsx
git commit -m "feat(motion): RevealGroup con profundidad y stagger aplicado a las secciones

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Hero dramático (el titular se despega del video)

**Files:**
- Modify: `components/motion/ScrubHero.tsx`

- [ ] **Step 1: Añadir el tween de despegue**

En `ScrubHero`, añadir un ref para el contenido: `const contentRef = useRef<HTMLDivElement>(null)`. El div `className="relative z-10 flex h-full items-center justify-center px-5"` recibe `ref={contentRef}`.

Dentro del `useGSAP`, en el bloque `if (heavyEnabled ...)` — APLICA EN AMBOS MODOS (video e imagen) — añadir después de crear el trigger principal:

```ts
      // Despegue del titular: en el último 40% del pin el contenido sube y se desvanece.
      const lift = gsap.to(contentRef.current, {
        yPercent: -35,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "60% bottom", // último 40% del recorrido del pin
          end: "bottom bottom",
          scrub: 0.4,
        },
      })
```

y en los cleanups correspondientes añadir `lift.scrollTrigger?.kill()`. CUIDADO: estructura los returns para matar ambos triggers (el principal y el lift) en cada rama; p.ej. crear `lift` antes del `if` de modos y devolver un cleanup común. Leer el archivo y reorganizar mínimamente: crear el lift SIEMPRE que `heavyEnabled` (antes del if video/imagen), y que cada rama devuelva un cleanup que mate su trigger + el de lift.

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK. Manual dev: al scrollear el hero, el titular sube y se desvanece en el último tramo; con reduced-motion no pasa nada.

- [ ] **Step 3: Commit**

```bash
git add components/motion/ScrubHero.tsx
git commit -m "feat(portada): despegue del titular del hero en el último tramo del pin

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: View Transitions (crossfade global + morph foto→hero)

**Files:**
- Modify: `next.config.ts`, `app/(public)/layout.tsx`, `components/site/PropertyCard.tsx`, `components/site/home/MapShowcase.tsx`, `app/(public)/propiedades/[id]/page.tsx`, `app/globals.css`

- [ ] **Step 1: Activar el flag en `next.config.ts`**

```ts
const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: { /* ...igual que está... */ },
};
```

- [ ] **Step 2: Crossfade global en el layout público**

En `app/(public)/layout.tsx`: `import { ViewTransition } from "react"` (Next usa React canary con el componente; si TypeScript se queja del export, usar `import { unstable_ViewTransition as ViewTransition } from "react"` — comprobar cuál compila y usar ese en TODOS los archivos). Envolver: `<main className="flex-1"><ViewTransition>{children}</ViewTransition></main>`.

- [ ] **Step 3: Morph de la foto — origen tarjeta de listado**

En `components/site/PropertyCard.tsx`, envolver el `<Image>` (o su contenedor inmediato) con `<ViewTransition name={`property-photo-${property.id}`}>`.

- [ ] **Step 4: Morph — origen tarjeta del mapa**

En `components/site/home/MapShowcase.tsx`, en la tarjeta flotante `active`, envolver el `<div className="relative h-16 w-20 ...">` con `<ViewTransition name={`property-photo-${active.id}`}>`.

- [ ] **Step 5: Morph — destino hero del detalle**

En `app/(public)/propiedades/[id]/page.tsx`, envolver el `<div className="relative aspect-[16/10] ...">` (el contenedor del Image principal) con `<ViewTransition name={`property-photo-${property.id}`}>` (import igual que en los demás).

- [ ] **Step 6: Reduced-motion en `app/globals.css`** (al final)

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

- [ ] **Step 7: Verificar** — `npx tsc --noEmit && npm run build` → OK. Manual dev (Chrome): navegar listado→detalle y observar el morph de la foto; portada→listado con crossfade.

- [ ] **Step 8: Commit**

```bash
git add next.config.ts "app/(public)/layout.tsx" components/site/PropertyCard.tsx components/site/home/MapShowcase.tsx "app/(public)/propiedades/[id]/page.tsx" app/globals.css
git commit -m "feat(nav): view transitions con crossfade global y morph de foto al detalle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Sección `TeamDirectory` ("Meet the Team")

**Files:**
- Create: `public/ffr/team/*` (17 headshots comprimidos)
- Create: `components/site/home/TeamDirectory.tsx`
- Modify: `app/(public)/page.tsx` (insertar tras `HeartOfFFR`)

**Interfaces:**
- Consumes: `InertiaMarquee`, `RevealText`, `RevealGroup`, `AnimatedCta`.

- [ ] **Step 1: Comprimir los headshots**

```bash
cd /home/albe/Projects/FFR
mkdir -p public/ffr/team
node -e '
const sharp = require("sharp"); const fs = require("fs"); const path = require("path");
(async () => {
  const dir = "docs/floridian-first-scrape/imagenes/internas";
  const files = fs.readdirSync(dir).filter(f => f.startsWith("equipo-"));
  for (const f of files) {
    const out = `public/ffr/team/${path.parse(f).name}.jpg`;
    await sharp(`${dir}/${f}`).resize({ width: 400, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
  }
  console.log("done", files.length);
})()'
ls public/ffr/team | wc -l   # esperado: 17
```

- [ ] **Step 2: Implementar `components/site/home/TeamDirectory.tsx`**

```tsx
import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { RevealGroup } from "@/components/motion/RevealGroup"
import { AnimatedCta } from "@/components/motion/AnimatedCta"
import { InertiaMarquee } from "@/components/motion/InertiaMarquee"

// Roster REAL del scrape (/about-1). Las fotos del equipo no tienen mapeo
// nombre↔foto confirmado por el cliente, así que se muestran por separado.
const TEAM = [
  { name: "Michelle Gonzalez", role: "Broker / Owner" },
  { name: "Kevin Gonzalez", role: "Broker / Owner" },
  { name: "Christina Muniz", role: "Marketing Manager" },
  { name: "Lisa Beining", role: "" },
  { name: "Argenid Blanco", role: "" },
  { name: "Barbara Yanes", role: "" },
  { name: "Greg Eversole", role: "" },
  { name: "Karen Ramirez", role: "" },
  { name: "Lais Same", role: "" },
  { name: "Lillian Mas", role: "" },
  { name: "Muriel Zerdoun", role: "" },
  { name: "Oriana Espinoza", role: "" },
  { name: "Otoniel Bandres", role: "" },
  { name: "Pedro Romero", role: "" },
  { name: "Sandra Denis", role: "" },
  { name: "Sophia Codinach", role: "" },
]

const HEADSHOTS = [
  "equipo-01", "equipo-02", "equipo-03", "equipo-04", "equipo-05", "equipo-06",
  "equipo-07", "equipo-08", "equipo-09-karen", "equipo-10", "equipo-11",
  "equipo-12", "equipo-13", "equipo-14", "equipo-15", "equipo-16", "equipo-17",
]

export function TeamDirectory() {
  return (
    <section className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 text-center">
        <p className="font-montserrat text-xs font-semibold uppercase tracking-[0.3em] text-ffr-slate">
          Exceptional Living, Expertly Crafted
        </p>
        <RevealText
          as="h2"
          className="mt-3 font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Meet the Team
        </RevealText>
        <p className="mx-auto mt-4 max-w-2xl text-ffr-slate">
          16 specialists in residential and commercial real estate — guidance,
          transparency, and hands-on negotiation at every step.
        </p>
      </div>

      <InertiaMarquee className="mt-12" speed={35}>
        {HEADSHOTS.map((f) => (
          <div key={f} className="mx-4 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image
              src={`/ffr/team/${f}.jpg`}
              alt=""
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </InertiaMarquee>

      <div className="mx-auto mt-12 w-full max-w-5xl px-5">
        <RevealGroup className="grid grid-cols-2 gap-x-8 gap-y-4 text-left sm:grid-cols-3 lg:grid-cols-4" y={20} stagger={0.05}>
          {TEAM.map((m) => (
            <div key={m.name}>
              <p className="font-montserrat text-sm font-semibold text-ffr-navy">{m.name}</p>
              {m.role && <p className="text-xs text-ffr-slate">{m.role}</p>}
            </div>
          ))}
        </RevealGroup>
        <div className="mt-10 text-center">
          <AnimatedCta href="/contacto" variant="solid">
            Schedule a consult
          </AnimatedCta>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Insertar en `app/(public)/page.tsx`** — import + `<TeamDirectory />` entre `<HeartOfFFR />` y `<Testimonials />`.

- [ ] **Step 4: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 5: Commit**

```bash
git add public/ffr/team components/site/home/TeamDirectory.tsx "app/(public)/page.tsx"
git commit -m "feat(portada): sección Meet the Team con headshots reales y roster del equipo

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Verificación final

- [ ] **Step 1:** `npm test` (35 tests — journey eliminado) + `npm run build` → OK.
- [ ] **Step 2 (navegador, dev):**
  1. Portada: pines con foto entran escalonados con rebote; drag/zoom del mapa; click en pin → tarjeta → detalle.
  2. Morph: la foto de la tarjeta se transforma en el hero del detalle (Chrome); volver con crossfade.
  3. Hero: el titular se despega (sube+desvanece) en el último tramo.
  4. RevealGroup: categorías/asociaciones/testimonio/conectar entran con profundidad.
  5. Meet the Team: cinta de headshots arrastrable + roster escalonado.
  6. Móvil (viewport 375px): mapa sin drag pero con zoom; fila de tarjetas visible; todo legible.
  7. Reduced-motion: sin animaciones, contenido íntegro.
- [ ] **Step 3:** commit de ajustes si los hay.

## Self-Review

- Spec §1 (MapShowcase completo: tiles/pines/tarjeta/interacción/fila móvil/bajas) → Tasks 1-2 ✅. §2a RevealGroup + aplicaciones → Task 3 ✅ (incluye DRY de Partnerships). §2b profundidad de secciones → cubierto por RevealGroup en los contenedores (el `SectionDivider` del spec se OMITE deliberadamente: con morph + despegue + stagger la portada ya gana ritmo; añadir ondas SVG es riesgo estético — si el usuario las quiere, iteración posterior) — desviación anotada. §2c hero → Task 4 ✅. §2d view transitions + morph + reduced-motion CSS → Task 5 ✅. §3 equipo → Task 6 ✅. §5 verificación → Task 7 ✅.
- Tipos: `ShowcaseStop` (T1↔T2), `RevealGroup` props (T3↔T6), import `ViewTransition` unificado (T5). Sin placeholders.
