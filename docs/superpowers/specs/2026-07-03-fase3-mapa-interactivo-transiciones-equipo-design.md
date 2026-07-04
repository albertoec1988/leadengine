# Diseño Fase 3: Mapa interactivo con pines de foto, transiciones ricas y directorio del equipo

**Fecha:** 2026-07-03 · **Estado:** Aprobado
**Base:** Fase 2 en `main` (`3a2d00f`). Decisiones del usuario: look Google **sin** API key (CARTO), mapa **interactivo libre** (fuera el scrub/camino), las **4** mejoras de transiciones, y **directorio del equipo FFR**.

## 1. `MapShowcase` — reemplaza `MapJourney`

- **Tiles CARTO Voyager**: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`, attribution `© OpenStreetMap © CARTO`, `maxZoom 20`. Estética limpia tipo Google, sin key (uso justo con atribución).
- **Pines con foto** (`L.divIcon` HTML): círculo de 52px con la foto de la propiedad (`border 3px white`, sombra, puntita triangular abajo). Entrada **escalonada** al entrar la sección en viewport: animación CSS (`scale(0)→scale(1)` con overshoot `cubic-bezier(0.34,1.56,0.64,1)`), `animation-delay = index * 90ms` (gate: solo si `enabled`; con reduced-motion aparecen sin animar).
- **Interacción**: `dragging` ON en desktop, OFF en móvil (no secuestrar el scroll táctil); `scrollWheelZoom` OFF siempre; `zoomControl` ON. Click en pin → **tarjeta flotante** (misma estética actual: foto, título, precio, "View property →" al detalle); click en el mapa la cierra. Pin activo resaltado (escala + borde navy).
- **Layout**: sección de altura normal (mapa `h-[560px]` desktop / `h-[420px]` móvil, rounded-2xl) — sin pinned, **cero dead-scroll**. Título "Explore our featured listings" + subtítulo se mantienen. La fila de tarjetas inferior se conserva SOLO en móvil (donde el drag está off) como acceso alternativo.
- **Datos**: misma query (favoritas for_sale, orden `featuredOrder`, take 10) y props `JourneyStop` renombradas a `ShowcaseStop` (mismo shape).
- **Bajas**: `components/site/home/MapJourney.tsx`, `lib/journey.ts`, `lib/journey.test.ts` se eliminan (nada más los usa; verificar con grep antes de borrar).

## 2. Transiciones ricas

### 2a. Primitiva `RevealGroup` (`components/motion/RevealGroup.tsx`)
Client wrapper que anima **los hijos directos** de un contenedor al entrar en viewport: `gsap.from(children, { y: 36, scale: 0.965, opacity: 0, duration: DUR.reveal, ease: EASE.out, stagger: STAGGER.cards, scrollTrigger: { once } })`, gated por `enabled` (contenido siempre visible sin JS). Solo transform/opacity.

Aplicación: grid de **categorías**, grid de **asociaciones** (sustituye el gsap inline de Partnerships por la primitiva — DRY), tarjeta de **testimonio**, columnas del **footer**… y los bloques de **Connect With Us**.

### 2b. Secciones con profundidad
- `BrandStatement`, `HeartOfFFR`, `ValuationMagnet`: el contenedor interno entra con `y: 60 → 0` + los fondos decorativos ya existentes (parallax) se conservan.
- **Separador de sección** `SectionDivider` (server, CSS puro): onda/diagonal SVG entre bloques de color distinto (hero→brand, testimonios→valuación navy, happy clients navy→partnerships navy no necesita). Usar en 2-3 costuras clave, sobrio.

### 2c. Hero dramático
En `ScrubHero` (modo heavy): el bloque de contenido (children) recibe un tween adicional ligado al mismo scroll: `yPercent: -35, opacity: 0.75→0, ease none` en el último 40% del pin — el titular "se despega" del video antes de soltar. Con motion off: sin cambio.

### 2d. View Transitions entre páginas
- `next.config.ts`: `experimental: { viewTransition: true }`.
- Crossfade global: envolver `{children}` del layout público con `<ViewTransition>` (import de `react`).
- **Morph compartido**: la foto de la propiedad — tarjeta del mapa/listado → hero del detalle — con `<ViewTransition name={`property-photo-${id}`}>` en ambos extremos (`PropertyCard`, tarjeta del MapShowcase, y la imagen principal de `/propiedades/[id]`). El efecto estrella del patrón (miniatura que se convierte en hero).
- Respeta reduced-motion (el navegador lo hace nativamente; añadir `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none } }` en globals).

## 3. Sección `TeamDirectory` — "Meet the Team"

- Ubicación: tras `HeartOfFFR`.
- **Honestidad**: el scrape trae 17 headshots SIN mapeo nombre↔foto confirmado → cinta/collage de fotos SIN nombres superpuestos + roster textual aparte con los 16 nombres y roles reales (`contenido-paginas-internas.md`): Michelle Gonzalez (Broker/Owner), Kevin Gonzalez (Broker/Owner), Christina Muniz (Marketing Manager), Lisa Beining, Argenid Blanco, Barbara Yanes, Greg Eversole, Karen Ramirez, Lais Same, Lillian Mas, Muriel Zerdoun, Oriana Espinoza, Otoniel Bandres, Pedro Romero, Sandra Denis, Sophia Codinach.
- Diseño: fondo `paper-2`; titular "Meet the Team" + intro literal del /about-1 ("Exceptional Living, Expertly Crafted" como eyebrow); **InertiaMarquee** (reuso) con los 17 headshots en círculos; debajo, roster en grid de 2-4 columnas (nombre en navy semibold, rol en slate cuando se conoce). CTA "Schedule a consult" → `/contacto`.
- Assets: comprimir `equipo-*.jpg` (17) con sharp a 400px/q80 → `public/ffr/team/`.

## 4. Fuera de alcance
- Página dedicada `/team` (la sección basta por ahora).
- Mapeo nombre↔foto (pendiente del cliente).
- Google Maps real con key (decidido: CARTO).

## 5. Testing/verificación
- Sin helpers puros nuevos que ameriten unit tests (se ELIMINAN los de journey; la suite baja a 35). Gates tsc+build por tarea.
- Navegador: pines con foto + stagger, click→tarjeta→detalle, morph de la foto en la navegación, hero despegue, RevealGroup en categorías/asociaciones, equipo (cinta + roster), móvil (drag off, fila de tarjetas), reduced-motion estático.
- View Transitions: verificar crossfade en Chrome; en browsers sin soporte degrada a navegación normal (aceptado).

## 6. Despliegue
Sin cambios de BD ni env. Merge → push → Vercel.
