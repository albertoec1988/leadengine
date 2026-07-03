# PROMPT GENERAL — Reelaborar la portada de Floridian First Realty

> **Cómo usar este prompt:** pégalo como mensaje en la sesión de Claude Code del proyecto LeadEngine. Debe usarse **junto con** estos materiales, que están en la misma carpeta:
> - `contenido-web.md` y `manifiesto.json` → contenido y estructura reales del sitio actual de Floridian First Realty.
> - `imagenes/` → las imágenes reales del negocio (ejecuta antes `descargar-imagenes.sh` para poblarla).
> - `Referencia-Efectos-Visuales-Radian.md` (en la carpeta del proyecto) → catálogo de efectos y transiciones a replicar, aprendido de rideradian.com.
>
> Este prompt define el *qué* y las *pautas*; las decisiones técnicas concretas son tuyas.

---

## Tu misión

Diseñar y construir una **nueva portada (home) para Floridian First Realty** que sirva como pieza de validación dentro de nuestra propuesta LeadEngine. Debe cumplir dos condiciones a la vez:

1. **Usar contenido 100 % real** del negocio (textos, marca, testimonios, contacto, imágenes) tomado de `contenido-web.md`, `manifiesto.json` y la carpeta `imagenes/`. Nada de "lorem ipsum" ni datos inventados: el cliente debe reconocer su propio negocio, mejorado.
2. **Elevar el acabado visual** al nivel de rideradian.com aplicando los efectos y transiciones descritos en `Referencia-Efectos-Visuales-Radian.md`, pero **reinterpretados para una inmobiliaria** y para nuestra marca LeadEngine.

El resultado es una portada moderna, cinematográfica y orientada a captar leads, que respeta la identidad y el contenido actual del cliente.

---

## Antes de construir: pregúntanos

No empieces a maquetar sin aclarar:
- ¿La portada es una demo independiente (HTML autónomo para la propuesta) o el arranque real del frontend público de LeadEngine?
- ¿Mantenemos el contenido en inglés (idioma actual del sitio) o lo adaptamos?
- ¿Conservamos la identidad del cliente (navy `#00305B`, Montserrat) o la fundimos con la paleta LeadEngine (navy `#0F2A47`, dorado `#F4A24C`, teal `#17A2A2`)? Recomiéndanos una dirección.
- ¿Para el hero cinematográfico tenemos video de una propiedad / de Coral Gables, o partimos de las imágenes fijas disponibles?
- ¿Qué acción queremos como conversión principal: "Valuar mi casa" (imán de leads de LeadEngine), "Property Search" o "Schedule a Consult"?

Cuando tengas respuestas, **resume tu plan y espera aprobación** antes de construir.

---

## Contenido real a reutilizar (resumen — ver `contenido-web.md` para el detalle)

- **Marca:** Floridian First Realty (FFR) · brokers **Michelle y Kevin Gonzalez**, +25 años de experiencia · Coral Gables, Miami.
- **Lema:** "Invested in you." — pilares Service · Ethics · Commitment · Experience.
- **Especialidades:** Residential, Commercial, Luxury.
- **Texto de marca y bio "At the heart of FFR"** (párrafos completos en `contenido-web.md`).
- **Testimonio real** de Maria Rod-Rey.
- **Muros de logos:** clientes felices (negocios locales) y asociaciones (NAR, Women's Council of Realtors, Coral Gables Chamber, FIU Business, Florida CCIM, Equal Housing).
- **Contacto:** 710 S. Dixie Hwy #100, Coral Gables, FL 33146 · 305.667.5235 · MGonzalez@ / KGonzalez@FLFirstRealty.com.
- **Imágenes:** 29 assets mapeados en `manifiesto.json` (hero, categorías, foto de los brokers, logos).

---

## Estructura sugerida de la nueva portada

Respeta el orden narrativo actual, mejorándolo:

1. **Hero cinematográfico** — titular "Invested in you." sobre un recorrido controlado por scroll (propiedad destacada o Coral Gables) con la sección fijada (*pinned*). CTA primario de captación (p. ej. "Valuar mi casa" o "Property Search").
2. **Presentación de marca** — el párrafo "At Floridian First..." con revelado de texto escalonado al entrar en viewport.
3. **Categorías Residential / Commercial / Luxury** — tres tarjetas con imágenes reales y micro-animación en hover.
4. **"At the heart of FFR"** — bio de Michelle y Kevin con su foto y parallax sutil por capas.
5. **Testimonios** — testimonio de Maria Rod-Rey en un bloque destacado; dejar preparado un carrusel para más.
6. **Imán de leads (nuevo, aporte de LeadEngine)** — bloque de **valuación IA**: "Descubre cuánto vale tu propiedad" que captura el contacto. Es el añadido clave frente al sitio actual.
7. **Muro de clientes felices** — logos en marquee (cinta deslizante) con inercia.
8. **Asociaciones y credenciales** — logos que aportan confianza.
9. **Contacto / "Connect With Us"** — con los datos reales y un formulario que alimente el CRM de LeadEngine.

---

## Efectos a aplicar (de `Referencia-Efectos-Visuales-Radian.md`)

- **Hero scrubbed + pinned** (scroll controla el video/recorrido).
- **Parallax por capas** en marca, bio y bloque de valuación.
- **Revelado de texto escalonado** (tipo SplitText) en titulares.
- **Marquee con inercia** para los logos de clientes.
- **Micro-animaciones** en botones y tarjetas de categoría.
- **Transiciones de página sin recarga** si se navega a detalle/formulario.
- **Smooth scroll** global.

---

## Pautas no negociables

1. **Contenido real y honesto.** Usa los textos, testimonios e imágenes reales del cliente. Si añades datos ilustrativos (p. ej. una estimación de valuación de ejemplo), márcalos claramente como ejemplo.
2. **Rendimiento primero.** Anima solo `transform`/`opacity`; comprime/streamea el video del hero; objetivo 60 fps.
3. **Accesibilidad.** Respeta `prefers-reduced-motion` (desactiva scrubbing, parallax y reveals) y mantén contraste y navegación por teclado.
4. **Móvil.** Desactiva los efectos pesados en móvil; la portada debe verse impecable y cargar rápido en el teléfono.
5. **Degradación elegante.** Si un asset o librería falla, el contenido sigue visible y funcional.
6. **Derechos de imagen.** Las imágenes son del cliente y sus socios; úsalas solo para esta portada del propio cliente. Los logos de terceros (clientes/asociaciones) se muestran como referencias de confianza, igual que en el sitio original.
7. **Marca coherente.** Aplica la dirección de identidad que acordemos en las preguntas iniciales; no mezcles estéticas al azar.

---

## Cómo queremos que trabajes

Elige tú el enfoque técnico (puedes inspirarte en el stack de Radian —GSAP/ScrollTrigger/Lenis— o algo más ligero) y **justifícalo brevemente** en lenguaje sencillo, priorizando lo más fácil de mantener. Entrega primero el **hero** bien pulido como patrón y luego replica el estilo al resto. Ante cualquier duda, **pregúntanos en vez de asumir**. Y en cada decisión vuelve a la pregunta central: **¿esta portada hace que un visitante de Floridian First quiera dejar sus datos y convertirse en lead?**

---

*Preparado por AMAAC Tech — División de Servicios Digitales · para el desarrollo de LeadEngine (Floridian First Realty)*
