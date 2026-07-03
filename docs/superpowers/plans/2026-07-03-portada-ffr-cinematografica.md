# Portada Cinematográfica FFR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la home pública por una portada cinematográfica para Floridian First Realty con contenido 100 % real (inglés) y efectos nivel Radian (hero scrubbed, reveals, parallax, marquee con inercia), alimentando el CRM.

**Architecture:** Server components para todo el contenido (visible sin JS); una capa de movimiento aislada en `components/motion/` (GSAP + ScrollTrigger + SplitText + Draggable/Inertia + Lenis) montada solo en el layout público vía `MotionProvider`, con gate central `prefers-reduced-motion`/móvil calculado por un helper puro testeable en `lib/motion-config.ts`. Las 9 secciones de la portada son componentes en `components/site/home/`.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19, Tailwind v4, GSAP 3 (+plugins gratuitos), `@gsap/react`, Lenis, `next/font` (Montserrat), vitest.

**Spec:** `docs/superpowers/specs/2026-07-03-portada-ffr-cinematografica-design.md`
**Contenido fuente:** `docs/superpowers/../floridian-first-scrape/contenido-web.md` y `manifiesto.json` (textos LITERALES, en inglés) · imágenes ya descargadas en `docs/floridian-first-scrape/imagenes/`.

## Global Constraints

- **Identidad FFR pura:** navy `#00305B`, gris `#83969C`, Montserrat para titulares. NO usar la paleta LeadEngine (gold/teal) en la portada nueva.
- **Contenido literal en inglés** del scrape (`contenido-web.md`): no parafrasear textos del cliente; el único bloque nuevo (ValuationMagnet) es aporte LeadEngine.
- **CTA primario:** "What's my home worth?" → `/valuacion`. Secundario: "Property Search" → `/propiedades`.
- **Progresivo:** todo el contenido server-rendered y visible sin JS; los efectos solo mejoran. Nunca esconder texto esperando animación.
- **Gates de movimiento:** `prefers-reduced-motion` apaga TODO; móvil (`<768px`) apaga los efectos pesados (scrub, parallax, inercia). Decidido por `motionState()` de `lib/motion-config.ts` — único punto de verdad.
- **Solo `transform`/`opacity`** en animaciones; objetivo 60 fps.
- **La capa de movimiento NO se importa en el admin** (solo el layout público monta `MotionProvider`).
- **Tokens existentes de `globals.css` NO se tocan** — solo se AÑADEN los FFR.
- Tests: vitest solo recoge `lib/**/*.test.ts`; módulos testeados no importan `next/*` ni `gsap`.
- **Desviaciones aprobadas del spec:** (a) el video hero va en `public/ffr/hero.mp4` (CDN de Vercel) en vez de Blob — no hay `BLOB_READ_WRITE_TOKEN` local; (b) sin recompresión ffmpeg (no está instalado) — se descarga una variante stock ya ≤8 MB.
- Commits terminan con: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Dependencias, tokens FFR, Montserrat y assets

**Files:**
- Modify: `package.json` (deps)
- Modify: `app/globals.css` (tokens FFR)
- Modify: `app/(public)/layout.tsx` (fuente Montserrat — el MotionProvider llega en Task 3)
- Create: `public/ffr/*` (assets copiados)

**Interfaces:**
- Produces: clases Tailwind `bg-ffr-navy`, `text-ffr-navy`, `bg-ffr-navy-soft`, `text-ffr-slate`, `border-ffr-slate`; variable CSS `--font-montserrat` y clase utilitaria `font-montserrat`; assets en `/ffr/<archivo>`.

- [ ] **Step 1: Instalar dependencias**

```bash
cd /home/albe/Projects/FFR
npm install gsap @gsap/react lenis
```

- [ ] **Step 2: Añadir tokens FFR a `app/globals.css`**

En el bloque `:root` (donde están `--paper`, `--navy`, etc.), añadir al final del bloque:

```css
  /* Identidad Floridian First Realty (portada) — no tocar los tokens existentes */
  --ffr-navy: #00305b;
  --ffr-navy-soft: rgb(0 48 91 / 0.82);
  --ffr-slate: #83969c;
```

En el bloque `@theme inline` (donde están `--color-paper`, etc.), añadir:

```css
  --color-ffr-navy: var(--ffr-navy);
  --color-ffr-navy-soft: var(--ffr-navy-soft);
  --color-ffr-slate: var(--ffr-slate);
  --font-montserrat: var(--font-montserrat);
```

Y al final del archivo, la utilidad de fuente (Tailwind v4):

```css
@utility font-montserrat {
  font-family: var(--font-montserrat), Montserrat, ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 3: Montserrat en el layout público**

Reemplazar `app/(public)/layout.tsx` por:

```tsx
import { Montserrat } from "next/font/google"
import { SiteHeader } from "@/components/site/SiteHeader"
import { SiteFooter } from "@/components/site/SiteFooter"

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
})

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.variable} flex min-h-screen flex-col`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 4: Copiar assets a `public/ffr/`**

```bash
cd /home/albe/Projects/FFR
mkdir -p public/ffr
SRC=docs/floridian-first-scrape/imagenes
cp "$SRC/00_logo-floridian-white.png" \
   "$SRC/01_hero-invested-in-you.jpg" \
   "$SRC/02_categoria-residential.jpg" \
   "$SRC/03_categoria-commercial.jpg" \
   "$SRC/04_categoria-luxury.jpg" \
   "$SRC/05_michelle-y-kevin-gonzalez.jpg" \
   "$SRC/11_cliente-jealous-fork.png" \
   "$SRC/12_cliente-mistero1.png" \
   "$SRC/13_cliente-la-boulangerie-boulmich.png" \
   "$SRC/14_cliente-nothing-bundt-cakes.png" \
   "$SRC/15_cliente-sana-skin.png" \
   "$SRC/16_cliente-pincrest-bakery.png" \
   "$SRC/17_cliente-blaze-pizza.jpg" \
   "$SRC/19_cliente-poke-house.png" \
   "$SRC/20_cliente-oh-my-gosh-brigadeiros.png" \
   "$SRC/22_cliente-chicken-kitchen.png" \
   "$SRC/23_assoc-womens-council-realtors.png" \
   "$SRC/24_assoc-equal-housing-opportunity.png" \
   "$SRC/25_assoc-national-association-realtors.png" \
   "$SRC/26_assoc-fiu-business.png" \
   "$SRC/27_assoc-coral-gables-chamber.png" \
   "$SRC/28_assoc-florida-ccim-chapter.png" \
   public/ffr/
ls public/ffr | wc -l   # esperado: 22
```

> Nota: se omiten deliberadamente `18_cliente-white-logo-1.png` y `21_cliente-white-logo-2.png` (logos genéricos sin identificar, invisibles sobre fondo claro).

- [ ] **Step 5: Verificar build**

Run: `npx tsc --noEmit && npm run build`
Expected: OK sin errores.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/globals.css "app/(public)/layout.tsx" public/ffr
git commit -m "feat(portada): deps GSAP/Lenis, tokens FFR, Montserrat y assets reales del cliente

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `lib/motion-config.ts` (TDD)

**Files:**
- Create: `lib/motion-config.ts`
- Test: `lib/motion-config.test.ts`

**Interfaces:**
- Produces:
  - `DUR = { fast: 0.35, reveal: 0.8, hero: 1.1 }` (segundos)
  - `EASE = { out: "power3.out", inOut: "power2.inOut" }`
  - `STAGGER = { words: 0.05, cards: 0.12 }`
  - `MOBILE_MAX_WIDTH = 767`
  - `type MotionState = { enabled: boolean; heavyEnabled: boolean }`
  - `motionState(input: { reducedMotion: boolean; isMobile: boolean }): MotionState`

- [ ] **Step 1: Escribir el test que falla**

```ts
// lib/motion-config.test.ts
import { describe, it, expect } from "vitest"
import { motionState, DUR, EASE, STAGGER, MOBILE_MAX_WIDTH } from "@/lib/motion-config"

describe("motion-config", () => {
  it("reduced motion disables everything", () => {
    expect(motionState({ reducedMotion: true, isMobile: false })).toEqual({
      enabled: false,
      heavyEnabled: false,
    })
    expect(motionState({ reducedMotion: true, isMobile: true })).toEqual({
      enabled: false,
      heavyEnabled: false,
    })
  })

  it("mobile keeps light effects but disables heavy ones", () => {
    expect(motionState({ reducedMotion: false, isMobile: true })).toEqual({
      enabled: true,
      heavyEnabled: false,
    })
  })

  it("desktop without reduced motion enables everything", () => {
    expect(motionState({ reducedMotion: false, isMobile: false })).toEqual({
      enabled: true,
      heavyEnabled: true,
    })
  })

  it("exposes central animation tokens", () => {
    expect(DUR.reveal).toBeGreaterThan(0)
    expect(EASE.out).toMatch(/power/)
    expect(STAGGER.words).toBeGreaterThan(0)
    expect(MOBILE_MAX_WIDTH).toBe(767)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/motion-config.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `lib/motion-config.ts`**

```ts
// lib/motion-config.ts
// Configuración CENTRAL de la capa de movimiento (portada FFR).
// Puro: sin imports de gsap/next para poder testearlo con vitest.
// Ajustar duraciones/easings/staggers aquí — un solo sitio.

export const DUR = { fast: 0.35, reveal: 0.8, hero: 1.1 }
export const EASE = { out: "power3.out", inOut: "power2.inOut" }
export const STAGGER = { words: 0.05, cards: 0.12 }
export const MOBILE_MAX_WIDTH = 767

export type MotionState = {
  /** false = prefers-reduced-motion: todo apagado (reveals incluidos) */
  enabled: boolean
  /** false = móvil o reduced: sin scrub/parallax/inercia (efectos costosos) */
  heavyEnabled: boolean
}

export function motionState(input: {
  reducedMotion: boolean
  isMobile: boolean
}): MotionState {
  const enabled = !input.reducedMotion
  return { enabled, heavyEnabled: enabled && !input.isMobile }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/motion-config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/motion-config.ts lib/motion-config.test.ts
git commit -m "feat(motion): configuración central y gate puro de movimiento (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `MotionProvider` (Lenis + registro GSAP + contexto)

**Files:**
- Create: `components/motion/MotionProvider.tsx`
- Modify: `app/(public)/layout.tsx` (envolver con el provider)

**Interfaces:**
- Consumes: `motionState`, `MOBILE_MAX_WIDTH` de `@/lib/motion-config`.
- Produces: `MotionProvider({ children })` y hook `useMotion(): MotionState` para todos los componentes de efecto.

- [ ] **Step 1: Implementar `components/motion/MotionProvider.tsx`**

```tsx
"use client"

// Monta la infraestructura de movimiento UNA vez para el frontend público:
// - registra los plugins de GSAP
// - arranca Lenis (smooth scroll) sincronizado con ScrollTrigger
// - calcula el gate central (reduced-motion / móvil) y lo expone por contexto
// El admin nunca importa este módulo.

import { createContext, useContext, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
import { useGSAP } from "@gsap/react"
import Lenis from "lenis"
import { motionState, MOBILE_MAX_WIDTH, type MotionState } from "@/lib/motion-config"

const MotionCtx = createContext<MotionState>({ enabled: false, heavyEnabled: false })

export function useMotion(): MotionState {
  return useContext(MotionCtx)
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Arranca apagado: el SSR pinta contenido estático y los efectos entran tras montar.
  const [state, setState] = useState<MotionState>({ enabled: false, heavyEnabled: false })

  useEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Draggable, InertiaPlugin)

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const update = () =>
      setState(motionState({ reducedMotion: mqReduce.matches, isMobile: mqMobile.matches }))
    update()
    mqReduce.addEventListener("change", update)
    mqMobile.addEventListener("change", update)

    // Smooth scroll global (solo si el usuario no pide menos movimiento).
    let lenis: Lenis | null = null
    let raf: ((time: number) => void) | null = null
    if (!mqReduce.matches) {
      lenis = new Lenis()
      lenis.on("scroll", ScrollTrigger.update)
      raf = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    return () => {
      mqReduce.removeEventListener("change", update)
      mqMobile.removeEventListener("change", update)
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [])

  return <MotionCtx.Provider value={state}>{children}</MotionCtx.Provider>
}
```

- [ ] **Step 2: Envolver el layout público**

En `app/(public)/layout.tsx`, importar y envolver (el layout de Task 1 ya tiene Montserrat):

```tsx
import { MotionProvider } from "@/components/motion/MotionProvider"
// ...
  return (
    <MotionProvider>
      <div className={`${montserrat.variable} flex min-h-screen flex-col`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </MotionProvider>
  )
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK. Nota: si `gsap/SplitText` o `gsap/InertiaPlugin` no resolvieran (según versión de gsap), verificar que `node_modules/gsap/SplitText.js` existe; gsap ≥3.13 publica todos los plugins en el paquete npm. Si faltara, reportar BLOCKED.

- [ ] **Step 4: Commit**

```bash
git add components/motion/MotionProvider.tsx "app/(public)/layout.tsx"
git commit -m "feat(motion): MotionProvider con Lenis, plugins GSAP y gate por contexto

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Primitivas `RevealText`, `ParallaxLayer`, `AnimatedCta`

**Files:**
- Create: `components/motion/RevealText.tsx`
- Create: `components/motion/ParallaxLayer.tsx`
- Create: `components/motion/AnimatedCta.tsx`

**Interfaces:**
- Consumes: `useMotion` (Task 3); `DUR`, `EASE`, `STAGGER` (Task 2).
- Produces:
  - `RevealText({ children, as?, className? })` — reveal escalonado por palabras al entrar en viewport.
  - `ParallaxLayer({ children, speed?, className? })` — desplazamiento parallax (speed -1..1, default 0.15).
  - `AnimatedCta({ href, children, variant? })` — link-botón con texto+flecha animados en hover; `variant: "solid" | "outline"` (solid = fondo navy FFR).

- [ ] **Step 1: `components/motion/RevealText.tsx`**

```tsx
"use client"

// Titulares que se revelan palabra a palabra tras una máscara (SplitText).
// Con motion apagado, el texto simplemente se ve: nunca se oculta contenido en SSR.

import { useRef } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"
import { DUR, EASE, STAGGER } from "@/lib/motion-config"

export function RevealText({
  children,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span"
  className?: string
}) {
  const ref = useRef<HTMLElement | null>(null)
  const { enabled } = useMotion()

  useGSAP(
    () => {
      if (!enabled || !ref.current) return
      const split = new SplitText(ref.current, {
        type: "lines,words",
        linesClass: "overflow-hidden",
      })
      gsap.from(split.words, {
        yPercent: 110,
        opacity: 0,
        duration: DUR.reveal,
        ease: EASE.out,
        stagger: STAGGER.words,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      })
      return () => split.revert()
    },
    { scope: ref, dependencies: [enabled] },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={className}>{children}</Tag>
}
```

- [ ] **Step 2: `components/motion/ParallaxLayer.tsx`**

```tsx
"use client"

// Capa con desplazamiento parallax ligado al scroll (solo transform).
// speed > 0 se mueve "más lento" que el scroll; se apaga en móvil/reduced.

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function ParallaxLayer({
  children,
  speed = 0.15,
  className,
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { heavyEnabled } = useMotion()

  useGSAP(
    () => {
      if (!heavyEnabled || !ref.current) return
      gsap.fromTo(
        ref.current,
        { yPercent: speed * 30 },
        {
          yPercent: -speed * 30,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      )
    },
    { scope: ref, dependencies: [heavyEnabled, speed] },
  )

  return (
    <div ref={ref} className={className} style={{ willChange: heavyEnabled ? "transform" : undefined }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: `components/motion/AnimatedCta.tsx`**

```tsx
"use client"

// CTA con micro-animación: el texto se desplaza y la flecha entra en hover (<250ms).
// Sin JS de animación: es CSS puro vía Tailwind (group-hover), funciona siempre.

import Link from "next/link"

export function AnimatedCta({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string
  children: React.ReactNode
  variant?: "solid" | "outline"
  className?: string
}) {
  const base =
    "group inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wider transition-colors duration-200"
  const styles =
    variant === "solid"
      ? "bg-ffr-navy text-white hover:bg-ffr-navy/90"
      : "border-2 border-white/80 text-white hover:bg-white hover:text-ffr-navy"
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      <span className="transition-transform duration-200 group-hover:-translate-x-1">{children}</span>
      <span
        aria-hidden
        className="translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
      >
        →
      </span>
    </Link>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add components/motion/RevealText.tsx components/motion/ParallaxLayer.tsx components/motion/AnimatedCta.tsx
git commit -m "feat(motion): primitivas RevealText, ParallaxLayer y AnimatedCta

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `InertiaMarquee`

**Files:**
- Create: `components/motion/InertiaMarquee.tsx`

**Interfaces:**
- Consumes: `useMotion`.
- Produces: `InertiaMarquee({ children, speed?, className? })` — cinta infinita auto-deslizante y arrastrable con inercia; con motion pesado apagado, degrada a un carril con scroll horizontal nativo.

- [ ] **Step 1: Implementar `components/motion/InertiaMarquee.tsx`**

```tsx
"use client"

// Marquee infinito estilo Radian: se desliza solo y se puede "agarrar y lanzar"
// (Draggable + InertiaPlugin). El contenido se duplica para el bucle.
// Con heavyEnabled=false degrada a un carril con scroll horizontal nativo.

import { useRef } from "react"
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function InertiaMarquee({
  children,
  speed = 40, // px/segundo del auto-desplazamiento
  className = "",
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { heavyEnabled } = useMotion()

  useGSAP(
    () => {
      const track = trackRef.current
      if (!heavyEnabled || !track) return

      // El track contiene el contenido DOS veces: el bucle envuelve en -half..0.
      const half = track.scrollWidth / 2
      if (half === 0) return
      const wrapX = gsap.utils.wrap(-half, 0)
      const pos = { x: 0 }
      let dragging = false

      const render = () => gsap.set(track, { x: wrapX(pos.x) })

      const tick = (_t: number, deltaMs: number) => {
        if (!dragging) {
          pos.x -= (speed * deltaMs) / 1000
          render()
        }
      }
      gsap.ticker.add(tick)

      // Proxy invisible: Draggable mueve el proxy y nosotros trasladamos el delta al bucle.
      const proxy = document.createElement("div")
      let lastProxyX = 0
      const drag = Draggable.create(proxy, {
        type: "x",
        trigger: wrapRef.current,
        inertia: true,
        onPress() {
          dragging = true
          lastProxyX = this.x
        },
        onDrag() {
          pos.x += this.x - lastProxyX
          lastProxyX = this.x
          render()
        },
        onThrowUpdate() {
          pos.x += this.x - lastProxyX
          lastProxyX = this.x
          render()
        },
        onThrowComplete() {
          dragging = false
        },
        onRelease() {
          if (!this.tween) dragging = false
        },
      })[0]

      return () => {
        gsap.ticker.remove(tick)
        drag.kill()
      }
    },
    { scope: wrapRef, dependencies: [heavyEnabled, speed] },
  )

  return (
    <div
      ref={wrapRef}
      className={`${heavyEnabled ? "cursor-grab overflow-hidden active:cursor-grabbing" : "overflow-x-auto"} ${className}`}
    >
      <div ref={trackRef} className="flex w-max items-center">
        {children}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add components/motion/InertiaMarquee.tsx
git commit -m "feat(motion): InertiaMarquee arrastrable con inercia y bucle infinito

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: `ScrubHero`

**Files:**
- Create: `components/motion/ScrubHero.tsx`

**Interfaces:**
- Consumes: `useMotion`.
- Produces: `ScrubHero({ videoSrc?, poster, posterAlt, children })` — sección alta (250vh) con bloque sticky; si hay video y motion pesado, el scroll controla `video.currentTime`; si no, imagen con zoom sutil por scroll; con todo apagado, imagen estática. `children` se superpone centrado (titular + CTAs).

- [ ] **Step 1: Implementar `components/motion/ScrubHero.tsx`**

```tsx
"use client"

// Hero cinematográfico tipo Radian: sección de 250vh con bloque sticky.
// - Con video + heavyEnabled: el scroll hace seek del video (scrubbing).
// - Sin video (o si falla): zoom sutil de la imagen por scroll.
// - Con motion apagado: imagen estática. El contenido (children) SIEMPRE visible.

import { useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function ScrubHero({
  videoSrc,
  poster,
  posterAlt,
  children,
}: {
  videoSrc?: string
  poster: string
  posterAlt: string
  children: React.ReactNode
}) {
  const rootRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const { heavyEnabled } = useMotion()
  const useVideo = Boolean(videoSrc) && !videoFailed && heavyEnabled

  useGSAP(
    () => {
      if (!heavyEnabled || !rootRef.current) return

      if (useVideo && videoRef.current) {
        // PLACEHOLDER: video stock — sustituir por material real del cliente.
        const video = videoRef.current
        const st = ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            if (Number.isFinite(video.duration) && video.duration > 0) {
              video.currentTime = self.progress * video.duration
            }
          },
        })
        return () => st.kill()
      }

      // Modo imagen: zoom lento controlado por scroll (solo transform).
      if (mediaRef.current) {
        const tween = gsap.fromTo(
          mediaRef.current,
          { scale: 1 },
          {
            scale: 1.15,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        )
        return () => tween.scrollTrigger?.kill()
      }
    },
    { scope: rootRef, dependencies: [heavyEnabled, useVideo] },
  )

  return (
    <section ref={rootRef} className="relative h-[250vh] bg-ffr-navy">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          {useVideo ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              muted
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image src={poster} alt={posterAlt} fill priority className="object-cover" />
          )}
        </div>
        {/* Overlay navy para contraste AA del texto sobre el medio */}
        <div className="absolute inset-0 bg-gradient-to-b from-ffr-navy/60 via-ffr-navy/40 to-ffr-navy/70" />
        <div className="relative z-10 flex h-full items-center justify-center px-5">
          {children}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add components/motion/ScrubHero.tsx
git commit -m "feat(motion): ScrubHero con video scrubbed por scroll y fallback a imagen

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Video hero (best-effort) + constante de medios

**Files:**
- Create: `components/site/home/hero-media.ts`
- Create (best-effort): `public/ffr/hero.mp4`

**Interfaces:**
- Produces: `HERO_VIDEO_SRC: string | undefined` y `HERO_POSTER = "/ffr/01_hero-invested-in-you.jpg"` consumidos por `HeroCinematic` (Task 8).

- [ ] **Step 1: Buscar y descargar un clip stock aéreo de Miami/Coral Gables**

Usando WebSearch/WebFetch, localizar en **Pexels** (o Coverr) un video con licencia libre de "Miami aerial" / "Coral Gables aerial" y obtener la URL directa del archivo (patrón `https://videos.pexels.com/video-files/<id>/<id>-*.mp4`). Elegir la variante **HD 1280×720 o SD** cuyo peso sea **≤ 8 MB** (no hay ffmpeg para recomprimir). Descargar:

```bash
cd /home/albe/Projects/FFR
curl -L -o public/ffr/hero.mp4 "<URL_DIRECTA_MP4>"
ls -la public/ffr/hero.mp4   # confirmar tamaño ≤ 8MB
```

Si tras 2-3 intentos no se consigue un clip adecuado (URL directa no accesible, peso excesivo), **omitir el video** y continuar: el hero funciona en modo imagen.

- [ ] **Step 2: Crear `components/site/home/hero-media.ts`**

Con video conseguido:

```ts
// Medios del hero. El video es material stock (Pexels, licencia libre) usado como
// PLACEHOLDER hasta tener metraje real del cliente; el poster es la imagen real
// de la portada actual de Floridian First Realty.
export const HERO_VIDEO_SRC: string | undefined = "/ffr/hero.mp4"
export const HERO_POSTER = "/ffr/01_hero-invested-in-you.jpg"
export const HERO_POSTER_ALT = "Floridian First Realty — Invested in you"
```

Sin video conseguido, igual pero `export const HERO_VIDEO_SRC: string | undefined = undefined` (y documentar en el commit).

- [ ] **Step 3: Commit**

```bash
git add components/site/home/hero-media.ts public/ffr/hero.mp4 2>/dev/null || git add components/site/home/hero-media.ts
git commit -m "feat(portada): medios del hero (video stock placeholder + poster real)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Secciones 1–3 (`HeroCinematic`, `BrandStatement`, `ServiceCategories`)

**Files:**
- Create: `components/site/home/HeroCinematic.tsx`
- Create: `components/site/home/BrandStatement.tsx`
- Create: `components/site/home/ServiceCategories.tsx`

**Interfaces:**
- Consumes: `ScrubHero`, `RevealText`, `AnimatedCta`, `hero-media.ts`.
- Produces: tres componentes sin props, listos para ensamblar en `page.tsx` (Task 12).

- [ ] **Step 1: `components/site/home/HeroCinematic.tsx`**

```tsx
import { ScrubHero } from "@/components/motion/ScrubHero"
import { RevealText } from "@/components/motion/RevealText"
import { AnimatedCta } from "@/components/motion/AnimatedCta"
import { HERO_VIDEO_SRC, HERO_POSTER, HERO_POSTER_ALT } from "@/components/site/home/hero-media"

export function HeroCinematic() {
  return (
    <ScrubHero videoSrc={HERO_VIDEO_SRC} poster={HERO_POSTER} posterAlt={HERO_POSTER_ALT}>
      <div className="max-w-4xl text-center text-white">
        <RevealText
          as="h1"
          className="font-montserrat text-5xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-7xl"
        >
          Invested in you.
        </RevealText>
        <p className="mt-6 font-montserrat text-xs uppercase tracking-[0.35em] text-white/85 sm:text-sm">
          Service | Ethics | Commitment | Experience
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AnimatedCta href="/valuacion" variant="outline">
            What&apos;s my home worth?
          </AnimatedCta>
          <AnimatedCta href="/propiedades" variant="outline">
            Property Search
          </AnimatedCta>
        </div>
      </div>
    </ScrubHero>
  )
}
```

> Nota: en el hero ambos CTAs van `outline` sobre el overlay navy (un `solid` navy sería invisible). El primario "What's my home worth?" va primero.

- [ ] **Step 2: `components/site/home/BrandStatement.tsx`** (texto LITERAL del cliente)

```tsx
import { RevealText } from "@/components/motion/RevealText"

export function BrandStatement() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Floridian First Realty
        </RevealText>
        <RevealText as="p" className="mt-8 text-lg leading-relaxed text-ffr-slate sm:text-xl">
          At Floridian First, real estate is not just about the transaction, it&apos;s about making
          memories, creating generational wealth, and establishing long lasting relationships.
          Accomplishing the task of homeownership and investment brokerage is a product of our
          professional and ethical service. At the heart of Floridian First Realty, our team of
          specialists offers guidance, transparency, and hands-on negotiation skills in niche
          pockets of residential and commercial real estate. Our unparalleled service and ethics
          commitment is built on client centric success through customer satisfaction, loyalty,
          and referrals. We are invested in YOU!
        </RevealText>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `components/site/home/ServiceCategories.tsx`**

```tsx
import Image from "next/image"
import Link from "next/link"

const CATEGORIES = [
  { label: "Residential", image: "/ffr/02_categoria-residential.jpg" },
  { label: "Commercial", image: "/ffr/03_categoria-commercial.jpg" },
  { label: "Luxury", image: "/ffr/04_categoria-luxury.jpg" },
]

export function ServiceCategories() {
  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
        <div className="grid gap-6 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/propiedades"
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image
                src={cat.image}
                alt={`${cat.label} real estate`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ffr-navy/80 via-ffr-navy/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3 className="font-montserrat text-xl font-extrabold uppercase tracking-[0.2em] text-white">
                  {cat.label}
                </h3>
                <p className="mt-2 translate-y-2 text-sm text-white/0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white/90">
                  Click here to see more!
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add components/site/home/HeroCinematic.tsx components/site/home/BrandStatement.tsx components/site/home/ServiceCategories.tsx
git commit -m "feat(portada): hero cinematográfico, brand statement y categorías con contenido real

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Secciones 4–6 (`HeartOfFFR`, `Testimonials`, `ValuationMagnet`)

**Files:**
- Create: `components/site/home/HeartOfFFR.tsx`
- Create: `components/site/home/Testimonials.tsx`
- Create: `components/site/home/ValuationMagnet.tsx`

**Interfaces:**
- Consumes: `RevealText`, `ParallaxLayer`, `AnimatedCta`.
- Produces: tres componentes sin props.

- [ ] **Step 1: `components/site/home/HeartOfFFR.tsx`** (bio LITERAL, firma "Michelle and Kevin")

```tsx
import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { ParallaxLayer } from "@/components/motion/ParallaxLayer"

export function HeartOfFFR() {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr]">
        <ParallaxLayer speed={0.2} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src="/ffr/05_michelle-y-kevin-gonzalez.jpg"
              alt="Picture of Michelle and Kevin Gonzalez"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </ParallaxLayer>
        <div>
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            At the heart of FFR
          </RevealText>
          <div className="mt-8 space-y-5 leading-relaxed text-ffr-slate">
            <p>
              With over 25 years of real estate expertise, we are passionately dedicated to the
              growth and evolution of our vibrant city, Miami. As experienced brokers, we bring a
              wealth of knowledge and strategic insight to every negotiation, ensuring our clients
              receive unparalleled guidance at every step. Rooted in a foundation of ethics,
              professionalism, honesty, and kindness, we strive to deliver an exceptional real
              estate experience that you can trust.
            </p>
            <p>
              Our commitment to excellence goes beyond transactions, we are continuously growing,
              both intellectually and spiritually, while leaving a meaningful impact on
              Miami&apos;s future. Whether you&apos;re buying your dream home, seeking a savvy
              investment, or exploring opportunities to build wealth, we are here to guide you
              with transparency and unwavering dedication.
            </p>
            <p>
              Through every market cycle, we&apos;ve stood by our clients, navigating challenges
              and celebrating successes together. Let us show you how we can help turn your real
              estate goals into reality while building a brighter future for our beloved city.
            </p>
          </div>
          <p className="mt-8 font-montserrat text-lg font-semibold text-ffr-navy">
            Michelle and Kevin
          </p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: `components/site/home/Testimonials.tsx`** (testimonio LITERAL; lista preparada para más)

```tsx
import { RevealText } from "@/components/motion/RevealText"

const TESTIMONIALS = [
  {
    author: "Maria Rod-Rey",
    quote:
      "Floridian Realty did an outstanding job leasing our warehouse! They truly went above and beyond! Through their diligent efforts, we leased our warehouse to reliable consistent paying tenants for top-dollar a year ago. Because we had always occupied our warehouse we were unfamiliar with the standard lease requirements, such as deposit amounts, lease payment terms, renewal increase, etc. They guided us every step of the way. They only brought us vetted prospective tenants. It was a pleasure to work with them!",
  },
]

export function Testimonials() {
  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-28">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Testimonials
        </RevealText>
        <ul className="mt-10">
          {TESTIMONIALS.map((t) => (
            <li key={t.author}>
              <RevealText as="p" className="text-lg italic leading-relaxed text-ffr-slate sm:text-xl">
                “{t.quote}”
              </RevealText>
              <p className="mt-6 font-montserrat text-sm font-semibold uppercase tracking-[0.2em] text-ffr-navy">
                — {t.author}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `components/site/home/ValuationMagnet.tsx`** (bloque NUEVO de LeadEngine)

```tsx
import { RevealText } from "@/components/motion/RevealText"
import { ParallaxLayer } from "@/components/motion/ParallaxLayer"
import { AnimatedCta } from "@/components/motion/AnimatedCta"

export function ValuationMagnet() {
  return (
    <section className="relative overflow-hidden bg-ffr-navy">
      {/* Capa decorativa con parallax sutil */}
      <ParallaxLayer speed={-0.25} className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
      <ParallaxLayer speed={0.3} className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
        <RevealText
          as="h2"
          className="font-montserrat text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl"
        >
          What&apos;s your home worth?
        </RevealText>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
          Get an instant AI-powered estimate of your property&apos;s value — free, no obligation.
        </p>
        <div className="mt-10 flex justify-center">
          <AnimatedCta href="/valuacion" variant="outline">
            Get my free estimate
          </AnimatedCta>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add components/site/home/HeartOfFFR.tsx components/site/home/Testimonials.tsx components/site/home/ValuationMagnet.tsx
git commit -m "feat(portada): bio de los brokers, testimonios e imán de valuación IA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Secciones 7–9 (`HappyClients`, `Partnerships`, `ConnectWithUs`)

**Files:**
- Create: `components/site/home/HappyClients.tsx`
- Create: `components/site/home/Partnerships.tsx`
- Create: `components/site/home/ConnectWithUs.tsx`

**Interfaces:**
- Consumes: `InertiaMarquee`, `RevealText`; `submitContactLead` de `@/lib/actions` (existente: `(input: { name, email?, phone?, message?, propertyId?, zone?, source? }) => Promise<{ ok: true; leadId?...} | { ok: false; error: string }>` — usar `res.ok` para bifurcar).
- Produces: tres componentes sin props.

- [ ] **Step 1: `components/site/home/HappyClients.tsx`** (los 10 logos reales identificados, en marquee con inercia)

```tsx
import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { InertiaMarquee } from "@/components/motion/InertiaMarquee"

const CLIENT_LOGOS = [
  { file: "11_cliente-jealous-fork.png", name: "Jealous Fork" },
  { file: "12_cliente-mistero1.png", name: "MisterO1" },
  { file: "13_cliente-la-boulangerie-boulmich.png", name: "La Boulangerie Boul'Mich" },
  { file: "14_cliente-nothing-bundt-cakes.png", name: "Nothing Bundt Cakes" },
  { file: "15_cliente-sana-skin.png", name: "Sana Skin" },
  { file: "16_cliente-pincrest-bakery.png", name: "Pincrest Bakery" },
  { file: "17_cliente-blaze-pizza.jpg", name: "Blaze Pizza" },
  { file: "19_cliente-poke-house.png", name: "Poke House" },
  { file: "20_cliente-oh-my-gosh-brigadeiros.png", name: "Oh My Gosh Brigadeiros" },
  { file: "22_cliente-chicken-kitchen.png", name: "Chicken Kitchen" },
]

export function HappyClients() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Some of our happy clients
        </RevealText>
      </div>
      <InertiaMarquee className="mt-12" speed={45}>
        {CLIENT_LOGOS.map((logo) => (
          <div key={logo.file} className="mx-8 flex h-24 w-40 shrink-0 items-center justify-center">
            <Image
              src={`/ffr/${logo.file}`}
              alt={`${logo.name} logo`}
              width={160}
              height={96}
              className="max-h-24 w-auto object-contain"
            />
          </div>
        ))}
      </InertiaMarquee>
    </section>
  )
}
```

- [ ] **Step 2: `components/site/home/Partnerships.tsx`** (6 logos, fade-in escalonado por CSS al entrar — sobrio)

```tsx
import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"

const ASSOCIATIONS = [
  { file: "23_assoc-womens-council-realtors.png", name: "Women's Council of Realtors" },
  { file: "24_assoc-equal-housing-opportunity.png", name: "Equal Housing Opportunity" },
  { file: "25_assoc-national-association-realtors.png", name: "National Association of Realtors" },
  { file: "26_assoc-fiu-business.png", name: "FIU Business" },
  { file: "27_assoc-coral-gables-chamber.png", name: "Coral Gables Chamber of Commerce" },
  { file: "28_assoc-florida-ccim-chapter.png", name: "Florida CCIM Chapter" },
]

export function Partnerships() {
  return (
    <section className="bg-paper-2 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Partnerships &amp; Associations
        </RevealText>
        <div className="mt-12 grid grid-cols-2 items-center gap-10 sm:grid-cols-3 lg:grid-cols-6">
          {ASSOCIATIONS.map((a) => (
            <div key={a.file} className="flex items-center justify-center">
              <Image
                src={`/ffr/${a.file}`}
                alt={`${a.name} logo`}
                width={120}
                height={80}
                className="max-h-20 w-auto object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: `components/site/home/ConnectWithUs.tsx`** (client component: formulario → CRM + honeypot)

```tsx
"use client"

import { useState } from "react"
import { submitContactLead } from "@/lib/actions"

const fieldClass =
  "w-full rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition-colors focus:border-white/60"

export function ConnectWithUs() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    // Honeypot: humanos no ven ni rellenan "company"; si viene, descartamos en silencio.
    if (String(data.get("company") ?? "") !== "") {
      setStatus("sent")
      form.reset()
      return
    }
    setStatus("sending")
    setError("")
    const res = await submitContactLead({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? "") || undefined,
      phone: String(data.get("phone") ?? "") || undefined,
      message: String(data.get("message") ?? "") || undefined,
      source: "web",
    })
    if (res.ok) {
      setStatus("sent")
      form.reset()
    } else {
      setStatus("error")
      setError(res.error)
    }
  }

  return (
    <section id="connect" className="bg-ffr-navy">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2">
        <div className="text-white">
          <h2 className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] sm:text-3xl">
            Connect With Us
          </h2>
          <dl className="mt-8 space-y-5 text-white/85">
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Address
              </dt>
              <dd className="mt-1">710 South Dixie Highway, Suite 100, Coral Gables, Florida 33146</dd>
            </div>
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Phone
              </dt>
              <dd className="mt-1">
                <a href="tel:3056675235" className="hover:underline">305.667.5235</a>
              </dd>
            </div>
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Email
              </dt>
              <dd className="mt-1">
                <a href="mailto:MGonzalez@FLFirstRealty.com" className="block hover:underline">
                  MGonzalez@FLFirstRealty.com
                </a>
                <a href="mailto:KGonzalez@FLFirstRealty.com" className="block hover:underline">
                  KGonzalez@FLFirstRealty.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <label className="sr-only" htmlFor="cw-name">Name</label>
          <input id="cw-name" name="name" required placeholder="Name *" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-email">Email</label>
          <input id="cw-email" name="email" type="email" placeholder="Email" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-phone">Phone</label>
          <input id="cw-phone" name="phone" type="tel" placeholder="Phone" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-message">Message</label>
          <textarea id="cw-message" name="message" rows={4} placeholder="How can we help?" className={fieldClass} />
          {/* Honeypot anti-spam (oculto para humanos) */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          {status === "error" && (
            <p role="alert" className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
              {error}
            </p>
          )}
          {status === "sent" ? (
            <p className="rounded-lg bg-white/15 px-4 py-3 text-sm font-medium text-white">
              Thank you — we&apos;ll be in touch shortly.
            </p>
          ) : (
            <button
              type="submit"
              disabled={status === "sending"}
              className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/80 px-7 py-3.5 font-montserrat text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-white hover:text-ffr-navy disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Submit"}
            </button>
          )}
        </form>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK. Nota: si el tipo de retorno de `submitContactLead` no discrimina con `res.ok` (comprobar `ContactResponse` en `lib/actions.ts`), ajustar la bifurcación al tipo real y anotarlo en el reporte.

- [ ] **Step 5: Commit**

```bash
git add components/site/home/HappyClients.tsx components/site/home/Partnerships.tsx components/site/home/ConnectWithUs.tsx
git commit -m "feat(portada): happy clients con marquee de inercia, asociaciones y contacto al CRM

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Header y footer con identidad FFR

**Files:**
- Modify: `components/site/SiteHeader.tsx`
- Modify: `components/site/SiteFooter.tsx`

**Interfaces:**
- Consumes: logo `/ffr/00_logo-floridian-white.png`.
- Produces: header/footer navy FFR con navegación en inglés (mismos hrefs).

- [ ] **Step 1: Reescribir `components/site/SiteHeader.tsx`**

Mantener la estructura actual (sticky, menú móvil con `useState`) cambiando estética y textos. Contenido nuevo completo:

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

const NAV = [
  { href: "/propiedades", label: "Listings" },
  { href: "/valuacion", label: "Home Valuation" },
  { href: "/mapa", label: "Map" },
  { href: "/contacto", label: "Contact" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ffr-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={150}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-montserrat text-sm text-white/80 transition-colors duration-[var(--dur-fast)] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/admin" className="text-sm text-white/60 transition-colors hover:text-white">
            Team access
          </Link>
          <Link
            href="/valuacion"
            className="rounded-full border border-white/70 px-4 py-2 font-montserrat text-sm font-semibold text-white transition-colors duration-[var(--dur-fast)] hover:bg-white hover:text-ffr-navy"
          >
            What&apos;s my home worth?
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 md:hidden"
        >
          <span className="text-lg leading-none text-white">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ffr-navy px-5 pb-5 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 font-montserrat text-sm text-white/85 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10"
            >
              Team access
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
```

> IMPORTANTE: antes de reescribir, leer el archivo actual y conservar cualquier lógica no descrita aquí (p. ej. cierre del menú al navegar). El código de arriba ya replica el patrón actual (`useState` + `onClick`).

- [ ] **Step 2: Reescribir `components/site/SiteFooter.tsx`**

Leer el footer actual primero. Sustituir por una versión compacta FFR (los datos completos de contacto viven en la sección `ConnectWithUs` de la portada):

```tsx
import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="bg-ffr-navy text-white/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={130}
            height={35}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-sm">
          Floridian First Realty | 305.667.5235 | 710 S. Dixie Hwy #100, Coral Gables, FL 33146
        </p>
        <Link href="/contacto" className="text-sm underline-offset-4 hover:underline">
          Contact
        </Link>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add components/site/SiteHeader.tsx components/site/SiteFooter.tsx
git commit -m "feat(portada): header y footer con identidad FFR (navy, Montserrat, logo real)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Ensamblar la portada (`app/(public)/page.tsx`)

**Files:**
- Modify: `app/(public)/page.tsx` (reemplazo COMPLETO)

**Interfaces:**
- Consumes: los 9 componentes de `components/site/home/`.

- [ ] **Step 1: Reemplazar `app/(public)/page.tsx` por:**

```tsx
import type { Metadata } from "next"
import { HeroCinematic } from "@/components/site/home/HeroCinematic"
import { BrandStatement } from "@/components/site/home/BrandStatement"
import { ServiceCategories } from "@/components/site/home/ServiceCategories"
import { HeartOfFFR } from "@/components/site/home/HeartOfFFR"
import { Testimonials } from "@/components/site/home/Testimonials"
import { ValuationMagnet } from "@/components/site/home/ValuationMagnet"
import { HappyClients } from "@/components/site/home/HappyClients"
import { Partnerships } from "@/components/site/home/Partnerships"
import { ConnectWithUs } from "@/components/site/home/ConnectWithUs"

// Metadatos SEO reales del sitio del cliente (literales del scrape).
export const metadata: Metadata = {
  title: "Miami Real Estate Agents | Floridian First Realty | Coral Gables",
  description:
    "Floridian First Realty puts it's clients first by providing specialized agents in residential, commercial, and luxury real estate. Buy, Sell, and Invest in Florida's Real Estate Market with Floridian First Realty.",
}

// La portada ya no consulta la BD: puede prerenderizarse estática.
export default function HomePage() {
  return (
    <>
      <HeroCinematic />
      <BrandStatement />
      <ServiceCategories />
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

> Nota: se elimina `export const dynamic = "force-dynamic"` y los imports de `lib/queries` — la nueva portada no lee la BD (mejor LCP). El título de la pestaña usa el template del root layout; el `title` absoluto de esta página lo sobreescribe.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: OK; la ruta `/` aparece como `○ (Static)` en el route table (ya no `ƒ`).

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/page.tsx"
git commit -m "feat(portada): ensamblar las 9 secciones con contenido real y SEO del cliente

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Verificación final

**Files:** —

- [ ] **Step 1: Suite completa + build**

Run: `npm test`
Expected: PASS (35/35: los 31 previos + 4 de motion-config).

Run: `npm run build`
Expected: OK; `/` estática; sin warnings nuevos.

- [ ] **Step 2: Verificación en navegador (dev server)**

Arrancar `npm run dev` y verificar en el navegador (o guiar al usuario):
1. Hero: al hacer scroll el video avanza (o la imagen hace zoom si no hay video); el titular se revela por palabras; CTAs visibles y con hover animado.
2. Secciones: reveals al entrar en viewport; parallax en la foto de Michelle & Kevin y en el bloque navy de valuación.
3. Marquee de Happy Clients: gira solo, se puede agarrar y lanzar con inercia.
4. Formulario Connect With Us: enviar un lead de prueba y confirmarlo en `/admin/leads`.
5. DevTools → Rendering → "Emulate prefers-reduced-motion": recargar; la página completa se ve estática y legible (sin scrub/parallax/reveals) y el video no scrubbea.
6. Viewport móvil (375px): sin parallax/scrub/inercia; layout impecable.
7. Teclado: tab hasta el formulario y CTAs con focus visible.

- [ ] **Step 3: Commit final (si hubo ajustes) y resumen**

```bash
git add -A && git commit -m "fix(portada): ajustes de la verificación final" || echo "sin cambios"
```

---

## Self-Review (cobertura del spec)

- §1-decisiones (frontend real/inglés/identidad pura/CTA/video stock/alcance completo) → Tasks 1, 7, 8, 12. ✅
- §3 identidad (tokens FFR + Montserrat + header/footer) → Tasks 1, 11. ✅
- §4 assets (22 imágenes a `public/ffr/`, video best-effort documentado como placeholder) → Tasks 1, 7. ✅ (Desviación Blob→public/ y sin-ffmpeg documentadas en Global Constraints.)
- §5 nueve secciones con contenido literal → Tasks 8, 9, 10, 12. ✅
- §6 capa de movimiento (config pura + provider + 5 componentes de efecto, gates, degradación) → Tasks 2–6. ✅ (AnimatedCta se implementó como CSS puro — cumple "micro-animación <250ms" sin cargar JS; decisión de simplicidad.)
- §7 formulario → `submitContactLead` + honeypot → Task 10. ✅
- §9 testing (unit de motion-config, gates tsc/build por tarea, verificación en navegador con reduced-motion y móvil) → Tasks 2 y 13. ✅
- §10 riesgos: seek de video (fallback en ScrubHero), SplitText post-mount (useGSAP + enabled tras mount), peso (video ≤8MB, GSAP solo en público). ✅
- Tipos consistentes: `MotionState`/`motionState` (T2↔T3), `useMotion` (T3↔T4/5/6), `HERO_VIDEO_SRC/HERO_POSTER/HERO_POSTER_ALT` (T7↔T8), firmas de componentes sin props (T8-10↔T12). Sin placeholders TBD/TODO.
