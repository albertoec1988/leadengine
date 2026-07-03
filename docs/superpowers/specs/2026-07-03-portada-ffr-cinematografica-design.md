# Diseño: Portada cinematográfica FFR (contenido real + efectos nivel Radian)

**Fecha:** 2026-07-03
**Estado:** Aprobado para plan de implementación
**Repo:** `albertoec1988/leadengine` (Next.js 16.2.10, App Router, React 19, Tailwind v4)
**Material fuente:** `docs/floridian-first-scrape/` (contenido real del sitio, manifiesto, 58 imágenes descargadas, catálogo de efectos de rideradian.com)

## 1. Objetivo

Reemplazar la home pública de LeadEngine por una **nueva portada para Floridian First Realty** que use contenido 100 % real del cliente (textos literales en inglés, imágenes, testimonios, contacto) y eleve el acabado visual al nivel de rideradian.com con efectos reinterpretados para inmobiliaria. Es el frontend real (no una demo): el formulario y la valuación IA alimentan el CRM.

### Decisiones cerradas con el usuario

| Decisión | Valor |
|---|---|
| Destino | **Frontend real** — reemplaza `app/(public)/page.tsx` |
| Idioma | **Inglés** (contenido literal del cliente; el panel admin sigue en español) |
| Identidad | **Cliente pura**: navy `#00305B`, gris `#83969C`, Montserrat. SIN acentos de la paleta LeadEngine |
| CTA primario | **"What's my home worth?"** → `/valuacion` (imán de leads IA) |
| Hero | **Video stock** de Miami/Coral Gables (licencia libre, marcado como placeholder) con fallback a imagen real |
| Alcance FX | **Completo tipo Radian**: hero pinned+scrubbed, parallax, reveals, marquee con inercia, micro-animaciones, smooth scroll |

### Fuera de alcance

- Rediseño de las páginas internas públicas (`/propiedades`, `/valuacion`, `/mapa`, `/contacto`) más allá del header/footer compartidos.
- Transiciones tipo Barba.js (App Router ya navega sin recarga; no se añade librería de transiciones en esta entrega).
- Sección USP interactiva sincronizada (efecto 2.7 de la referencia) — deseable futuro, no imprescindible.
- Cambios en el panel admin.
- Contenido bilingüe.

## 2. Stack de movimiento (enfoque A, aprobado)

- **GSAP 3 + plugins** (ScrollTrigger, SplitText, Draggable, InertiaPlugin) — gratuitos desde 2024 — con **`@gsap/react`** (`useGSAP`) para el ciclo de vida en React 19.
- **Lenis** para smooth scroll global del frontend público.
- **NO Barba.js** (el router de Next cubre la navegación sin recarga).
- Solo se carga en el frontend público (el layout `app/(public)/layout.tsx` monta el provider); el admin no importa nada de esto.
- Solo se animan `transform`/`opacity`; `will-change` puntual; objetivo 60 fps.

## 3. Identidad visual FFR

- Tokens nuevos en `app/globals.css` (los existentes NO se tocan):
  - `--ffr-navy: #00305B` (+ variante `--ffr-navy-soft` para overlays)
  - `--ffr-slate: #83969C`
  - Mapeados en `@theme inline` como `--color-ffr-navy`, `--color-ffr-slate` para clases Tailwind (`bg-ffr-navy`, `text-ffr-slate`…).
- **Montserrat** vía `next/font/google` (subsets latin; pesos 400, 600, 800) expuesta como variable CSS `--font-montserrat` y aplicada al árbol público (`app/(public)/layout.tsx`). Cuerpo: mantiene la sans del sistema/Arial (fiel al sitio original).
- Header/footer públicos (`components/site/SiteHeader.tsx`, `SiteFooter.tsx`) se restilizan a identidad FFR: navy `#00305B`, Montserrat, logo blanco real (`00_logo-floridian-white.png`). El footer adopta el bloque "Connect With Us" con los datos reales.
- Nota: las páginas internas públicas heredan header/footer restilizados; sus contenidos (tarjetas, etc.) siguen con los tokens actuales — aceptado, la unificación completa es trabajo futuro.

## 4. Assets

- Copiar de `docs/floridian-first-scrape/imagenes/` a **`public/ffr/`** las imágenes de portada necesarias (~20): logo blanco, hero, 3 categorías, foto Michelle & Kevin, 12 logos de clientes, 6 logos de asociaciones. Servidas con `next/image` (el hero con `priority`).
- **Video hero:** clip stock aéreo de Miami/Coral Gables (Pexels o Coverr, licencia libre y gratuita), re-comprimido a H.264 ~1080p, objetivo ≤ 6 MB, sin audio. Subido a **Vercel Blob** (store ya operativo) y referenciado por URL; `poster` = `01_hero-invested-in-you.jpg`. Comentario en código: `// PLACEHOLDER: video stock, sustituir por material del cliente`. Si en el entorno de build no se puede descargar/subir el video, la portada entra en modo imagen (el slot queda listo) y se documenta el paso manual.
- Los CSV/manifiestos del scrape son la referencia de alt-texts.

## 5. Estructura de la portada (9 secciones, `app/(public)/page.tsx`)

Server component (`force-dynamic` se mantiene). Cada sección es un componente en `components/site/home/`:

1. **`HeroCinematic`** — sección de ~250vh de alto con bloque sticky interno. Video de fondo scrubbed por scroll (ver §6.2). Titular "INVESTED IN YOU." con reveal escalonado inicial; subtítulo "SERVICE | ETHICS | COMMITMENT | EXPERIENCE". CTAs: primario "What's my home worth?" → `/valuacion`; secundario "Property Search" → `/propiedades`. Overlay navy para contraste.
2. **`BrandStatement`** — titular "FLORIDIAN FIRST REALTY" + párrafo literal "At Floridian First, real estate is not just about the transaction…" con `RevealText` al entrar en viewport.
3. **`ServiceCategories`** — 3 tarjetas RESIDENTIAL / COMMERCIAL / LUXURY con las fotos reales; hover: micro-zoom de imagen + lift de tarjeta; link a `/propiedades`.
4. **`HeartOfFFR`** — bio literal de Michelle & Kevin (3 párrafos, firma "Michelle and Kevin") + su foto real; `ParallaxLayer` en foto vs texto.
5. **`Testimonials`** — testimonio literal de Maria Rod-Rey en bloque destacado (cita grande, reveal); estructura de lista preparada para más testimonios (carrusel futuro).
6. **`ValuationMagnet`** ⭐ (aporte LeadEngine) — "What's your home worth?" + subtexto ("Get an instant AI-powered estimate — free."), CTA con micro-animación → `/valuacion`. Fondo navy con `ParallaxLayer` decorativo. Es el bloque de conversión clave.
7. **`HappyClients`** — "SOME OF OUR HAPPY CLIENTS": `InertiaMarquee` con los 12 logos reales (bucle infinito, arrastrable con inercia).
8. **`Partnerships`** — "PARTNERSHIPS & ASSOCIATIONS": 6 logos con fade-in escalonado estático (sobriedad para credenciales).
9. **`ConnectWithUs`** — datos reales (710 S. Dixie Hwy #100, Coral Gables · 305.667.5235 · MGonzalez@/KGonzalez@FLFirstRealty.com) + formulario (name, email, phone, message) que llama a **`submitContactLead` de `lib/actions.ts`** (ya existe; source `"web"`, normaliza y puntúa el lead hacia el CRM). Honeypot anti-spam simple (campo oculto; si viene relleno, se descarta en silencio).

## 6. Capa de movimiento (`components/motion/`)

### 6.1 Núcleo

- **`lib/motion-config.ts`** — módulo puro (testeable con vitest, que solo recoge `lib/**`): duraciones, easings, distancias, umbral móvil (`< 768px`), y helper `motionEnabled({ reducedMotion, isMobile, heavy })` que decide si un efecto corre (los "heavy" — scrub, parallax, inercia — se apagan en móvil; TODOS se apagan con `prefers-reduced-motion`). Sin imports de `gsap` ni `next` (puro).
- **`MotionProvider.tsx`** (client) — monta Lenis, registra plugins GSAP una vez, observa `prefers-reduced-motion` y viewport, y expone `{ enabled, heavyEnabled }` por contexto. Envuelve SOLO el layout público.

### 6.2 Componentes de efecto

- **`ScrubHero.tsx`** — dentro de la sección alta, bloque `position: sticky`; ScrollTrigger con `scrub` mapea el progreso de scroll a `video.currentTime` (seek sobre video H.264 con keyframes densos; sin extractor de frames — simplificación aceptada frente a Radian). Con `heavyEnabled=false` o error de carga del video: muestra `next/image` del hero estático con el mismo overlay (idéntico layout).
- **`RevealText.tsx`** — SplitText por palabras/líneas con máscara y stagger al entrar en viewport (`once: true`). Con motion off: texto visible normal (el split ni se aplica → sin FOUC).
- **`ParallaxLayer.tsx`** — `data-speed` (-1..1) → `yPercent` vía ScrollTrigger scrub. Off en móvil/reduced.
- **`InertiaMarquee.tsx`** — pista duplicada para bucle infinito con `xPercent` en `requestAnimationFrame` GSAP ticker + Draggable con InertiaPlugin para lanzarla. Off: scroll horizontal nativo con los logos visibles.
- **`AnimatedCta.tsx`** — botón/link con texto y flecha animados por separado en hover (<250 ms).

### 6.3 Pautas transversales (no negociables, del prompt)

- Contenido server-rendered SIEMPRE visible sin JS; los efectos solo mejoran (progresivo, no bloqueante; sin esconder texto en espera de animación).
- Degradación elegante: fallo de video/librería → contenido estático correcto, nunca pantalla en blanco.
- `prefers-reduced-motion` respetado desde el inicio; foco de teclado y contraste (overlay navy con ratio AA sobre el video).
- Solo `transform`/`opacity`; nada de animar layout.
- Configuración centralizada en `motion-config.ts`; comentar el porqué de cada efecto complejo.

## 7. Datos y formulario

- El formulario `ConnectWithUs` reutiliza `submitContactLead` (`lib/actions.ts:113`) sin cambios de backend: `{ name, email?, phone?, message?, source: "web" }`. Validación existente (nombre + email o teléfono). Estados: enviando / éxito ("Thank you — we'll be in touch shortly.") / error accesible (`role="alert"`).
- Sin migraciones de BD. Sin cambios en el panel.

## 8. Dependencias y archivos

**Nuevas deps:** `gsap`, `@gsap/react`, `lenis`.

**Crear:**
- `lib/motion-config.ts` + test `lib/motion-config.test.ts` (módulo puro; los componentes de efecto viven en `components/motion/`)
- `components/motion/MotionProvider.tsx`, `ScrubHero.tsx`, `RevealText.tsx`, `ParallaxLayer.tsx`, `InertiaMarquee.tsx`, `AnimatedCta.tsx`
- `components/site/home/HeroCinematic.tsx`, `BrandStatement.tsx`, `ServiceCategories.tsx`, `HeartOfFFR.tsx`, `Testimonials.tsx`, `ValuationMagnet.tsx`, `HappyClients.tsx`, `Partnerships.tsx`, `ConnectWithUs.tsx`
- `public/ffr/*` (assets copiados)
- `scripts/prepare-hero-video.md` o paso documentado para el video (descarga stock + compresión + subida a Blob)

**Modificar:**
- `app/(public)/page.tsx` (reemplazo por las 9 secciones; conserva `export const dynamic = "force-dynamic"` y metadata SEO: título "Miami Real Estate Agents | Floridian First Realty | Coral Gables" + meta descripción real del sitio)
- `app/(public)/layout.tsx` (MotionProvider + fuente Montserrat)
- `components/site/SiteHeader.tsx`, `SiteFooter.tsx` (identidad FFR)
- `app/globals.css` (tokens FFR)
- `next.config.ts` solo si el video se sirve desde Blob con `<video>` (no requiere remotePatterns; solo imágenes las requieren — ya cubierto)

## 9. Testing y verificación

- **Unit (vitest):** `lib/motion-config.ts` — `motionEnabled` en las 8 combinaciones (reduced × mobile × heavy); tokens de duración/easing definidos.
- **Gates por tarea:** `npx tsc --noEmit` + `npm run build`.
- **Verificación en navegador (Chrome del usuario o dev server):** hero scrub al hacer scroll, reveals al entrar en viewport, marquee arrastrable, formulario crea lead visible en `/admin/leads`, `prefers-reduced-motion` (emulado en DevTools) muestra página estática completa, viewport móvil sin efectos pesados y sin jank.
- **Accesibilidad:** navegación por teclado hasta el formulario; contraste del hero (overlay) verificado.

## 10. Riesgos

- **Seek de video por scroll depende del encoding** (keyframes): mitigado re-comprimiendo el clip con GOP corto; fallback a imagen si el seek va a saltos en pruebas.
- **SplitText + hidratación React:** aplicar splits dentro de `useGSAP` tras el mount (nunca en SSR) para no romper hidratación.
- **Peso:** GSAP+plugins+Lenis ~70 KB gz solo en público; el video via Blob no bloquea LCP (poster + `preload="metadata"`).
- **Derechos:** imágenes/logos son del cliente y sus socios (uso para su propia portada, igual que el sitio original); video stock con licencia libre documentada.
