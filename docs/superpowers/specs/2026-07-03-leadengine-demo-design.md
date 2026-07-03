# LeadEngine — Documento de Diseño (Demo v1)

**Cliente:** Floridian First Realty (inmobiliaria boutique, Coral Gables, FL)
**Preparado por:** AMAAC Tech — División de Servicios Digitales
**Fecha:** 2026-07-03
**Estado:** Aprobado para implementación (supuestos confirmados por el cliente)

---

## 1. Objetivo

Construir **LeadEngine**, una plataforma web con dos caras conectadas:

- **(A) Web pública de captación** — atrae visitantes y los convierte en leads (listados atractivos, mapa, y una herramienta de valuación de vivienda como imán de leads).
- **(B) Panel de administración interno** — el CRM/cerebro operativo donde cada lead entra, se califica, se prioriza y avanza por un pipeline hasta el cierre.

Idea rectora: **ningún interesado se pierde**. Todo lo que entra por la parte pública aparece, vivo y accionable, en el panel.

Esta primera entrega es una **demostración**: las 10 áreas funcionales deben verse completas y vivas desde el día uno, pobladas con datos de ejemplo realistas. Las integraciones externas (MLS, WhatsApp, IA) se **simulan de forma convincente**, con la arquitectura preparada para conectar lo real en una fase posterior.

## 2. Supuestos confirmados

| Tema | Decisión |
|---|---|
| Naturaleza de la entrega | Demo (todo vivo con datos seed; sin dependencias de cuentas de terceros). |
| Volumen objetivo | 20–100 leads/mes (escala boutique). |
| Usuarios / roles | 4–10 personas; roles simples **admin** y **agente**. |
| Alcance | Las 10 áreas presentes de una vez. |
| Valuación | Modelo propio de comparables (precio/m² por zona + características). Enchufe para IA real más adelante. |
| Listados | Catálogo seed realista (Coral Gables / South Miami / Kendall). IDX/MLS en fase 2. |
| Omnicanal | Leads simulados entrando desde Web / WhatsApp / Instagram, consolidados en el CRM. |
| Marca | Identidad propuesta por nosotros (paleta costera Miami: azul marino + acento arena/dorado), sustituible. |

## 3. Arquitectura (Opción A — aplicación única "todo en uno")

Un solo proyecto **Next.js (App Router)** que sirve la web pública, el panel interno y la lógica de backend (API routes / server actions). Una persona lo mantiene; se levanta con un comando.

- **Framework:** Next.js + React + TypeScript.
- **Datos:** SQLite (archivo local) mediante **Prisma ORM**. Migrable a Postgres sin reescribir la lógica.
- **UI:** Tailwind CSS + shadcn/ui. Responsive (móvil + escritorio). Aspecto profesional y moderno.
- **Mapa:** Leaflet + OpenStreetMap (sin clave API ni facturación).
- **Gráficas:** Recharts.
- **Autenticación:** Auth.js (credenciales), sesiones con roles `admin` / `agent`.
- **Notificaciones/alertas:** en-app, generadas por reglas; refresco por polling ligero (sin websockets en la demo).
- **Datos de ejemplo:** script de *seed* con propiedades, leads multicanal, oportunidades en pipeline y actividad histórica.

### Estructura por capas (aislamiento y claridad)

```
app/
  (public)/            # Web pública: home, listados, ficha, valuación, mapa
  (admin)/             # Panel: dashboard, crm, pipeline, propiedades, mapa, analítica, alertas
  api/                 # Endpoints (captura de leads, valuación, webhooks simulados)
lib/
  scoring.ts           # Motor de calificación (score) de leads
  valuation.ts         # Modelo de valuación por comparables
  alerts.ts            # Reglas de alertas inteligentes
  channels.ts          # Normalización de leads omnicanal (web/whatsapp/instagram)
prisma/
  schema.prisma        # Modelo de datos
  seed.ts              # Datos de ejemplo realistas
components/            # UI reutilizable (shadcn/ui + propios)
```

Cada módulo de `lib/` tiene un propósito único, interfaz clara y se puede probar de forma aislada.

## 4. Modelo de datos (entidades núcleo)

- **User** — usuarios internos (`admin` | `agent`).
- **Lead** — contacto capturado: nombre, email, teléfono, canal de origen, interés (zona/propiedad), estado, **score**, agente asignado, timestamps.
- **LeadActivity** — historial de interacciones (nota, llamada, email, cambio de estado).
- **Property** — inmueble: título, precio, zona, dirección, lat/lng, estado (`for_sale` | `pending` | `sold`), características, fotos.
- **Opportunity** — oportunidad de venta ligada a un Lead + Property: etapa del pipeline, valor, probabilidad.
- **Valuation** — solicitud de valuación (datos de vivienda + estimación generada), que genera un Lead.
- **Notification** — alertas inteligentes para el equipo.

## 5. Áreas funcionales (las 10 del brief + alertas)

1. **Web pública (captación)** — home con propuesta de valor, listados con filtros, ficha de propiedad, mapa, CTA a valuación. Todo formulario crea un Lead.
2. **Dashboard** — "¿en qué me concentro hoy?": leads nuevos, orígenes, oportunidades calientes, métricas de la semana.
3. **CRM de leads** — lista única filtrable/ordenable por score, con ficha de contexto y acciones.
4. **Captura omnicanal** — leads de Web/WhatsApp/Instagram normalizados y consolidados automáticamente (simulados vía endpoint que emula webhooks).
5. **Pipeline de ventas** — tablero visual por etapas (nuevo → contactado → visita → oferta → cerrado) con importe por etapa y total en juego.
6. **Listados (gestión)** — alta/edición de propiedades; alimentan web pública y trabajo interno.
7. **Respuesta rápida + calificación automática** — cada lead recibe un **score** al entrar (motor `scoring.ts`) y se resalta el tiempo de espera para responder rápido.
8. **Mapa interno** — vista geográfica de propiedades; seleccionar muestra info; actividad por zona.
9. **Analítica** — origen de leads que convierten, comportamiento del embudo, rendimiento por canal y propiedad.
10. **Valuación IA (imán)** — formulario público → estimación por comparables → informe breve → Lead calificado en el CRM.
11. **Alertas inteligentes** — reglas: lead caliente sin atender, oportunidad estancada, nuevo interesado en una propiedad.

## 6. Motores de lógica de negocio

- **Scoring (`scoring.ts`)** — puntúa cada lead (0–100) por señales: canal, completitud de datos, interés explícito en propiedad/zona, tipo de acción (valuación = intención alta de venta). Determina prioridad de atención.
- **Valuación (`valuation.ts`)** — estima valor = precio/m² base de la zona × superficie, ajustado por dormitorios/baños/estado/antigüedad, con rango (±). Devuelve estimación + comparables de ejemplo. Interfaz aislada para sustituir por IA real (Claude) después.
- **Alertas (`alerts.ts`)** — evalúa reglas periódicamente/al cambiar datos y crea Notifications.
- **Canales (`channels.ts`)** — recibe payloads heterogéneos (web form, "WhatsApp", "Instagram") y los normaliza a un Lead uniforme.

## 7. Roles y permisos

- **admin** — ve todo, gestiona propiedades, usuarios, y toda la cartera de leads/pipeline.
- **agent** — ve y trabaja sus leads asignados y el pipeline; no gestiona usuarios.
- Web pública: anónima; los formularios crean Leads sin login.

## 8. Marca y diseño

Identidad limpia y profesional (sustituible por la del cliente):
- **Paleta:** azul marino profundo (confianza) + acento arena/dorado (boutique/lujo accesible) + neutros claros.
- **Tipografía:** una serif sobria para titulares + sans legible para cuerpo.
- **Tono:** profesional, moderno, que transmita confianza; interfaz clara para perfiles comerciales no técnicos.

## 9. Datos de ejemplo (seed)

Para que la demo se sienta un negocio en marcha:
- ~12–20 propiedades en Coral Gables / South Miami / Kendall (con lat/lng reales de la zona, precios y estados variados).
- ~40–80 leads repartidos por canal, estado y score, con actividad histórica.
- Oportunidades distribuidas por todas las etapas del pipeline, con importes.
- Un puñado de valuaciones y notificaciones/alertas activas.
- Usuarios demo: 1 admin + 2–3 agentes (credenciales conocidas para la presentación).

## 10. Criterios de éxito de la demo

- Las 11 áreas navegables y con datos vivos desde el arranque.
- Un lead creado desde la web pública (formulario o valuación) **aparece inmediatamente** en el CRM con su score.
- El pipeline muestra dinero en juego por etapa de un vistazo.
- El mapa ubica las propiedades y muestra su info al seleccionarlas.
- La analítica responde "de dónde vienen los leads que convierten".
- Se levanta con un comando y funciona en móvil y escritorio.

## 11. Fuera de alcance (demo v1) — fase 2

- Integración IDX/MLS real.
- WhatsApp Business API / conexión real de redes sociales.
- Valuación con IA real (Claude) — el enchufe queda listo.
- Notificaciones en tiempo real (websockets), email/SMS salientes reales.
- Migración a Postgres y despliegue de producción endurecido.

## 12. No-objetivos

- No es un portal MLS completo ni un CRM genérico configurable: es la herramienta enfocada de captación y conversión de Floridian First.
