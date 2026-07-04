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

// Parsea texto de input a número para cálculo (comas/$ fuera, no-finito → 0).
const parseNum = (text: string) => {
  const n = Number(text.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

// Mientras se escribe: permisivo, solo descarta caracteres claramente inválidos
// y colapsa a un único punto decimal. No reformatea (evita saltos de caret).
const sanitizeTyping = (raw: string) => {
  let s = raw.replace(/[^0-9.,]/g, "")
  const dot = s.indexOf(".")
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "")
  return s
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")
const fmtDec = (n: number) => (Number.isFinite(n) ? String(n) : "0")

export function MortgageCalculator({ initialPrice }: { initialPrice?: number }) {
  const startPrice = initialPrice && initialPrice > 0 ? Math.round(initialPrice) : 450_000
  const [priceText, setPriceText] = useState(fmtInt(startPrice))
  const [downMode, setDownMode] = useState<"$" | "%">("%")
  const [downPctText, setDownPctText] = useState(fmtDec(20))
  const [downUsdText, setDownUsdText] = useState(fmtInt(downFromPct(startPrice, 20)))
  const [termYears, setTermYears] = useState<number>(30)
  const [rateText, setRateText] = useState(fmtDec(6.5))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [taxText, setTaxText] = useState(fmtInt(Math.round(startPrice * 0.011)))
  const [insuranceText, setInsuranceText] = useState(fmtInt(1_800))
  const [hoaText, setHoaText] = useState(fmtInt(0))
  const [showSchedule, setShowSchedule] = useState(false)

  const homePrice = parseNum(priceText)
  const downPctNum = parseNum(downPctText)
  const downUsdNum = parseNum(downUsdText)
  const ratePct = parseNum(rateText)
  const taxYearly = parseNum(taxText)
  const insuranceYearly = parseNum(insuranceText)
  const hoaMonthly = parseNum(hoaText)

  const downPayment = downMode === "%" ? downFromPct(homePrice, downPctNum) : downUsdNum

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

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Formulario */}
      <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8">
        <div className="grid gap-4">
          <div>
            <label className={labelClass} htmlFor="mc-price">Home price</label>
            <input
              id="mc-price" inputMode="numeric" className={fieldClass} value={priceText}
              onChange={(e) => {
                const t = sanitizeTyping(e.target.value)
                setPriceText(t)
                setTaxText(fmtInt(Math.round(parseNum(t) * 0.011)))
              }}
              onBlur={() => setPriceText(fmtInt(parseNum(priceText)))}
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
                      if (m === "$") setDownUsdText(fmtInt(downFromPct(homePrice, downPctNum)))
                      else setDownPctText(fmtDec(pctFromDown(homePrice, downUsdNum)))
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
                id="mc-down" inputMode="decimal" className={fieldClass} value={downPctText}
                onChange={(e) => {
                  const t = sanitizeTyping(e.target.value)
                  setDownPctText(t)
                  setDownUsdText(fmtInt(downFromPct(homePrice, parseNum(t))))
                }}
                onBlur={() => setDownPctText(fmtDec(parseNum(downPctText)))}
                aria-describedby="mc-down-hint"
              />
            ) : (
              <input
                id="mc-down" inputMode="numeric" className={fieldClass} value={downUsdText}
                onChange={(e) => {
                  const t = sanitizeTyping(e.target.value)
                  setDownUsdText(t)
                  setDownPctText(fmtDec(pctFromDown(homePrice, parseNum(t))))
                }}
                onBlur={() => setDownUsdText(fmtInt(parseNum(downUsdText)))}
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
              <input id="mc-rate" inputMode="decimal" className={fieldClass} value={rateText}
                onChange={(e) => setRateText(sanitizeTyping(e.target.value))}
                onBlur={() => setRateText(fmtDec(parseNum(rateText)))} />
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
                <input id="mc-tax" inputMode="numeric" className={fieldClass} value={taxText}
                  onChange={(e) => setTaxText(sanitizeTyping(e.target.value))}
                  onBlur={() => setTaxText(fmtInt(parseNum(taxText)))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="mc-ins">Home insurance / yr</label>
                <input id="mc-ins" inputMode="numeric" className={fieldClass} value={insuranceText}
                  onChange={(e) => setInsuranceText(sanitizeTyping(e.target.value))}
                  onBlur={() => setInsuranceText(fmtInt(parseNum(insuranceText)))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="mc-hoa">HOA fees / mo</label>
                <input id="mc-hoa" inputMode="numeric" className={fieldClass} value={hoaText}
                  onChange={(e) => setHoaText(sanitizeTyping(e.target.value))}
                  onBlur={() => setHoaText(fmtInt(parseNum(hoaText)))} />
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
