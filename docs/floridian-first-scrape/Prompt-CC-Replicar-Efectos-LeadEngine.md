# PROMPT PARA CLAUDE CODE — Capa de movimiento y efectos visuales de LeadEngine

> **Cómo usar este prompt:** pégalo como mensaje en la sesión de Claude Code del proyecto LeadEngine, **junto con** el archivo `Referencia-Efectos-Visuales-Radian.md` (adjúntalo o ténlo en la carpeta del proyecto). Este prompt define el *qué* y las *pautas*; el archivo de referencia aporta el detalle de cada efecto. Las decisiones técnicas concretas son tuyas.

---

## Tu misión

Vas a construir la **capa de movimiento, transiciones y efectos visuales** de la plataforma **LeadEngine** (frontend público de captación + panel de administración para Floridian First Realty). El objetivo de calidad es alcanzar el **nivel de acabado del sitio rideradian.com**, cuyo análisis completo tienes en el documento adjunto `Referencia-Efectos-Visuales-Radian.md`. **Léelo primero y por completo antes de proponer nada.**

**Importante:** no vamos a copiar Radian. Vamos a **reinterpretar su nivel de pulido** para un producto inmobiliario, con nuestra propia marca y respetando que tenemos dos superficies muy distintas (una landing cinematográfica y una app de trabajo).

---

## Antes de escribir código: pregúntanos

No empieces a implementar hasta entender el contexto. Haznos preguntas ordenadas (en tandas cortas) que cubran, como mínimo:

- **Estado del proyecto:** ¿el frontend/panel ya existe (y solo añadimos la capa de movimiento) o partimos de cero? ¿Qué stack está ya elegido?
- **Prioridad:** ¿empezamos por el frontend público (impacto de marketing) o por el panel (herramienta interna)?
- **Assets:** ¿tenemos videos/fotos de propiedades para el hero cinematográfico, o usamos material de ejemplo por ahora? ¿Hay una propiedad "destacada" para el hero?
- **Alcance de efectos:** de la lista del documento de referencia, ¿cuáles son imprescindibles para la primera entrega y cuáles son "deseables"?
- **Restricciones:** ¿límites de rendimiento, navegadores objetivo, o preferencias sobre peso de librerías?
- **Marca:** ¿confirmamos la paleta (navy `#0F2A47`, dorado `#F4A24C`, teal `#17A2A2`) y tipografías? ¿Hay guía de estilo?

Cuando tengas las respuestas, **resume tu entendimiento, propón un plan por fases y espera nuestra aprobación** antes de construir.

---

## Qué debes lograr (por superficie)

### A) Frontend público — aquí sí va lo cinematográfico
Reinterpreta para inmobiliaria los efectos de Radian:
- **Hero controlado por scroll y fijado** (recorrido por una propiedad o fly-through de Coral Gables en lugar de la moto).
- **Parallax por capas** en secciones destacadas y en el bloque de valuación IA.
- **Revelado de texto escalonado** (tipo SplitText) en titulares clave.
- **Sección de beneficios interactiva** (media sincronizada con cada punto de venta).
- **Marquee** de zonas/testimonios/logos.
- **CTAs con micro-animación** (Valuar mi casa, Contactar).
- **Transiciones entre páginas sin recarga** (landing → detalle de propiedad → formulario).

### B) Panel de administración — aquí solo lo sutil
La app de trabajo prioriza velocidad y claridad. Nada de espectáculo:
- **Micro-interacciones** rápidas (<250 ms) en botones, filas del CRM y tarjetas.
- **Transiciones suaves entre vistas** (Dashboard → Leads → Pipeline), sin bloquear al usuario.
- **Animación de datos**: KPIs que cuentan, barras/donut/embudo que se dibujan al entrar en viewport, tarjetas que entran escalonadas.
- **Kanban del pipeline** con arrastrar-soltar e inercia ligera.
- **Feedback de estado**: toasts/alertas animadas, badge de "lead caliente" con pulso discreto.
- **Prohibido en el panel:** scroll-scrubbing pesado, video de fondo y parallax agresivo.

### C) Diagramas y visualizaciones
Embudo, pipeline y analítica deben **animar su entrada** (barras crecen, líneas se trazan, donut se rellena) al aparecer en viewport. Datos reales o marcados como ilustrativos.

---

## Pautas que debes seguir desde el principio (no negociables)

1. **Rendimiento primero.** Anima solo propiedades baratas (`transform`, `opacity`); usa aceleración por GPU y `will-change` con criterio. Objetivo 60 fps; si un efecto no lo mantiene, simplifícalo. El video del hero debe ir comprimido/streaming, no un archivo pesado.
2. **Accesibilidad.** Implementa `prefers-reduced-motion` desde el inicio: si el usuario pide menos movimiento, desactiva scrubbing, parallax y reveals, dejando todo legible y estático. Respeta foco de teclado y contraste.
3. **Móvil.** Desactiva los efectos costosos en móvil (equivalente al `data-parallax-disable` de Radian). El panel debe ser 100 % usable en móvil sin animaciones caras.
4. **Degradación elegante.** Si una librería o un asset falla, el contenido sigue visible y funcional. Nunca una pantalla en blanco por un error de animación.
5. **Progresivo, no bloqueante.** El contenido debe ser legible aunque las animaciones aún no hayan cargado. No escondas texto esperando a que "entre".
6. **Marca propia.** Aplica la identidad de LeadEngine/Floridian First (navy/dorado/teal), no la estética de Radian.
7. **Honestidad de contenido.** Datos de propiedades, métricas o leads en demos van marcados como ejemplo si no son reales.
8. **Mantenibilidad.** Centraliza la configuración de animaciones (duraciones, easings, distancias) para poder ajustarlas en un solo sitio. Comenta el porqué de cada efecto complejo.
9. **Código organizado.** Separa la capa de movimiento de la lógica de negocio, de forma que se pueda desactivar o ajustar sin romper la app.

---

## Cómo queremos que trabajes

Elige tú las librerías y la arquitectura (puedes inspirarte en el stack de Radian —GSAP/ScrollTrigger/Lenis/Barba/Swiper— o proponer algo más ligero si encaja mejor con nuestro stack) y **justifica brevemente** cada elección en términos que entienda una persona no técnica, priorizando siempre lo más simple de mantener que cumpla el objetivo. Entrega por **fases**: primero un efecto "faro" bien pulido (por ejemplo el hero del frontend o las micro-interacciones del panel) que sirva de patrón, y sobre esa base replica el resto. Ante cualquier ambigüedad, **pregúntanos en lugar de asumir**. Y en cada decisión, vuelve a la pregunta que da sentido a esto: **¿mejora la experiencia y ayuda a capturar/convertir más leads, sin sacrificar rendimiento ni claridad?**

---

*Preparado por AMAAC Tech — División de Servicios Digitales · para el desarrollo de LeadEngine (Floridian First Realty)*
