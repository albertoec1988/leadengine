# Referencia de efectos visuales — Análisis de rideradian.com

> **Qué es este documento.** Un registro (memoria) de todos los efectos visuales, transiciones y técnicas de animación detectados en el sitio **rideradian.com**, más una guía de **cómo aplicarlos** al proyecto que tenemos en desarrollo (la plataforma **LeadEngine** para Floridian First Realty: frontend público de captación + panel de administración). Sirve como material de referencia para que Claude Code replique el nivel de acabado — **adaptado a nuestro contexto inmobiliario**, no copiado tal cual.
>
> **Cómo se obtuvo.** Inspección en vivo del DOM, de los recursos cargados y de las librerías activas en memoria del navegador, más observación del comportamiento real. Las librerías están confirmadas (activas en runtime); las técnicas se infieren de la estructura del DOM y sus atributos. La lógica exacta vive en bundles JS minificados, así que la implementación interna es una lectura fundamentada, no una copia literal del código.

---

## 1. Stack tecnológico detectado

El sitio está construido en **Webflow**, pero **no** usa las interacciones nativas de Webflow (no existe ni un `data-w-id`). Todo el movimiento está programado a mano sobre un stack profesional:

| Librería | Versión | Para qué se usa |
|---|---|---|
| **GSAP** | 3.15.0 | Motor central de todas las animaciones |
| **ScrollTrigger** (plugin GSAP) | — | Animaciones ligadas a la posición del scroll |
| **SplitText** (plugin GSAP) | — | Dividir texto en palabras/letras para revelarlas escalonadas |
| **Flip** (plugin GSAP) | — | Transiciones suaves entre dos estados de layout |
| **DrawSVGPlugin** (plugin GSAP) | — | Trazado/dibujado progresivo de líneas SVG |
| **Draggable + InertiaPlugin** (GSAP) | — | Arrastre con inercia física (marquees "lanzables") |
| **Observer, CustomEase, ModifiersPlugin** | — | Utilidades de scroll, curvas de easing propias, modificadores |
| **Lenis** | — | Smooth scroll (desplazamiento suave e inercial) |
| **Barba.js** | — | Transiciones entre páginas sin recargar (tipo SPA) |
| **Swiper** | — | Carruseles / sliders |
| **jQuery 3.5.1** | — | Dependencia base de Webflow |
| **Bunny.net Stream** | — | Streaming de video (hero y reproductores) |

**Lectura clave:** el "secreto" no es una sola librería mágica, sino la combinación **GSAP + ScrollTrigger + Lenis** orquestada a mano, con el video del hero controlado por scroll.

---

## 2. Catálogo de efectos (qué hace cada uno)

### 2.1 Hero de video "scrubbed" y fijado (pinned) — *el efecto estrella*
La sección hero mide ~2.380 px de alto, pero contiene un bloque con `position: sticky` que queda **clavado en pantalla** mientras se hace scroll. Dentro hay un `<video>` de fondo, un `<canvas>` y una capa de overlay. El video **no se reproduce por tiempo, sino por scroll**: cada fotograma se muestra según cuánto has bajado (*scroll scrubbing*). Se detectaron incluso los assets "Video Frame Extractor" (fotogramas extraídos que se dibujan en el canvas para fluidez). Efecto resultante: el producto "cobra vida" y rota/avanza a medida que el usuario baja.
**Atributos DOM:** `hero__sticky`, `hero__canvas`, `hero__video`, `hero__overlay`.

### 2.2 Parallax por capas
Elementos con `data-parallax` + `data-parallax-start` / `data-parallax-end` (ej. de `15` a `-15`). ScrollTrigger los desplaza a distinta velocidad respecto al scroll → sensación de profundidad. Incluye `data-parallax-disable` para desactivarlo en móvil.

### 2.3 Texto revelado con SplitText
Titulares y enlaces con `data-split="words"`, `data-split-hover`, `data-split-hover-duration`. El texto se parte en palabras/letras y aparece de forma **escalonada (stagger)** al entrar en viewport o en hover — el clásico efecto de líneas que "suben" y se revelan tras una máscara.

### 2.4 Marquees arrastrables con inercia
~15 cintas deslizantes (`draggable-marquee`) con `data-direction`, `data-duration="40"`, `data-multiplier="35"`. Bucle infinito y, gracias a Draggable + InertiaPlugin, se pueden **agarrar y lanzar**: siguen girando con desaceleración física realista.

### 2.5 Botones con micro-animaciones
25 elementos con `data-button-anim-target`: el texto y el icono-flecha dentro del botón se animan por separado en hover (el texto se desplaza, la flecha se reposiciona).

### 2.6 Reproductores de video propios + lightbox
`data-player-control`, `data-player-src`, `data-player-autoplay`, `data-bunny-lightbox-control`, `data-mini-showreel-status`: reproductor personalizado sobre Bunny.net, con showreel en miniatura que se expande a pantalla completa en un lightbox.

### 2.7 Sección USP interactiva (contenido sincronizado)
7 bloques `data-usp-item` emparejados con `data-usp-media`: al enfocar cada punto de venta, cambia la imagen/video asociada. Patrón "sticky + contenido que cambia" típico de páginas de producto premium.

### 2.8 Menú y modales animados por estados
Sistema `data-menu` (wrap/toggle/panel/item/close) y `data-modal-target`, con aperturas animadas por GSAP, `backdrop-filter` (desenfoque de fondo) y `clip-path` (revelados con forma).

### 2.9 Transiciones de página sin recarga
**Barba.js** (`data-barba-namespace="home"`): al navegar entre páginas no se recarga el navegador; se hace una transición animada (fade/wipe) entre vistas.

### 2.10 Detalles de acabado
- **Smooth scroll global** con Lenis (`<html class="lenis">`).
- `will-change` en 26 elementos → animación sin tirones.
- Temas por sección: alternancia `theme-dark` / `theme-light`.
- 81 paths SVG animables (DrawSVG) para trazados de líneas/iconos.
- `mask-image` para revelados con degradado; `backdrop-filter` y `clip-path` puntuales.

---

## 3. Cómo aplicarlo a NUESTRO proyecto (LeadEngine)

**Regla de oro: adaptar, no copiar.** Radian es una landing de producto (una moto) con fines cinematográficos. Nosotros tenemos **dos superficies distintas** con necesidades distintas:

### 3.1 Frontend público de captación (aquí SÍ va lo cinematográfico)
Es nuestra "landing" para atraer y convertir. Aquí conviene un acabado similar al de Radian, reinterpretado para inmobiliaria:

- **Hero scrubbed →** en vez de una moto, un recorrido cinematográfico por una propiedad destacada (o un fly-through de Coral Gables) controlado por scroll, con la sección fijada.
- **Parallax por capas →** en las secciones de propiedades destacadas y en el bloque de valuación IA, para dar profundidad.
- **SplitText reveal →** en titulares clave ("Descubre cuánto vale tu casa", nombres de zonas) al entrar en viewport.
- **USP interactiva →** ideal para presentar los beneficios de trabajar con Floridian First (respuesta rápida, valuación IA, seguimiento) con media sincronizada.
- **Marquee →** franja con logos de zonas/portales o testimonios en bucle.
- **Botones con micro-animación →** en los CTAs principales (Valuar mi casa, Contactar).
- **Transiciones Barba →** entre landing, detalle de propiedad y formulario, sin recargas.

### 3.2 Panel de administración interno (aquí va lo SUTIL, no lo cinematográfico)
El panel es una herramienta de trabajo para un equipo comercial: **prioridad a la velocidad y la claridad, no al espectáculo**. Aquí se usan las mismas librerías pero con moderación:

- **Micro-interacciones** en botones, filas del CRM y tarjetas (hover, focus) — sutiles y rápidas (<250 ms).
- **Transiciones entre vistas** (Dashboard → Leads → Pipeline) suaves tipo fade/slide corto, sin bloquear al usuario.
- **Animación de datos**: contadores de KPIs que suben, barras/donut que se dibujan al cargar, tarjetas que entran escalonadas.
- **Pipeline (kanban)**: arrastrar-soltar con inercia ligera (Draggable) al mover oportunidades entre etapas.
- **Feedback de estado**: aparición animada de alertas/toasts, badges de "lead caliente" que pulsan discretamente.
- **NADA de scroll-scrubbing pesado, videos de fondo ni parallax agresivo** en el panel: distraen y penalizan el rendimiento en una app de uso diario.

### 3.3 Diagramas y visualizaciones
Para los "diagramas" (embudo, pipeline, analítica), animarlos con **entrada progresiva** (las barras crecen, las líneas se trazan con DrawSVG, el donut se rellena) al entrar en viewport. Datos siempre reales o claramente marcados como ilustrativos.

---

## 4. Consideraciones no negociables al replicar

- **Rendimiento primero.** El scrubbing de video y el parallax deben ir optimizados (video comprimido/streaming, `will-change`, animar solo `transform`/`opacity`). Si baja de 60 fps, se simplifica.
- **Accesibilidad.** Respetar `prefers-reduced-motion`: si el usuario pide menos movimiento, desactivar scrubbing, parallax y reveals, dejando el contenido legible y estático.
- **Móvil.** Igual que Radian usa `data-parallax-disable`, en móvil se apagan los efectos pesados. El panel debe ser plenamente usable en móvil sin animaciones costosas.
- **Degradación elegante.** Si una librería no carga, el contenido sigue visible y funcional (nunca una pantalla en blanco por un fallo de animación).
- **Marca propia.** Aplicar la identidad de LeadEngine/Floridian First (navy `#0F2A47`, dorado `#F4A24C`, teal `#17A2A2`), no la estética de Radian.
- **Honestidad de contenido.** Cualquier dato de propiedades, métricas o leads mostrado en demos va marcado como ejemplo si no es real.

---

## 5. Resumen de una línea

rideradian.com = **Webflow supercargado a mano con GSAP + ScrollTrigger + Lenis + Barba + Swiper**, cuyo sello es un **hero de video controlado por scroll y fijado**, con parallax por capas, texto dividido con reveal escalonado, marquees con inercia física y transiciones de página sin recarga. Para LeadEngine: lo cinematográfico va en el **frontend público**; en el **panel** solo micro-interacciones sutiles y rápidas.

---

*Preparado por AMAAC Tech — División de Servicios Digitales · Referencia interna para el desarrollo de LeadEngine (Floridian First Realty)*
