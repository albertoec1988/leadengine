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
