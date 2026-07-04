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
  let totalPrincipalPaidRounded = 0
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
    const principalRounded = Math.round(principalPaid)
    totalPrincipalPaidRounded += principalRounded
    amortization.push({
      year,
      principalPaid: principalRounded,
      interestPaid: Math.round(interestPaid),
      balance: Math.max(0, Math.round(balance)),
    })
  }

  // Adjust last year's principal to ensure sum equals loanAmount exactly
  if (amortization.length > 0) {
    const difference = Math.round(loanAmount - totalPrincipalPaidRounded)
    amortization[amortization.length - 1].principalPaid += difference
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
