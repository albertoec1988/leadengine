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
