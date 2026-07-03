# Diseño Fase 2: Mapa guiado por scroll, favoritas, seed real, mapa en listado/footer y redes sociales

**Fecha:** 2026-07-03
**Estado:** Aprobado para plan (decisiones del usuario incorporadas)
**Base:** portada v1 ya en `main` (spec `2026-07-03-portada-ffr-cinematografica-design.md`)

## 1. Objetivo

Cinco mejoras pedidas por el usuario tras ver la portada v1 en vivo:

1. **Sección "mapa guiado por scroll"** en la portada: mapa de Miami con las propiedades geolocalizadas, miniatura identificativa, y un **camino que conecta hasta 10 "favoritas"** dibujándose con la transición del scroll. Requiere **botón de favoritas en el backend** (admin) para curar esa lista.
2. **Mapa en el listado `/propiedades`**: vista mapa de la ciudad con las propiedades aún en venta, integrada como opción del filtro.
3. **Seed con datos reales**: reemplazar las 15 propiedades demo por las **9 reales** del scrape (direcciones auténticas + fotos `listado-01..09.png`).
4. **Footer**: mapa con la ubicación de la oficina principal (710 S. Dixie Hwy #100, Coral Gables).
5. **Botones de redes sociales** para interacción directa.

### Decisiones cerradas con el usuario
- Mapa guiado: **tras las categorías** (entre `ServiceCategories` y `HeartOfFFR`).
- Seed: **reemplazar** demo por las 9 reales.

### Fuera de alcance
- Traducir las páginas internas al inglés (follow-up ya registrado).
- IDX/MLS real; los precios de las propiedades reales no están publicados → **estimaciones marcadas como ilustrativas**.

## 2. Modelo de datos

En `prisma/schema.prisma` (fuente), `model Property` gana:

```prisma
  isFeatured    Boolean  @default(false) // "favorita": aparece en el recorrido del mapa de la portada
  featuredOrder Int      @default(0)     // orden dentro del recorrido (0 = primero)
```

Sin modelos nuevos. `npx prisma db push` local + `npm run pg:push` a Neon en despliegue.

## 3. Backend admin: botón de favoritas

- `lib/property-actions.ts`: nueva server action `toggleFeatured(id: string): Promise<{ ok: boolean }>` — admin-only (gate `getSessionUser().role === "admin"`), invierte `isFeatured`; al activar asigna `featuredOrder = max(featuredOrder)+1`; revalida `/admin/propiedades` y `/`.
- `app/admin/(dash)/propiedades/page.tsx`: columna con botón estrella (★ dorado si `isFeatured`, ☆ gris si no) que llama a `toggleFeatured` (client component pequeño `FeaturedToggle`, patrón de `PropertyStatusControl`).

## 4. Seed real (reemplaza demo)

- Copiar `docs/floridian-first-scrape/imagenes/internas/listado-0{1..9}.png` → `public/ffr/listings/` (≤650KB c/u, aceptable; comprimir con sharp si alguna supera 700KB).
- `prisma/seed.ts`: sustituir el array de 15 demo por las **9 reales** con:
  - `title` = descriptivo del scrape (p. ej. "Restaurant for Sale — E Las Olas Blvd"), `address` literal del scrape.
  - `zone`: mapear por dirección (Coral Gables/Kendall/Miami/Fort Lauderdale — añadir las zonas nuevas a `ZONES` en `lib/queries.ts` y al form si hace falta: "Miami", "Fort Lauderdale").
  - `lat/lng`: coordenadas aproximadas geocodificadas a mano por dirección (tabla fija en el seed; precisión a nivel de manzana es suficiente).
  - `price`: estimación **ilustrativa** (comentario en el seed y sufijo en descripción no visible; la UI ya no marca precios como reales/irreales — aceptado, es demo).
  - `photoUrl` = `/ffr/listings/listado-0N.png`; además crear su `PropertyImage` primaria (galería consistente).
  - `bedrooms/bathrooms/areaSqft`: valores plausibles por tipo (0 dormitorios para restaurantes/comercial).
  - Los 4-5 restaurantes/comerciales: `zone` correspondiente y `status: "for_sale"`.
  - Marcar `isFeatured: true` con `featuredOrder` 0..8 en las 9 (la portada tomará hasta 10).
  - Leads/actividades/oportunidades del seed se regeneran contra las nuevas propiedades (el seed ya crea todo junto).
- Ejecución: local `npx prisma db push && npm run db:seed` (SQLite se regenera); producción: `npm run pg:push` + `pg:seed` contra Neon (borra/upserta según el seed — el seed actual hace `create`; añadir limpieza previa de tablas dependientes con `deleteMany` en orden FK-safe para que sea re-ejecutable).

## 5. Portada: sección `MapJourney` (mapa guiado por scroll)

**Ubicación:** `components/site/home/MapJourney.tsx`, renderizada en `page.tsx` entre `ServiceCategories` y `HeartOfFFR`.

**Datos:** la page (server) consulta `prisma.property.findMany({ where: { isFeatured: true, status: "for_sale" }, orderBy: { featuredOrder: "asc" }, take: 10, include: { images ... } })` y pasa a `MapJourney` un array `{ id, title, lat, lng, photoUrl, priceLabel, href }`. Si hay <2 favoritas, la sección no se renderiza (guard en la page).

**Comportamiento (desktop, `heavyEnabled`):**
- Sección alta (`h-[300vh]`) con bloque sticky `h-svh` (mismo patrón que `ScrubHero`).
- Dentro del sticky: **mapa Leaflet no interactivo** (dragging/zoom/scroll desactivados; tiles OSM; atribución visible) + **overlay SVG** con la polilínea que conecta las favoritas en orden + **tarjeta miniatura** (foto, título, precio ilustrativo, link al detalle).
- Un timeline GSAP con `ScrollTrigger scrub` mapea el progreso de scroll a: (a) índice de la propiedad activa → `map.setView(coords, zoom, { animate: false })` por pasos interpolados (flyTo manual interpolando lat/lng/zoom con el progreso), (b) **trazado progresivo del camino**: la polilínea SVG usa `stroke-dasharray/dashoffset` proporcional al progreso (efecto DrawSVG sin plugin), (c) la tarjeta activa hace crossfade (opacity/translate) al cambiar de propiedad.
- Los marcadores: `L.circleMarker` navy con el activo resaltado (radio mayor + blanco).
- Proyección SVG↔mapa: en cada frame del scrub se recalculan los puntos con `map.latLngToContainerPoint` (barato para ≤10 puntos); el SVG es `absolute inset-0 pointer-events-none`.

**Fallbacks:**
- `heavyEnabled=false` (móvil/reduced): sin pinned ni scrub — se renderiza el mapa estático (vista que encuadra todas las favoritas con `fitBounds`) + una fila horizontal desplazable de miniaturas debajo. Altura normal (`h-auto`), cero dead-scroll (lección de v1).
- Sin JS/fallo de Leaflet: la sección muestra las miniaturas en grid (contenido server-rendered siempre visible: el grid de tarjetas es el contenido base; el mapa se monta encima al hidratar).

**Título de sección:** "Explore our featured listings" con `RevealText` (inglés, coherente con la portada).

## 6. Listado `/propiedades`: vista mapa como opción del filtro

- La barra de filtros existente (zona/estado/dormitorios) gana un cuarto control: **toggle Vista `Lista | Mapa`** (param `view=map|list`, default `list`), como links/botones que preservan los demás params.
- Con `view=map`: en lugar del grid de tarjetas se renderiza el `PropertyMap` existente (`components/site/PropertyMap.tsx`) con los mismos resultados filtrados (por defecto muestra TODAS las filtradas; el usuario pidió "aún por vender" → cuando no hay filtro de estado explícito, la vista mapa filtra `status=for_sale`).
- `ZONES` en filtros se amplía con las zonas nuevas del seed real.
- Los popups del mapa ya enlazan al detalle (`href`) — se mantiene.

## 7. Footer: mapa de la oficina

- `components/site/SiteFooter.tsx` gana un bloque superior con **mapa estático de OpenStreetMap** (imagen `next/image` — proveedor de tiles estáticos: usar un `iframe` de `openstreetmap.org/export/embed.html` con marker en 25.7145,-80.2731 aprox. (710 S Dixie Hwy) — iframe lazy (`loading="lazy"`) para no costar LCP; alto ~220px, ancho completo del contenedor, borde redondeado).
  - Decisión: iframe OSM embed (cero JS extra, cero API key) en vez de Leaflet en el footer (peso) o Google Maps (key). Enlace "Get directions →" a `https://www.openstreetmap.org/?mlat=...&mlon=...` (o Google Maps URL pública, sin key: `https://maps.google.com/?q=710+S+Dixie+Hwy+%23100+Coral+Gables+FL+33146`) — usar el de Google para utilidad real de navegación.
- El footer mantiene la línea literal + logo + Contact.

## 8. Botones de redes sociales

- **Configurables desde el admin**: `lib/settings-keys.ts` gana 4 claves: `instagramUrl`, `facebookUrl`, `youtubeUrl`, `tiktokUrl` (type "url", labels "Instagram", "Facebook", "YouTube", "TikTok"). El tab General ya las renderiza automáticamente (data-driven).
- `components/site/SocialLinks.tsx` (server): lee `getSettings()` y renderiza solo las redes con URL definida — iconos SVG inline (sin dependencia de librería de iconos), blancos, con `aria-label`, hover con lift.
- Se muestra en el **footer** (junto al bloque de contacto) y en la sección **Connect With Us** de la portada (bajo los emails).
- Seed: sembrar las 4 claves con las URLs reales del cliente si se conocen; si no, vacías (los iconos no aparecen hasta configurarlas). El scrape no capturó redes → se siembran vacías y el admin las completa en Configuración → General.

## 9. Testing

- `lib/` puros nuevos: helper `buildJourney(points)` (ordena, calcula segmentos y longitudes del path para el dashoffset) — con tests vitest (orden, longitudes, casos 0/1 puntos).
- Acciones: `toggleFeatured` gate admin (lógica en acción; validado por review, patrón existente).
- Verificación en navegador: recorrido del mapa con scroll (desktop), fallback móvil sin dead-scroll, toggle Lista/Mapa en `/propiedades` conservando filtros, footer con mapa y directions, iconos sociales aparecen al configurar URLs en admin.

## 10. Despliegue

1. `prisma/schema.prisma` → push local + `npm run pg:push` (Neon).
2. `pg:seed` contra Neon (nuevo seed real; borra datos demo previos — avisar al usuario que Neon se reseedea).
3. Push a `main` → Vercel.
