# LeadEngine — Plan 1: Cimientos y Motores de Negocio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar el andamiaje de la aplicación, el modelo de datos, los datos de ejemplo y los cuatro motores de lógica de negocio (scoring, valuación, canales, alertas) con tests, como base testeable para todos los módulos de UI posteriores.

**Architecture:** Aplicación única Next.js (App Router, TypeScript) que servirá web pública + panel + backend. Persistencia en SQLite vía Prisma. La lógica de negocio vive en `lib/` como funciones puras aisladas, probadas con Vitest antes de conectarse a la UI.

**Tech Stack:** Next.js, React, TypeScript, Prisma + SQLite, Vitest, Tailwind CSS (config base). Auth.js, shadcn/ui, Leaflet y Recharts se añaden en planes posteriores donde se usan.

## Global Constraints

- Lenguaje: TypeScript en todo el proyecto. `strict: true` en `tsconfig`.
- Base de datos: SQLite mediante Prisma. Ninguna lógica de negocio debe asumir Postgres (migrable después).
- Canales válidos de lead: `web` | `whatsapp` | `instagram` | `valuation`.
- Estados de lead: `new` | `contacted` | `qualified` | `visit` | `offer` | `won` | `lost`.
- Etapas de pipeline (Opportunity): `new` | `contacted` | `visit` | `offer` | `closed`.
- Estados de propiedad: `for_sale` | `pending` | `sold`.
- Roles de usuario: `admin` | `agent`.
- Moneda: USD, enteros (sin decimales) para importes de propiedades/oportunidades.
- Los motores de `lib/` son funciones puras: sin acceso a DB, sin I/O, deterministas (reciben `now` como parámetro donde el tiempo importa).
- Zonas de mercado del seed: `Coral Gables`, `South Miami`, `Kendall`.

---

### Task 1: Andamiaje del proyecto Next.js + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.gitignore`
- Create: `app/globals.css` (Tailwind base)

**Interfaces:**
- Produces: proyecto Next.js ejecutable (`npm run dev`) y runner de tests (`npm test`) que otros tasks usan.

- [ ] **Step 1: Scaffold con create-next-app**

Run:
```bash
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack --use-npm
```
Si pregunta por sobrescribir archivos existentes, conservar los del repo (docs/, .git). Expected: crea `app/`, `package.json`, `tsconfig.json`, `tailwind.config.*`, `next.config.mjs`.

- [ ] **Step 2: Añadir Vitest y dependencias de test**

Run:
```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: Crear `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 4: Añadir script de test a `package.json`**

En `"scripts"` añadir:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verificar que el proyecto compila y el runner arranca**

Run: `npm run build && npx vitest run --passWithNoTests`
Expected: build OK; Vitest reporta "no test files found" y sale con código 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app + Vitest"
```

---

### Task 2: Modelo de datos Prisma + cliente

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`
- Modify: `package.json` (scripts prisma)

**Interfaces:**
- Produces: modelos `User`, `Lead`, `LeadActivity`, `Property`, `Opportunity`, `Valuation`, `Notification`; export `prisma` (PrismaClient singleton) desde `lib/db.ts`.

- [ ] **Step 1: Instalar Prisma**

Run:
```bash
npm install @prisma/client && npm install -D prisma
```

- [ ] **Step 2: Crear `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      String   @default("agent") // admin | agent
  password  String                       // hash
  leads     Lead[]
  createdAt DateTime @default(now())
}

model Lead {
  id           String         @id @default(cuid())
  name         String
  email        String?
  phone        String?
  channel      String         // web | whatsapp | instagram | valuation
  status       String         @default("new")
  score        Int            @default(0)
  zone         String?
  message      String?
  property     Property?      @relation(fields: [propertyId], references: [id])
  propertyId   String?
  agent        User?          @relation(fields: [agentId], references: [id])
  agentId      String?
  activities   LeadActivity[]
  opportunity  Opportunity?
  createdAt    DateTime       @default(now())
  lastActivityAt DateTime?
}

model LeadActivity {
  id        String   @id @default(cuid())
  lead      Lead     @relation(fields: [leadId], references: [id])
  leadId    String
  type      String   // note | call | email | status_change
  content   String
  createdAt DateTime @default(now())
}

model Property {
  id         String        @id @default(cuid())
  title      String
  price      Int
  zone       String
  address    String
  lat        Float
  lng        Float
  status     String        @default("for_sale") // for_sale | pending | sold
  bedrooms   Int
  bathrooms  Int
  areaSqft   Int
  photoUrl   String
  leads      Lead[]
  opportunities Opportunity[]
  createdAt  DateTime      @default(now())
}

model Opportunity {
  id         String   @id @default(cuid())
  lead       Lead     @relation(fields: [leadId], references: [id])
  leadId     String   @unique
  property   Property @relation(fields: [propertyId], references: [id])
  propertyId String
  stage      String   @default("new") // new | contacted | visit | offer | closed
  value      Int
  probability Int     @default(20)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Valuation {
  id         String   @id @default(cuid())
  zone       String
  areaSqft   Int
  bedrooms   Int
  bathrooms  Int
  condition  String
  estimate   Int
  low        Int
  high       Int
  lead       Lead?    @relation(fields: [leadId], references: [id])
  leadId     String?
  createdAt  DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  type      String   // hot_lead_unattended | stalled_opportunity | new_interest
  refId     String
  message   String
  severity  String   @default("medium")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Nota: en el modelo `Lead` falta la relación inversa de `Valuation`; añadir en `Lead` el campo `valuations Valuation[]` para que Prisma valide.

- [ ] **Step 3: Añadir relación inversa faltante en `Lead`**

Dentro de `model Lead`, añadir la línea:
```prisma
  valuations   Valuation[]
```

- [ ] **Step 4: Crear cliente singleton `lib/db.ts`**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Generar cliente y crear la base de datos**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: crea `prisma/migrations/`, `prisma/dev.db`, y genera el cliente sin errores.

- [ ] **Step 6: Añadir `prisma/dev.db` y generados a `.gitignore`**

Añadir a `.gitignore`:
```
/prisma/dev.db
/prisma/dev.db-journal
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Prisma schema (Lead, Property, Opportunity, Valuation, User, Notification) + db client"
```

---

### Task 3: Motor de scoring de leads (TDD)

**Files:**
- Create: `lib/scoring.ts`
- Test: `lib/scoring.test.ts`

**Interfaces:**
- Produces:
  - `type LeadChannel = 'web' | 'whatsapp' | 'instagram' | 'valuation'`
  - `type ScoreSignals = { channel: LeadChannel; hasEmail: boolean; hasPhone: boolean; hasPropertyInterest: boolean; hasZoneInterest: boolean; message?: string | null }`
  - `function scoreLead(signals: ScoreSignals): number` — devuelve entero 0–100.

- [ ] **Step 1: Escribir el test que falla**

`lib/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { scoreLead } from '@/lib/scoring'

describe('scoreLead', () => {
  it('da máxima prioridad a una valuación con datos completos', () => {
    const score = scoreLead({
      channel: 'valuation',
      hasEmail: true,
      hasPhone: true,
      hasPropertyInterest: true,
      hasZoneInterest: true,
      message: 'Quiero vender mi casa este año',
    })
    expect(score).toBe(100)
  })

  it('puntúa bajo un lead web anónimo sin datos', () => {
    const score = scoreLead({
      channel: 'web',
      hasEmail: false,
      hasPhone: false,
      hasPropertyInterest: false,
      hasZoneInterest: false,
      message: null,
    })
    expect(score).toBe(20)
  })

  it('nunca supera 100 ni baja de 0', () => {
    const high = scoreLead({
      channel: 'valuation', hasEmail: true, hasPhone: true,
      hasPropertyInterest: true, hasZoneInterest: true, message: 'x'.repeat(50),
    })
    expect(high).toBeLessThanOrEqual(100)
    expect(high).toBeGreaterThanOrEqual(0)
  })

  it('un lead de whatsapp con teléfono e interés en propiedad supera a uno de instagram sin datos', () => {
    const wa = scoreLead({ channel: 'whatsapp', hasEmail: false, hasPhone: true, hasPropertyInterest: true, hasZoneInterest: false, message: null })
    const ig = scoreLead({ channel: 'instagram', hasEmail: false, hasPhone: false, hasPropertyInterest: false, hasZoneInterest: false, message: null })
    expect(wa).toBeGreaterThan(ig)
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run lib/scoring.test.ts`
Expected: FAIL — no existe `@/lib/scoring`.

- [ ] **Step 3: Implementar `lib/scoring.ts`**

```ts
export type LeadChannel = 'web' | 'whatsapp' | 'instagram' | 'valuation'

export type ScoreSignals = {
  channel: LeadChannel
  hasEmail: boolean
  hasPhone: boolean
  hasPropertyInterest: boolean
  hasZoneInterest: boolean
  message?: string | null
}

const CHANNEL_BASE: Record<LeadChannel, number> = {
  valuation: 40, // intención alta de venta
  whatsapp: 25,
  web: 20,
  instagram: 15,
}

export function scoreLead(signals: ScoreSignals): number {
  let score = CHANNEL_BASE[signals.channel]
  if (signals.hasEmail) score += 15
  if (signals.hasPhone) score += 15
  if (signals.hasPropertyInterest) score += 15
  if (signals.hasZoneInterest) score += 10
  if (signals.message && signals.message.trim().length > 20) score += 5
  return Math.max(0, Math.min(100, score))
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run lib/scoring.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/scoring.ts lib/scoring.test.ts
git commit -m "feat: motor de scoring de leads"
```

---

### Task 4: Motor de valuación por comparables (TDD)

**Files:**
- Create: `lib/valuation.ts`
- Test: `lib/valuation.test.ts`

**Interfaces:**
- Produces:
  - `type PropertyCondition = 'excellent' | 'good' | 'fair' | 'needs_work'`
  - `type ValuationInput = { zone: string; areaSqft: number; bedrooms: number; bathrooms: number; condition: PropertyCondition; yearBuilt?: number }`
  - `type ValuationResult = { estimate: number; low: number; high: number; pricePerSqft: number }`
  - `function estimateValue(input: ValuationInput): ValuationResult`

- [ ] **Step 1: Escribir el test que falla**

`lib/valuation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { estimateValue } from '@/lib/valuation'

describe('estimateValue', () => {
  it('usa el precio/m² base de la zona para una casa estándar en buen estado', () => {
    const r = estimateValue({ zone: 'Coral Gables', areaSqft: 2000, bedrooms: 3, bathrooms: 2, condition: 'good' })
    // base Coral Gables = 650/sqft; condición good = x1.0; 3bd/2ba neutro
    expect(r.pricePerSqft).toBe(650)
    expect(r.estimate).toBe(1_300_000)
  })

  it('devuelve un rango low/high alrededor de la estimación', () => {
    const r = estimateValue({ zone: 'Kendall', areaSqft: 1500, bedrooms: 3, bathrooms: 2, condition: 'good' })
    expect(r.low).toBeLessThan(r.estimate)
    expect(r.high).toBeGreaterThan(r.estimate)
  })

  it('una vivienda en mal estado vale menos que una excelente igual', () => {
    const base = { zone: 'South Miami', areaSqft: 1800, bedrooms: 3, bathrooms: 2 } as const
    const good = estimateValue({ ...base, condition: 'excellent' })
    const bad = estimateValue({ ...base, condition: 'needs_work' })
    expect(bad.estimate).toBeLessThan(good.estimate)
  })

  it('zona desconocida usa un precio/m² por defecto sin romper', () => {
    const r = estimateValue({ zone: 'Marte', areaSqft: 1000, bedrooms: 2, bathrooms: 1, condition: 'good' })
    expect(r.estimate).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run lib/valuation.test.ts`
Expected: FAIL — no existe `@/lib/valuation`.

- [ ] **Step 3: Implementar `lib/valuation.ts`**

```ts
export type PropertyCondition = 'excellent' | 'good' | 'fair' | 'needs_work'

export type ValuationInput = {
  zone: string
  areaSqft: number
  bedrooms: number
  bathrooms: number
  condition: PropertyCondition
  yearBuilt?: number
}

export type ValuationResult = {
  estimate: number
  low: number
  high: number
  pricePerSqft: number
}

const ZONE_PRICE_PER_SQFT: Record<string, number> = {
  'Coral Gables': 650,
  'South Miami': 520,
  'Kendall': 380,
}
const DEFAULT_PRICE_PER_SQFT = 450

const CONDITION_MULT: Record<PropertyCondition, number> = {
  excellent: 1.1,
  good: 1.0,
  fair: 0.9,
  needs_work: 0.8,
}

export function estimateValue(input: ValuationInput): ValuationResult {
  const pricePerSqft = ZONE_PRICE_PER_SQFT[input.zone] ?? DEFAULT_PRICE_PER_SQFT
  let value = input.areaSqft * pricePerSqft
  value *= CONDITION_MULT[input.condition]
  // pequeños ajustes por habitaciones/baños
  value += (input.bedrooms - 3) * 15_000
  value += (input.bathrooms - 2) * 10_000
  // depreciación suave por antigüedad
  if (input.yearBuilt) {
    const age = 2026 - input.yearBuilt
    if (age > 0) value *= Math.max(0.75, 1 - age * 0.003)
  }
  const estimate = Math.max(0, Math.round(value))
  return {
    estimate,
    low: Math.round(estimate * 0.92),
    high: Math.round(estimate * 1.08),
    pricePerSqft,
  }
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run lib/valuation.test.ts`
Expected: PASS (4 tests). Nota: el primer test asume `estimate = areaSqft*pricePerSqft*1.0 + (3-3)*15000 + (2-2)*10000 = 1_300_000`.

- [ ] **Step 5: Commit**

```bash
git add lib/valuation.ts lib/valuation.test.ts
git commit -m "feat: motor de valuación por comparables"
```

---

### Task 5: Normalización de leads omnicanal (TDD)

**Files:**
- Create: `lib/channels.ts`
- Test: `lib/channels.test.ts`

**Interfaces:**
- Consumes: `LeadChannel` de `@/lib/scoring`.
- Produces:
  - `type RawInbound = { source: string; name?: string; email?: string; phone?: string; text?: string; propertyId?: string; zone?: string }`
  - `type NormalizedLead = { name: string; email: string | null; phone: string | null; channel: LeadChannel; message: string | null; propertyId: string | null; zone: string | null }`
  - `function normalizeInbound(raw: RawInbound): NormalizedLead`

- [ ] **Step 1: Escribir el test que falla**

`lib/channels.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { normalizeInbound } from '@/lib/channels'

describe('normalizeInbound', () => {
  it('mapea un mensaje de WhatsApp al canal whatsapp y recorta espacios', () => {
    const lead = normalizeInbound({ source: 'WhatsApp', name: '  Ana  ', phone: '+13055551234', text: 'Hola' })
    expect(lead.channel).toBe('whatsapp')
    expect(lead.name).toBe('Ana')
    expect(lead.phone).toBe('+13055551234')
    expect(lead.message).toBe('Hola')
    expect(lead.email).toBeNull()
  })

  it('usa "Sin nombre" cuando no llega nombre', () => {
    const lead = normalizeInbound({ source: 'instagram', text: 'Info?' })
    expect(lead.name).toBe('Sin nombre')
    expect(lead.channel).toBe('instagram')
  })

  it('un source desconocido cae al canal web', () => {
    const lead = normalizeInbound({ source: 'carrier-pigeon', email: 'x@y.com' })
    expect(lead.channel).toBe('web')
    expect(lead.email).toBe('x@y.com')
  })

  it('conserva propertyId y zone de interés', () => {
    const lead = normalizeInbound({ source: 'web', propertyId: 'p1', zone: 'Kendall' })
    expect(lead.propertyId).toBe('p1')
    expect(lead.zone).toBe('Kendall')
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run lib/channels.test.ts`
Expected: FAIL — no existe `@/lib/channels`.

- [ ] **Step 3: Implementar `lib/channels.ts`**

```ts
import type { LeadChannel } from '@/lib/scoring'

export type RawInbound = {
  source: string
  name?: string
  email?: string
  phone?: string
  text?: string
  propertyId?: string
  zone?: string
}

export type NormalizedLead = {
  name: string
  email: string | null
  phone: string | null
  channel: LeadChannel
  message: string | null
  propertyId: string | null
  zone: string | null
}

function resolveChannel(source: string): LeadChannel {
  const s = source.trim().toLowerCase()
  if (s.includes('whatsapp')) return 'whatsapp'
  if (s.includes('instagram')) return 'instagram'
  if (s.includes('valuation') || s.includes('valuacion')) return 'valuation'
  return 'web'
}

function clean(v?: string): string | null {
  const t = v?.trim()
  return t && t.length > 0 ? t : null
}

export function normalizeInbound(raw: RawInbound): NormalizedLead {
  return {
    name: clean(raw.name) ?? 'Sin nombre',
    email: clean(raw.email),
    phone: clean(raw.phone),
    channel: resolveChannel(raw.source),
    message: clean(raw.text),
    propertyId: clean(raw.propertyId),
    zone: clean(raw.zone),
  }
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run lib/channels.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/channels.ts lib/channels.test.ts
git commit -m "feat: normalización de leads omnicanal"
```

---

### Task 6: Motor de alertas inteligentes (TDD)

**Files:**
- Create: `lib/alerts.ts`
- Test: `lib/alerts.test.ts`

**Interfaces:**
- Produces:
  - `type AlertLead = { id: string; score: number; status: string; createdAt: Date }`
  - `type AlertOpportunity = { id: string; stage: string; value: number; updatedAt: Date }`
  - `type AlertRuleInput = { leads: AlertLead[]; opportunities: AlertOpportunity[]; now: Date }`
  - `type Alert = { type: 'hot_lead_unattended' | 'stalled_opportunity'; refId: string; message: string; severity: 'high' | 'medium' }`
  - `function evaluateAlerts(input: AlertRuleInput): Alert[]`

- [ ] **Step 1: Escribir el test que falla**

`lib/alerts.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { evaluateAlerts } from '@/lib/alerts'

const NOW = new Date('2026-07-03T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000)
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

describe('evaluateAlerts', () => {
  it('alerta de lead caliente nuevo sin atender > 2h', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'new', createdAt: hoursAgo(3) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ type: 'hot_lead_unattended', refId: 'l1', severity: 'high' })
  })

  it('no alerta si el lead caliente es reciente (< 2h)', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'new', createdAt: hoursAgo(1) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })

  it('no alerta si el lead ya fue contactado', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'contacted', createdAt: hoursAgo(5) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })

  it('alerta de oportunidad estancada (>7 días sin cambios, no cerrada)', () => {
    const alerts = evaluateAlerts({
      leads: [],
      opportunities: [{ id: 'o1', stage: 'visit', value: 500_000, updatedAt: daysAgo(10) }],
      now: NOW,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ type: 'stalled_opportunity', refId: 'o1' })
  })

  it('no alerta de oportunidades cerradas aunque lleven tiempo sin tocarse', () => {
    const alerts = evaluateAlerts({
      leads: [],
      opportunities: [{ id: 'o1', stage: 'closed', value: 500_000, updatedAt: daysAgo(30) }],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run lib/alerts.test.ts`
Expected: FAIL — no existe `@/lib/alerts`.

- [ ] **Step 3: Implementar `lib/alerts.ts`**

```ts
export type AlertLead = { id: string; score: number; status: string; createdAt: Date }
export type AlertOpportunity = { id: string; stage: string; value: number; updatedAt: Date }
export type AlertRuleInput = { leads: AlertLead[]; opportunities: AlertOpportunity[]; now: Date }
export type Alert = {
  type: 'hot_lead_unattended' | 'stalled_opportunity'
  refId: string
  message: string
  severity: 'high' | 'medium'
}

const HOT_SCORE = 70
const UNATTENDED_HOURS = 2
const STALLED_DAYS = 7

export function evaluateAlerts(input: AlertRuleInput): Alert[] {
  const alerts: Alert[] = []
  const { now } = input

  for (const lead of input.leads) {
    const hours = (now.getTime() - lead.createdAt.getTime()) / 3600_000
    if (lead.score >= HOT_SCORE && lead.status === 'new' && hours > UNATTENDED_HOURS) {
      alerts.push({
        type: 'hot_lead_unattended',
        refId: lead.id,
        message: `Lead caliente (score ${lead.score}) sin atender hace ${Math.floor(hours)}h`,
        severity: 'high',
      })
    }
  }

  for (const opp of input.opportunities) {
    const days = (now.getTime() - opp.updatedAt.getTime()) / 86_400_000
    if (opp.stage !== 'closed' && days > STALLED_DAYS) {
      alerts.push({
        type: 'stalled_opportunity',
        refId: opp.id,
        message: `Oportunidad estancada ${Math.floor(days)} días en etapa "${opp.stage}"`,
        severity: 'medium',
      })
    }
  }

  return alerts
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run lib/alerts.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/alerts.ts lib/alerts.test.ts
git commit -m "feat: motor de alertas inteligentes"
```

---

### Task 7: Datos de ejemplo (seed) realistas

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (config `prisma.seed` + dep `tsx`)

**Interfaces:**
- Consumes: `prisma` de `@/lib/db`, `scoreLead` de `@/lib/scoring`.
- Produces: base `dev.db` poblada — 1 admin + 3 agentes, ~15 propiedades, ~50 leads, oportunidades en todas las etapas, valuaciones y notificaciones. Usuarios demo con credenciales conocidas.

- [ ] **Step 1: Instalar tsx y bcryptjs**

Run:
```bash
npm install -D tsx && npm install bcryptjs && npm install -D @types/bcryptjs
```

- [ ] **Step 2: Configurar el comando de seed en `package.json`**

Añadir al nivel raíz del JSON:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

- [ ] **Step 3: Escribir `prisma/seed.ts`**

```ts
import { prisma } from '@/lib/db'
import { scoreLead, type LeadChannel } from '@/lib/scoring'
import bcrypt from 'bcryptjs'

const ZONES = ['Coral Gables', 'South Miami', 'Kendall'] as const
// coordenadas aproximadas por zona para el mapa
const ZONE_COORDS: Record<string, [number, number]> = {
  'Coral Gables': [25.721, -80.268],
  'South Miami': [25.7079, -80.2939],
  'Kendall': [25.6793, -80.3173],
}
const CHANNELS: LeadChannel[] = ['web', 'whatsapp', 'instagram', 'valuation']
const STATUSES = ['new', 'contacted', 'qualified', 'visit', 'offer', 'won', 'lost']
const STAGES = ['new', 'contacted', 'visit', 'offer', 'closed']

// PRNG determinista para que el seed sea reproducible (sin Math.random)
let seedState = 42
function rand() {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff
  return seedState / 0x7fffffff
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function jitter(base: number, spread: number) {
  return base + (rand() - 0.5) * spread
}

async function main() {
  // limpiar
  await prisma.notification.deleteMany()
  await prisma.valuation.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.leadActivity.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  const pass = await bcrypt.hash('demo1234', 10)
  const admin = await prisma.user.create({
    data: { email: 'admin@floridianfirst.com', name: 'Admin Demo', role: 'admin', password: pass },
  })
  const agents = await Promise.all(
    ['Marta Ruiz', 'Carlos Vega', 'Lucía Prado'].map((name, i) =>
      prisma.user.create({
        data: { email: `agente${i + 1}@floridianfirst.com`, name, role: 'agent', password: pass },
      })
    )
  )
  const allUsers = [admin, ...agents]

  // propiedades
  const properties = []
  for (let i = 0; i < 15; i++) {
    const zone = pick(ZONES)
    const [lat, lng] = ZONE_COORDS[zone]
    const beds = 2 + Math.floor(rand() * 4)
    const area = 1200 + Math.floor(rand() * 2800)
    const p = await prisma.property.create({
      data: {
        title: `${beds}BR ${zone} ${['Villa', 'Home', 'Residence', 'Estate'][i % 4]}`,
        price: 350_000 + Math.floor(rand() * 2_500_000),
        zone,
        address: `${100 + i} ${['Coral Way', 'Sunset Dr', 'Red Rd', 'Bird Rd'][i % 4]}, ${zone}, FL`,
        lat: jitter(lat, 0.02),
        lng: jitter(lng, 0.02),
        status: pick(['for_sale', 'for_sale', 'for_sale', 'pending', 'sold']),
        bedrooms: beds,
        bathrooms: 1 + Math.floor(rand() * 4),
        areaSqft: area,
        photoUrl: `https://picsum.photos/seed/ffr${i}/800/600`,
      },
    })
    properties.push(p)
  }

  // leads
  const now = Date.now()
  for (let i = 0; i < 50; i++) {
    const channel = pick(CHANNELS)
    const status = pick(STATUSES)
    const prop = rand() > 0.4 ? pick(properties) : null
    const zone = prop ? prop.zone : pick(ZONES)
    const hasEmail = rand() > 0.3
    const hasPhone = rand() > 0.4
    const score = scoreLead({
      channel,
      hasEmail,
      hasPhone,
      hasPropertyInterest: !!prop,
      hasZoneInterest: true,
      message: rand() > 0.5 ? 'Estoy interesado, ¿me pueden contactar?' : null,
    })
    const createdAt = new Date(now - Math.floor(rand() * 20 * 86_400_000))
    const lead = await prisma.lead.create({
      data: {
        name: `Lead ${i + 1}`,
        email: hasEmail ? `lead${i + 1}@example.com` : null,
        phone: hasPhone ? `+1305555${String(1000 + i).padStart(4, '0')}` : null,
        channel,
        status,
        score,
        zone,
        message: rand() > 0.5 ? 'Estoy interesado, ¿me pueden contactar?' : null,
        propertyId: prop?.id ?? null,
        agentId: pick(allUsers).id,
        createdAt,
        lastActivityAt: status === 'new' ? null : new Date(createdAt.getTime() + 3600_000),
      },
    })

    // oportunidad para leads avanzados con propiedad
    if (prop && ['qualified', 'visit', 'offer', 'won'].includes(status)) {
      await prisma.opportunity.create({
        data: {
          leadId: lead.id,
          propertyId: prop.id,
          stage: pick(STAGES),
          value: Math.round(prop.price * 0.98),
          probability: 20 + Math.floor(rand() * 70),
        },
      })
    }
  }

  // valuaciones (algunas ligadas a leads valuation)
  for (let i = 0; i < 8; i++) {
    const zone = pick(ZONES)
    await prisma.valuation.create({
      data: {
        zone,
        areaSqft: 1500 + Math.floor(rand() * 2000),
        bedrooms: 2 + Math.floor(rand() * 3),
        bathrooms: 1 + Math.floor(rand() * 3),
        condition: pick(['excellent', 'good', 'fair', 'needs_work']),
        estimate: 600_000 + Math.floor(rand() * 1_500_000),
        low: 0,
        high: 0,
      },
    })
  }

  // notificaciones de ejemplo
  await prisma.notification.create({
    data: { type: 'hot_lead_unattended', refId: 'demo', message: 'Lead caliente sin atender hace 3h', severity: 'high' },
  })
  await prisma.notification.create({
    data: { type: 'stalled_opportunity', refId: 'demo', message: 'Oportunidad estancada 9 días en "visit"', severity: 'medium' },
  })

  console.log('Seed completado: usuarios, propiedades, leads, oportunidades, valuaciones, notificaciones.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

- [ ] **Step 4: Ejecutar el seed**

Run: `npx prisma db seed`
Expected: imprime "Seed completado..." sin errores.

- [ ] **Step 5: Verificar el conteo en la base de datos**

Run:
```bash
npx tsx -e "import{prisma}from'@/lib/db';(async()=>{console.log('users',await prisma.user.count());console.log('properties',await prisma.property.count());console.log('leads',await prisma.lead.count());console.log('opportunities',await prisma.opportunity.count());await prisma.\$disconnect()})()"
```
Expected: users 4, properties 15, leads 50, opportunities > 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: seed de datos de ejemplo realistas"
```

---

### Task 8: Verificación integral del Plan 1

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Ejecutar toda la suite de tests**

Run: `npm test`
Expected: PASS — 4 archivos de test (scoring, valuation, channels, alerts), 17 tests en verde.

- [ ] **Step 2: Verificar que la app compila**

Run: `npm run build`
Expected: build exitoso sin errores de TypeScript.

- [ ] **Step 3: Commit del estado verificado (si hubo ajustes)**

```bash
git add -A
git commit -m "chore: verificación integral del Plan 1 (cimientos + motores)" --allow-empty
```

---

## Self-Review — cobertura del spec

- **Modelo de datos (spec §4):** Task 2 crea las 7 entidades. ✔
- **Scoring / calificación automática (spec §6, área 7):** Task 3. ✔
- **Valuación por comparables (spec §6, área 10):** Task 4. ✔
- **Captura omnicanal / normalización (spec §6, área 4):** Task 5. ✔
- **Alertas inteligentes (spec §6, área 11):** Task 6. ✔
- **Datos de ejemplo (spec §9):** Task 7. ✔
- **Roles admin/agent (spec §7):** modelados en Task 2 y sembrados en Task 7; la aplicación de permisos (auth) va en Plan 3. ✔ (dependencia anotada)
- **UI de las áreas (spec §5):** fuera de este plan — Planes 2–5. Anotado explícitamente.

Sin placeholders: cada paso de código incluye el código real. Tipos consistentes entre tasks (`LeadChannel` definido en Task 3 y reutilizado en Task 5; nombres de campos del schema de Task 2 usados en el seed de Task 7).
