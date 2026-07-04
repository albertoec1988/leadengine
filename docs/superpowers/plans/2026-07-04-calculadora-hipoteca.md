# Calculadora de Hipoteca — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página `/mortgage-calculator` propia (fórmulas Bankrate) con motor puro testeado, donut de desglose accesible, prefill desde el detalle de propiedad y entrada en el menú.

**Architecture:** Motor 100% puro en `lib/mortgage.ts` (TDD, sin imports de framework). UI client (`MortgageCalculator`) que recalcula con `useMemo`; donut SVG presentacional (`PaymentDonut`) con paleta categórica VALIDADA (dataviz: light+dark, CVD 23.1) y leyenda-tabla con importes. Página server ligera que lee `?price=` y pasa `initialPrice`.

**Tech Stack:** Next.js 16, React 19, vitest. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-07-04-calculadora-hipoteca-design.md`

## Global Constraints

- Fórmula P&I: `M = P·[r(1+r)ⁿ/((1+r)ⁿ−1)]`, `r = annualRatePct/100/12`, `n = termYears·12`; **r=0 → P/n**.
- PMI solo si `downPayment/homePrice < 0.20`: `loanAmount · 0.008 / 12` (`PMI_ANNUAL_RATE = 0.008`, constante exportada, comentada como estimación del rango Bankrate 0.46%–1.5%).
- Motor sin throws: entradas no finitas/negativas → 0; `downPayment` clamp a `[0, homePrice]`; `homePrice<=0` → resultado en ceros.
- **Paleta del donut (VALIDADA — no cambiar sin re-validar):** P&I `#3567A6`, Taxes `#C77F1F`, Insurance `#17A2A2`, HOA `#9A5CB4`, PMI `#C0526E`. Orden fijo por entidad; segmentos con 2px de gap (color superficie); importes/labels SIEMPRE en tokens de texto (no en color de serie); la leyenda con importes es la vista-tabla.
- Copy en INGLÉS; identidad FFR (`font-montserrat`, `text-ffr-navy`, `text-ffr-slate`, clases de campo existentes).
- Disclaimer obligatorio: "These figures are estimates for illustration purposes only and do not constitute a loan offer."
- Commits terminan con: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Motor `lib/mortgage.ts` (TDD)

**Files:**
- Create: `lib/mortgage.ts`
- Test: `lib/mortgage.test.ts`

**Interfaces:**
- Produces (exactas):

```ts
export const PMI_ANNUAL_RATE = 0.008
export type MortgageInputs = {
  homePrice: number; downPayment: number; termYears: number
  annualRatePct: number; propertyTaxYearly: number; insuranceYearly: number; hoaMonthly: number
}
export type AmortizationYear = { year: number; principalPaid: number; interestPaid: number; balance: number }
export type MortgageResult = {
  loanAmount: number; downPaymentPct: number
  monthlyPI: number; monthlyTax: number; monthlyInsurance: number; monthlyHOA: number; monthlyPMI: number
  totalMonthly: number; totalInterest: number; totalCost: number; payoffMonths: number
  amortization: AmortizationYear[]
}
export function monthlyPI(principal: number, annualRatePct: number, termYears: number): number
export function buildMortgage(inputs: MortgageInputs): MortgageResult
export function pctFromDown(homePrice: number, down: number): number   // 0..100, 1 decimal
export function downFromPct(homePrice: number, pct: number): number    // USD entero
```

- [ ] **Step 1: Test que falla**

```ts
// lib/mortgage.test.ts
import { describe, it, expect } from "vitest"
import { monthlyPI, buildMortgage, pctFromDown, downFromPct, PMI_ANNUAL_RATE } from "@/lib/mortgage"

const BASE = {
  homePrice: 400_000, downPayment: 80_000, termYears: 30, annualRatePct: 6.5,
  propertyTaxYearly: 4_400, insuranceYearly: 1_800, hoaMonthly: 0,
}

describe("monthlyPI", () => {
  it("matches the canonical Bankrate example (320k @ 6.5% 30y ≈ $2,022.62)", () => {
    expect(monthlyPI(320_000, 6.5, 30)).toBeCloseTo(2022.62, 1)
  })
  it("handles 0% rate as simple division", () => {
    expect(monthlyPI(120_000, 0, 10)).toBeCloseTo(1000, 6)
  })
})

describe("buildMortgage", () => {
  it("computes the full PITI breakdown at 20% down (no PMI)", () => {
    const r = buildMortgage(BASE)
    expect(r.loanAmount).toBe(320_000)
    expect(r.downPaymentPct).toBeCloseTo(20, 5)
    expect(r.monthlyPMI).toBe(0)
    expect(r.monthlyTax).toBeCloseTo(4_400 / 12, 6)
    expect(r.monthlyInsurance).toBeCloseTo(150, 6)
    expect(r.totalMonthly).toBeCloseTo(r.monthlyPI + r.monthlyTax + r.monthlyInsurance, 6)
    expect(r.payoffMonths).toBe(360)
  })

  it("applies PMI below 20% down at PMI_ANNUAL_RATE", () => {
    const r = buildMortgage({ ...BASE, downPayment: 40_000 }) // 10%
    expect(r.monthlyPMI).toBeCloseTo((360_000 * PMI_ANNUAL_RATE) / 12, 6)
    expect(r.totalMonthly).toBeGreaterThan(r.monthlyPI + r.monthlyTax + r.monthlyInsurance)
  })

  it("amortization sums principal to the loan and ends at zero balance", () => {
    const r = buildMortgage(BASE)
    const principalSum = r.amortization.reduce((s, y) => s + y.principalPaid, 0)
    expect(principalSum).toBeCloseTo(r.loanAmount, 0) // ±$1 por redondeo
    expect(r.amortization.at(-1)!.balance).toBeCloseTo(0, 0)
    expect(r.amortization).toHaveLength(30)
  })

  it("totalInterest is consistent with monthlyPI over the term", () => {
    const r = buildMortgage(BASE)
    expect(r.totalInterest).toBeCloseTo(r.monthlyPI * 360 - r.loanAmount, 0)
    expect(r.totalCost).toBeCloseTo(r.loanAmount + r.totalInterest, 6)
  })

  it("never throws: clamps invalid inputs to safe values", () => {
    const zero = buildMortgage({ homePrice: 0, downPayment: 50, termYears: 30, annualRatePct: 6.5, propertyTaxYearly: 0, insuranceYearly: 0, hoaMonthly: 0 })
    expect(zero.totalMonthly).toBe(0)
    const clamped = buildMortgage({ ...BASE, downPayment: 999_999_999 })
    expect(clamped.loanAmount).toBe(0)
    const nan = buildMortgage({ ...BASE, annualRatePct: Number.NaN })
    expect(Number.isFinite(nan.totalMonthly)).toBe(true)
  })
})

describe("down payment conversion", () => {
  it("round-trips dollars and percent", () => {
    expect(pctFromDown(400_000, 80_000)).toBe(20)
    expect(downFromPct(400_000, 12.5)).toBe(50_000)
    expect(pctFromDown(0, 100)).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que falla** — `npm test -- lib/mortgage.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `lib/mortgage.ts`**

```ts
// lib/mortgage.ts
// Motor puro de hipoteca (fórmulas estándar documentadas por Bankrate).
// Sin imports de framework: testeable con vitest y usable en client/server.

export const PMI_ANNUAL_RATE = 0.008 // 0.8%/año: punto medio del rango 0.46%–1.5% (estimación Bankrate)

export type MortgageInputs = {
  homePrice: number
  downPayment: number
  termYears: number
  annualRatePct: number
  propertyTaxYearly: number
  insuranceYearly: number
  hoaMonthly: number
}

export type AmortizationYear = {
  year: number
  principalPaid: number
  interestPaid: number
  balance: number
}

export type MortgageResult = {
  loanAmount: number
  downPaymentPct: number
  monthlyPI: number
  monthlyTax: number
  monthlyInsurance: number
  monthlyHOA: number
  monthlyPMI: number
  totalMonthly: number
  totalInterest: number
  totalCost: number
  payoffMonths: number
  amortization: AmortizationYear[]
}

const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

// M = P · [ r(1+r)^n / ((1+r)^n − 1) ]  ·  r=0 → P/n
export function monthlyPI(principal: number, annualRatePct: number, termYears: number): number {
  const P = safe(principal)
  const years = safe(termYears)
  const n = Math.round(years * 12)
  if (P === 0 || n === 0) return 0
  const r = safe(annualRatePct) / 100 / 12
  if (r === 0) return P / n
  const growth = Math.pow(1 + r, n)
  return (P * (r * growth)) / (growth - 1)
}

export function pctFromDown(homePrice: number, down: number): number {
  const price = safe(homePrice)
  if (price === 0) return 0
  return Math.round((safe(down) / price) * 1000) / 10
}

export function downFromPct(homePrice: number, pct: number): number {
  return Math.round(safe(homePrice) * (safe(pct) / 100))
}

export function buildMortgage(inputs: MortgageInputs): MortgageResult {
  const homePrice = safe(inputs.homePrice)
  const downPayment = Math.min(safe(inputs.downPayment), homePrice)
  const termYears = safe(inputs.termYears)
  const n = Math.round(termYears * 12)
  const loanAmount = homePrice - downPayment
  const downPaymentPct = homePrice === 0 ? 0 : (downPayment / homePrice) * 100

  const pi = monthlyPI(loanAmount, inputs.annualRatePct, termYears)
  const monthlyTax = safe(inputs.propertyTaxYearly) / 12
  const monthlyInsurance = safe(inputs.insuranceYearly) / 12
  const monthlyHOA = safe(inputs.hoaMonthly)
  const monthlyPMI = downPaymentPct < 20 && loanAmount > 0 ? (loanAmount * PMI_ANNUAL_RATE) / 12 : 0

  // Amortización mes a mes agregada por año.
  const r = safe(inputs.annualRatePct) / 100 / 12
  const amortization: AmortizationYear[] = []
  let balance = loanAmount
  for (let year = 1; year <= Math.round(termYears); year++) {
    let principalPaid = 0
    let interestPaid = 0
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break
      const interest = balance * r
      const principal = Math.min(pi - interest, balance)
      interestPaid += interest
      principalPaid += principal
      balance -= principal
    }
    amortization.push({
      year,
      principalPaid: Math.round(principalPaid),
      interestPaid: Math.round(interestPaid),
      balance: Math.max(0, Math.round(balance)),
    })
  }

  const totalInterest = loanAmount === 0 ? 0 : pi * n - loanAmount

  return {
    loanAmount,
    downPaymentPct,
    monthlyPI: pi,
    monthlyTax,
    monthlyInsurance,
    monthlyHOA,
    monthlyPMI,
    totalMonthly: pi + monthlyTax + monthlyInsurance + monthlyHOA + monthlyPMI,
    totalInterest,
    totalCost: loanAmount + totalInterest,
    payoffMonths: loanAmount === 0 ? 0 : n,
    amortization,
  }
}
```

- [ ] **Step 4: Verificar que pasa** — `npm test -- lib/mortgage.test.ts` → PASS (9 tests). Nota: si `homePrice=0` el test espera `totalMonthly` 0 — con tax/insurance 0 en ese caso del test se cumple.

- [ ] **Step 5: Commit**

```bash
git add lib/mortgage.ts lib/mortgage.test.ts
git commit -m "feat(mortgage): motor puro de hipoteca con fórmulas Bankrate (TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `PaymentDonut` (SVG accesible, specs dataviz)

**Files:**
- Create: `components/site/PaymentDonut.tsx`

**Interfaces:**
- Produces: `PaymentDonut({ segments, centerLabel, centerValue })` con `export type DonutSegment = { key: string; label: string; value: number; color: string }`. Presentacional puro (sin "use client" — no usa hooks).

- [ ] **Step 1: Implementar `components/site/PaymentDonut.tsx`**

```tsx
// Donut de desglose del pago (SVG puro, sin librerías).
// Reglas dataviz aplicadas: paleta categórica validada (la pasa el consumidor),
// gaps de 2px entre segmentos, número héroe centrado en tokens de texto,
// leyenda con importes = vista-tabla (identidad nunca solo por color).

export type DonutSegment = {
  key: string
  label: string
  value: number
  color: string
}

const R = 15.915 // radio tal que la circunferencia = 100 (porcentajes directos)
const GAP = 1.2  // ≈2px de separación entre segmentos en viewBox 42

export function PaymentDonut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
}) {
  const visible = segments.filter((s) => s.value > 0)
  const total = visible.reduce((s, x) => s + x.value, 0)

  let offset = 25 // empezar arriba (12 en punto)
  const arcs = visible.map((s) => {
    const pct = total === 0 ? 0 : (s.value / total) * 100
    const dash = Math.max(0, pct - GAP)
    const arc = { ...s, pct, dash, offset }
    offset -= pct
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`${centerLabel}: ${centerValue}. ${visible.map((s) => `${s.label} ${formatUSDShort(s.value)}`).join(", ")}`}>
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-0">
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--paper-2)" strokeWidth="5" />
          {total > 0 &&
            arcs.map((a) => (
              <circle
                key={a.key}
                cx="21"
                cy="21"
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth="5"
                strokeLinecap="butt"
                strokeDasharray={`${a.dash} ${100 - a.dash}`}
                strokeDashoffset={a.offset}
                className="transition-[stroke-width] duration-150 hover:[stroke-width:6]"
              >
                <title>{`${a.label}: ${formatUSDShort(a.value)}/mo (${a.pct.toFixed(1)}%)`}</title>
              </circle>
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wide text-ffr-slate">{centerLabel}</span>
          <span className="font-montserrat text-2xl font-extrabold text-ffr-navy">{centerValue}</span>
        </div>
      </div>

      {/* Leyenda con importes: identidad por swatch+texto, valores en tokens de texto */}
      <ul className="w-full space-y-2">
        {visible.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-ffr-slate">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-medium text-ffr-navy">{formatUSDShort(s.value)}/mo</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatUSDShort(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 3: Commit**

```bash
git add components/site/PaymentDonut.tsx
git commit -m "feat(mortgage): donut de desglose accesible con paleta validada

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `MortgageCalculator` (formulario + resultados en vivo)

**Files:**
- Create: `components/site/MortgageCalculator.tsx`

**Interfaces:**
- Consumes: `buildMortgage, pctFromDown, downFromPct, PMI_ANNUAL_RATE, type MortgageInputs` de `@/lib/mortgage`; `PaymentDonut, type DonutSegment`; `AnimatedCta`.
- Produces: `MortgageCalculator({ initialPrice }: { initialPrice?: number })`.

- [ ] **Step 1: Implementar `components/site/MortgageCalculator.tsx`**

```tsx
"use client"

import { useMemo, useState } from "react"
import { buildMortgage, pctFromDown, downFromPct, PMI_ANNUAL_RATE } from "@/lib/mortgage"
import { PaymentDonut, type DonutSegment } from "@/components/site/PaymentDonut"
import { AnimatedCta } from "@/components/motion/AnimatedCta"

// Paleta categórica VALIDADA (dataviz, light+dark, CVD 23.1) — orden fijo por entidad.
const COLORS = {
  pi: "#3567A6",
  tax: "#C77F1F",
  insurance: "#17A2A2",
  hoa: "#9A5CB4",
  pmi: "#C0526E",
} as const

const TERMS = [10, 15, 20, 30] as const
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

const usd = (n: number, cents = false) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents ? 2 : 0 }).format(n)

export function MortgageCalculator({ initialPrice }: { initialPrice?: number }) {
  const startPrice = initialPrice && initialPrice > 0 ? Math.round(initialPrice) : 450_000
  const [homePrice, setHomePrice] = useState(startPrice)
  const [downMode, setDownMode] = useState<"$" | "%">("%")
  const [downPct, setDownPct] = useState(20)
  const [downUsd, setDownUsd] = useState(downFromPct(startPrice, 20))
  const [termYears, setTermYears] = useState<number>(30)
  const [ratePct, setRatePct] = useState(6.5)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [taxYearly, setTaxYearly] = useState(Math.round(startPrice * 0.011))
  const [insuranceYearly, setInsuranceYearly] = useState(1_800)
  const [hoaMonthly, setHoaMonthly] = useState(0)
  const [showSchedule, setShowSchedule] = useState(false)

  const downPayment = downMode === "%" ? downFromPct(homePrice, downPct) : downUsd

  const result = useMemo(
    () =>
      buildMortgage({
        homePrice,
        downPayment,
        termYears,
        annualRatePct: ratePct,
        propertyTaxYearly: taxYearly,
        insuranceYearly,
        hoaMonthly,
      }),
    [homePrice, downPayment, termYears, ratePct, taxYearly, insuranceYearly, hoaMonthly],
  )

  const segments: DonutSegment[] = [
    { key: "pi", label: "Principal & interest", value: result.monthlyPI, color: COLORS.pi },
    { key: "tax", label: "Property taxes", value: result.monthlyTax, color: COLORS.tax },
    { key: "insurance", label: "Home insurance", value: result.monthlyInsurance, color: COLORS.insurance },
    { key: "hoa", label: "HOA fees", value: result.monthlyHOA, color: COLORS.hoa },
    { key: "pmi", label: "PMI", value: result.monthlyPMI, color: COLORS.pmi },
  ]

  const payoff = new Date()
  payoff.setMonth(payoff.getMonth() + result.payoffMonths)
  const payoffLabel = result.payoffMonths
    ? payoff.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—"

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ""))
    return Number.isFinite(n) ? n : 0
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Formulario */}
      <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <div className="grid gap-4">
          <div>
            <label className={labelClass} htmlFor="mc-price">Home price</label>
            <input
              id="mc-price" inputMode="numeric" className={fieldClass} value={homePrice.toLocaleString("en-US")}
              onChange={(e) => {
                const v = num(e.target.value)
                setHomePrice(v)
                setTaxYearly(Math.round(v * 0.011))
                if (downMode === "%") setDownUsd(downFromPct(v, downPct))
              }}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className={labelClass + " mb-0"} htmlFor="mc-down">Down payment</label>
              <div className="flex overflow-hidden rounded-md border border-line text-xs" role="group" aria-label="Down payment unit">
                {(["%", "$"] as const).map((m) => (
                  <button
                    key={m} type="button" aria-pressed={downMode === m}
                    onClick={() => {
                      if (m === downMode) return
                      if (m === "$") setDownUsd(downFromPct(homePrice, downPct))
                      else setDownPct(pctFromDown(homePrice, downUsd))
                      setDownMode(m)
                    }}
                    className={`px-2.5 py-1 font-medium ${downMode === m ? "bg-ffr-navy text-white" : "text-muted hover:text-ink"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {downMode === "%" ? (
              <input
                id="mc-down" inputMode="decimal" className={fieldClass} value={downPct}
                onChange={(e) => { const v = num(e.target.value); setDownPct(v); setDownUsd(downFromPct(homePrice, v)) }}
                aria-describedby="mc-down-hint"
              />
            ) : (
              <input
                id="mc-down" inputMode="numeric" className={fieldClass} value={downUsd.toLocaleString("en-US")}
                onChange={(e) => { const v = num(e.target.value); setDownUsd(v); setDownPct(pctFromDown(homePrice, v)) }}
                aria-describedby="mc-down-hint"
              />
            )}
            <p id="mc-down-hint" className="mt-1 text-xs text-muted">
              {downMode === "%" ? usd(downPayment) : `${pctFromDown(homePrice, downPayment)}%`}
              {result.downPaymentPct < 20 && homePrice > 0 && (
                <span className="text-ffr-slate"> · PMI applies below 20% down (est. {(PMI_ANNUAL_RATE * 100).toFixed(1)}%/yr)</span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="mc-term">Loan term</label>
              <select id="mc-term" className={fieldClass} value={termYears} onChange={(e) => setTermYears(Number(e.target.value))}>
                {TERMS.map((t) => <option key={t} value={t}>{t} years</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="mc-rate">Interest rate (%)</label>
              <input id="mc-rate" type="number" step="0.125" min="0" className={fieldClass} value={ratePct}
                onChange={(e) => setRatePct(num(e.target.value))} />
            </div>
          </div>

          <button
            type="button" onClick={() => setShowAdvanced((v) => !v)} aria-expanded={showAdvanced}
            className="justify-self-start text-sm font-medium text-ffr-navy underline-offset-4 hover:underline"
          >
            {showAdvanced ? "− Hide" : "+ Taxes, insurance & fees"}
          </button>

          {showAdvanced && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="mc-tax">Property taxes / yr</label>
                <input id="mc-tax" inputMode="numeric" className={fieldClass} value={taxYearly.toLocaleString("en-US")}
                  onChange={(e) => setTaxYearly(num(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="mc-ins">Home insurance / yr</label>
                <input id="mc-ins" inputMode="numeric" className={fieldClass} value={insuranceYearly.toLocaleString("en-US")}
                  onChange={(e) => setInsuranceYearly(num(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="mc-hoa">HOA fees / mo</label>
                <input id="mc-hoa" inputMode="numeric" className={fieldClass} value={hoaMonthly.toLocaleString("en-US")}
                  onChange={(e) => setHoaMonthly(num(e.target.value))} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      <div>
        <div aria-live="polite">
          <PaymentDonut segments={segments} centerLabel="Est. payment" centerValue={usd(result.totalMonthly)} />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs uppercase tracking-wide text-ffr-slate">Loan amount</dt><dd className="mt-1 font-montserrat font-bold text-ffr-navy">{usd(result.loanAmount)}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-ffr-slate">Total interest</dt><dd className="mt-1 font-montserrat font-bold text-ffr-navy">{usd(result.totalInterest)}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-ffr-slate">Total cost</dt><dd className="mt-1 font-montserrat font-bold text-ffr-navy">{usd(result.totalCost)}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-ffr-slate">Payoff date</dt><dd className="mt-1 font-montserrat font-bold text-ffr-navy">{payoffLabel}</dd></div>
        </dl>

        <button
          type="button" onClick={() => setShowSchedule((v) => !v)} aria-expanded={showSchedule}
          className="mt-6 text-sm font-medium text-ffr-navy underline-offset-4 hover:underline"
        >
          {showSchedule ? "− Hide amortization schedule" : "+ Amortization schedule"}
        </button>

        {showSchedule && (
          <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-paper-2">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="px-3 py-2 font-medium">Year</th>
                  <th scope="col" className="px-3 py-2 font-medium">Principal</th>
                  <th scope="col" className="px-3 py-2 font-medium">Interest</th>
                  <th scope="col" className="px-3 py-2 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.amortization.map((y) => (
                  <tr key={y.year} className="border-t border-line">
                    <th scope="row" className="px-3 py-1.5 text-left font-medium text-ink">{y.year}</th>
                    <td className="px-3 py-1.5 text-muted">{usd(y.principalPaid)}</td>
                    <td className="px-3 py-1.5 text-muted">{usd(y.interestPaid)}</td>
                    <td className="px-3 py-1.5 text-muted">{usd(y.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-muted">
          These figures are estimates for illustration purposes only and do not constitute a loan offer.
        </p>

        <div className="mt-6">
          <AnimatedCta href="/contacto" variant="solid">Ready to make a move? Talk to our brokers</AnimatedCta>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar** — `npx tsc --noEmit && npm run build` → OK.

- [ ] **Step 3: Commit**

```bash
git add components/site/MortgageCalculator.tsx
git commit -m "feat(mortgage): calculadora interactiva con desglose PITI en vivo

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Página, nav, footer y prefill desde el detalle

**Files:**
- Create: `app/(public)/mortgage-calculator/page.tsx`
- Modify: `components/site/SiteHeader.tsx` (NAV), `components/site/SiteFooter.tsx` (link), `app/(public)/propiedades/[id]/page.tsx` (link con precio)

- [ ] **Step 1: Página**

```tsx
// app/(public)/mortgage-calculator/page.tsx
import type { Metadata } from "next"
import { RevealText } from "@/components/motion/RevealText"
import { MortgageCalculator } from "@/components/site/MortgageCalculator"

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description:
    "Estimate your monthly mortgage payment — principal & interest, taxes, insurance, HOA and PMI — with Floridian First Realty.",
}

export default async function MortgageCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ price?: string }>
}) {
  const sp = await searchParams
  const initialPrice = sp.price ? Number(sp.price) : undefined

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20">
      <RevealText
        as="h1"
        className="font-montserrat text-3xl font-extrabold uppercase tracking-[0.12em] text-ffr-navy sm:text-4xl"
      >
        Mortgage Calculator
      </RevealText>
      <p className="mt-3 max-w-2xl text-ffr-slate">
        See what your monthly payment could look like — including taxes, insurance and PMI.
      </p>
      <div className="mt-10">
        <MortgageCalculator initialPrice={Number.isFinite(initialPrice) ? initialPrice : undefined} />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Nav** — en `components/site/SiteHeader.tsx`, añadir a `NAV` tras "Home Valuation": `{ href: "/mortgage-calculator", label: "Mortgage" },` (aparece en desktop y móvil automáticamente).

- [ ] **Step 3: Footer** — en `components/site/SiteFooter.tsx`, junto al link Contact añadir: `<Link href="/mortgage-calculator" className="underline-offset-4 hover:underline">Mortgage Calculator</Link>` (dentro del mismo contenedor de links, respetando clases).

- [ ] **Step 4: Prefill desde el detalle** — en `app/(public)/propiedades/[id]/page.tsx`, bajo el bloque del precio (`{formatUSD(property.price)}`), añadir:

```tsx
<Link
  href={`/mortgage-calculator?price=${property.price}`}
  className="mt-2 inline-block text-sm font-medium text-ffr-navy underline-offset-4 hover:underline"
>
  Estimate monthly payment →
</Link>
```

(Importar `Link` si no está; LEER el archivo para colocarlo sin romper el layout del bloque de precio.)

- [ ] **Step 5: Verificar** — `npx tsc --noEmit && npm run build` → OK; ruta `ƒ /mortgage-calculator` presente.

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/mortgage-calculator/page.tsx" components/site/SiteHeader.tsx components/site/SiteFooter.tsx "app/(public)/propiedades/[id]/page.tsx"
git commit -m "feat(mortgage): página, entrada en nav/footer y prefill desde el detalle

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Verificación final

- [ ] **Step 1:** `npm test` (44 = 35 + 9 nuevos) + `npm run build` → OK.
- [ ] **Step 2 (navegador, dev):** `/mortgage-calculator` calcula en vivo (canónico: 400k, 20%, 30y, 6.5% → P&I ≈ $2,022.62); toggle $/% sincroniza; bajar down a 10% muestra PMI en hint, leyenda y donut; avanzado edita tax/insurance/HOA; amortización colapsa (30 filas, balance final $0); desde una propiedad "Estimate monthly payment →" llega con el precio; CTA navega a /contacto; nav/footer muestran la entrada.
- [ ] **Step 3:** commit de ajustes si los hay.

## Self-Review

- Spec §1 (motor: fórmula, r=0, PMI 0.008, clamps, amortización, conversiones) → Task 1 con tests canónicos ✅. §2 (página + inputs con defaults exactos, donut con paleta validada, dl de totales, payoff, tabla, disclaimer, CTA, aria-live, th scope) → Tasks 2-4 ✅. §3 (nav/detalle/footer) → Task 4 ✅. §5 verificación → Task 5 ✅.
- Dataviz: paleta validada por script (light+dark) ✅; gaps entre segmentos, hero centrado en tokens de texto, leyenda-tabla con importes, identidad no-solo-color, `<title>` hover ✅; sin dual-axis ni rainbow.
- Tipos consistentes: `MortgageInputs/Result` (T1↔T3), `DonutSegment` (T2↔T3), `initialPrice` (T3↔T4). Sin placeholders.
- Nota: `payoff` usa `new Date()` en el cliente — correcto (es interactivo post-hidratación; el valor inicial SSR podría diferir un tick de mes en el borde — irrelevante).
