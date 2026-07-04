# Diseño: Calculadora de hipoteca propia (fórmulas Bankrate)

**Fecha:** 2026-07-04 · **Estado:** Aprobado
**Referencia:** bankrate.com/mortgages/mortgage-calculator (investigada 2026-07-04). El sitio original del cliente enlazaba a Bankrate externamente; esta calculadora la reemplaza con una propia.
**Decisiones del usuario:** página propia `/mortgage-calculator` + prefill desde el detalle de propiedad · inglés · CTA suave a `/contacto` (sin lead capture propio).

## 1. Motor de cálculo — `lib/mortgage.ts` (puro, TDD)

Tipos e interfaz:

```ts
export type MortgageInputs = {
  homePrice: number        // USD
  downPayment: number      // USD (el UI sincroniza $/%)
  termYears: 10 | 15 | 20 | 30
  annualRatePct: number    // ej. 6.5
  propertyTaxYearly: number  // USD/año
  insuranceYearly: number    // USD/año
  hoaMonthly: number         // USD/mes
}

export type MortgageResult = {
  loanAmount: number
  downPaymentPct: number
  monthlyPI: number
  monthlyTax: number
  monthlyInsurance: number
  monthlyHOA: number
  monthlyPMI: number        // 0 si downPaymentPct >= 20
  totalMonthly: number      // PITI + HOA + PMI
  totalInterest: number     // sobre la vida del préstamo (solo P&I)
  totalCost: number         // loanAmount + totalInterest
  payoffMonths: number      // termYears * 12
  amortization: { year: number; principalPaid: number; interestPaid: number; balance: number }[]
}
```

Reglas (Bankrate):
- `monthlyPI = P · [ r(1+r)ⁿ / ((1+r)ⁿ − 1) ]` con `r = annualRatePct/100/12`, `n = termYears*12`. **Caso borde r=0 → P/n.**
- **PMI**: si `downPayment/homePrice < 0.20` → `monthlyPMI = loanAmount * PMI_ANNUAL_RATE / 12` con `PMI_ANNUAL_RATE = 0.008` (0.8%, punto medio documentado del rango Bankrate 0.46%–1.5%; constante exportada y comentada como estimación).
- Impuestos/seguro/HOA se suman linealmente al pago (tax/12, insurance/12, hoa).
- **Amortización anual**: iterar los n meses (interés del mes = balance·r; principal = monthlyPI − interés; balance −= principal) agregando por año; el último año ajusta el residuo de redondeo (balance final = 0, clamp a ≥0).
- Guardas: entradas no finitas o negativas → tratar como 0; `downPayment > homePrice` → clamp al precio; `homePrice=0` → resultado en ceros (el UI valida, el motor no lanza).
- Helpers de conversión: `pctFromDown(homePrice, down)`, `downFromPct(homePrice, pct)` (redondeo a entero USD).

Tests (vitest, `lib/mortgage.test.ts`): caso canónico verificable a mano ($400k precio, $80k down (20%), 30y, 6.5% → loan 320k, `monthlyPI ≈ $2,022.62`; PMI 0); PMI activo con down 10% (= loan·0.008/12); r=0 → P/n exacto; suma amortización: Σprincipal ≈ loanAmount y balance final 0 (±$1); totalInterest = monthlyPI·n − loanAmount (±$1 por redondeo); clamps de entradas inválidas; conversiones $↔%.

## 2. Página `/mortgage-calculator`

- `app/(public)/mortgage-calculator/page.tsx` (server): metadata EN ("Mortgage Calculator | Floridian First Realty" + descripción); lee `searchParams.price` (número opcional) y renderiza `<MortgageCalculator initialPrice={...} />`. Página estática/ligera (searchParams la hace dinámica — aceptado).
- `components/site/MortgageCalculator.tsx` (client):
  - **Inputs** (recalculo en vivo con `useMemo`, sin botón): Home price ($, default 450 000 o `initialPrice`); Down payment con **toggle $ | %** sincronizado (default 20%); Loan term select 10/15/20/30 (default 30); Interest rate (%, default 6.5, step 0.125); "Taxes, insurance & fees" colapsable: Property taxes/yr (default = 1.1% del precio, editable), Homeowners insurance/yr (default $1,800), HOA/mo (default $0).
  - **Resultados**: total mensual grande (Montserrat, navy) + **donut SVG** de desglose (P&I / taxes / insurance / HOA / PMI — colores y reglas según la skill dataviz, a consultar en la implementación) con leyenda de importes; línea de PMI solo si aplica con nota "PMI applies with less than 20% down (est. 0.8%/yr)"; Loan amount, Total interest, Total cost, Payoff date (mes/año calculado desde hoy); **Amortization schedule** anual colapsable (Year, Principal, Interest, Balance).
  - Estética FFR (navy/Montserrat/tokens), `RevealText` para el título; formularios con las clases de campo existentes.
  - Disclaimer: "These figures are estimates for illustration purposes only and do not constitute a loan offer."
  - **CTA suave**: "Ready to make a move? Talk to our brokers →" (`AnimatedCta` → `/contacto`).
- Accesibilidad: labels reales, `aria-live="polite"` en el total mensual, tabla con `<th scope>`.

## 3. Integración

- `components/site/SiteHeader.tsx`: nueva entrada NAV `{ href: "/mortgage-calculator", label: "Mortgage" }` (desktop y menú móvil).
- `app/(public)/propiedades/[id]/page.tsx`: bajo el precio, link "Estimate monthly payment →" a `/mortgage-calculator?price=${property.price}`.
- Footer: link "Mortgage Calculator" junto a Contact.

## 4. Fuera de alcance
- Tasas en vivo/por zip (Bankrate las ofrece; nosotros usamos default editable 6.5%).
- Credit score, refinance, extra payments.
- Persistencia/lead capture (CTA suave a contacto).

## 5. Verificación
- Unit: `lib/mortgage.test.ts` (números canónicos arriba).
- Build/tsc por tarea; navegador: prefill desde una propiedad, toggle $/%, PMI aparece <20%, donut coherente, amortización colapsa, CTA navega.
- Sin BD/env: deploy = merge + push.
